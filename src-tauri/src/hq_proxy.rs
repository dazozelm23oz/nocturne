use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

static PROXY_PORT: AtomicU16 = AtomicU16::new(0);

pub fn get_proxy_port() -> u16 {
    PROXY_PORT.load(Ordering::SeqCst)
}

/// Starts an ultra-lightweight async stream proxy that bypasses cross-origin restrictions,
/// injects Access-Control-Allow-Origin: *, and passes HTTP Range requests transparently
/// to the Web Audio element.
pub async fn start_hq_stream_proxy() {
    let listener = match TcpListener::bind("127.0.0.1:0").await {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind local stream proxy: {}", e);
            return;
        }
    };

    let local_addr = match listener.local_addr() {
        Ok(addr) => addr,
        Err(e) => {
            log::error!("Failed to get local stream proxy addr: {}", e);
            return;
        }
    };

    PROXY_PORT.store(local_addr.port(), Ordering::SeqCst);
    log::info!("Nocturne HQ Stream Proxy running on http://127.0.0.1:{}", local_addr.port());

    let client = Arc::new(reqwest::Client::builder().build().unwrap_or_default());

    tokio::spawn(async move {
        loop {
            if let Ok((mut socket, _)) = listener.accept().await {
                let client = Arc::clone(&client);
                tokio::spawn(async move {
                    handle_proxy_client(&mut socket, client).await;
                });
            }
        }
    });
}

async fn handle_proxy_client(socket: &mut tokio::net::TcpStream, client: Arc<reqwest::Client>) {
    let mut buf = [0u8; 4096];
    let n = match socket.read(&mut buf).await {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let req_str = String::from_utf8_lossy(&buf[..n]);
    let mut lines = req_str.lines();
    let request_line = match lines.next() {
        Some(l) => l,
        None => return,
    };

    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return;
    }

    let method = parts[0];
    let path = parts[1];

    if method == "OPTIONS" {
        let cors_resp = "HTTP/1.1 204 No Content\r\n\
Access-Control-Allow-Origin: *\r\n\
Access-Control-Allow-Methods: GET, OPTIONS\r\n\
Access-Control-Allow-Headers: Range, Content-Type\r\n\
Access-Control-Max-Age: 86400\r\n\r\n";
        let _ = socket.write_all(cors_resp.as_bytes()).await;
        return;
    }

    // Parse target url from query: /stream?url=https%3A%2F%2F...
    let target_url = if let Some(pos) = path.find("url=") {
        let raw_url = &path[pos + 4..];
        let unescaped = urlencoding::decode(raw_url).unwrap_or_default().to_string();
        unescaped
    } else {
        return;
    };

    if target_url.is_empty() {
        return;
    }

    // Extract incoming Range header if present
    let mut range_header: Option<String> = None;
    for line in lines {
        if line.to_lowercase().starts_with("range:") {
            range_header = Some(line["range:".len()..].trim().to_string());
            break;
        }
    }

    let mut upstream_req = client.get(&target_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        .header("Referer", "https://www.kuwo.cn/");

    if let Some(ref range) = range_header {
        upstream_req = upstream_req.header("Range", range);
    }

    let mut upstream_resp = match upstream_req.send().await {
        Ok(r) => r,
        Err(_) => {
            let err_resp = "HTTP/1.1 502 Bad Gateway\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            let _ = socket.write_all(err_resp.as_bytes()).await;
            return;
        }
    };

    let status = upstream_resp.status();
    let status_code = status.as_u16();
    let reason = status.canonical_reason().unwrap_or("OK");

    let mut response_headers = format!(
        "HTTP/1.1 {} {}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges\r\n",
        status_code, reason
    );

    for (k, v) in upstream_resp.headers() {
        let name = k.as_str().to_lowercase();
        if name == "content-type" || name == "content-length" || name == "content-range" || name == "accept-ranges" {
            if let Ok(val) = v.to_str() {
                response_headers.push_str(&format!("{}: {}\r\n", k.as_str(), val));
            }
        }
    }
    response_headers.push_str("\r\n");

    if socket.write_all(response_headers.as_bytes()).await.is_err() {
        return;
    }

    while let Ok(Some(chunk)) = upstream_resp.chunk().await {
        if socket.write_all(&chunk).await.is_err() {
            break;
        }
    }
}
