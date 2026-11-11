use async_trait::async_trait;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Quality {
    Standard,
    High,
    Lossless,
    HiRes,
    Unknown,
}

impl Quality {
    // PROVISIONAL — strings corroborated by third-party integration, endpoint unconfirmed.
    pub fn to_lx_string(&self) -> &'static str {
        match self {
            Quality::Standard => "128k",
            Quality::High => "320k",
            Quality::Lossless => "flac",
            Quality::HiRes => "flac24bit",
            Quality::Unknown => "128k",
        }
    }

    pub fn from_str_lenient(s: &str) -> Self {
        let lower = s.to_lowercase();
        if lower.contains("24bit") || lower.contains("hires") {
            Quality::HiRes
        } else if lower.contains("flac") || lower.contains("lossless") {
            Quality::Lossless
        } else if lower.contains("320") || lower.contains("high") {
            Quality::High
        } else if lower.contains("128") || lower.contains("standard") {
            Quality::Standard
        } else {
            Quality::Unknown
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HqTrack {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub source: String, // "netease", "kuwo", "qq", etc.
    pub duration_seconds: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HqStream {
    pub url: String,
    pub quality: Quality,
    pub source: String,
    pub bitrate_kbps: Option<u32>,
    pub format: Option<String>,
    pub ttl_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
pub enum HqError {
    NoMatch(String),
    AuthFailed(String),
    RateLimited(String),
    Network(String),
    Timeout(String),
    ApiShape(String),
    BackendDown(String),
    QualityDowngraded {
        requested: Quality,
        resolved: Quality,
        stream: HqStream,
    },
}

impl std::fmt::Display for HqError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for HqError {}

#[async_trait]
pub trait HqBackend: Send + Sync {
    fn name(&self) -> &'static str;
    async fn search(&self, query: &str) -> Result<Vec<HqTrack>, HqError>;
    async fn resolve(
        &self,
        source: &str,
        track_id: &str,
        track_title: &str,
        track_artist: &str,
        requested_quality: Quality,
    ) -> Result<HqStream, HqError>;
}

// ---------------------------------------------------------------------------
// 1. Primary: TuneHubBackend
// ---------------------------------------------------------------------------

pub struct TuneHubBackend {
    client: reqwest::Client,
    base_url: String,
}

impl TuneHubBackend {
    pub fn new() -> Self {
        let base_url = std::env::var("NOCTURNE_TUNEHUB_URL")
            .unwrap_or_else(|_| "https://api.tunefree.fun".to_string());
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
            .unwrap_or_default();
        Self { client, base_url }
    }
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct TuneHubResponse<T> {
    pub code: Option<i32>,
    pub data: Option<T>,
}

#[derive(Deserialize)]
struct TuneHubUrlData {
    pub url: Option<String>,
    pub format: Option<String>,
    pub br: Option<u32>,
}

#[derive(Deserialize)]
struct TuneHubSearchItem {
    pub id: Option<serde_json::Value>,
    pub name: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub source: Option<String>,
    pub duration: Option<u32>,
}

#[async_trait]
impl HqBackend for TuneHubBackend {
    fn name(&self) -> &'static str {
        "tunehub"
    }

    async fn search(&self, query: &str) -> Result<Vec<HqTrack>, HqError> {
        let url = format!("{}/api/?type=search&keyword={}", self.base_url, urlencoding::encode(query));

        let res = execute_with_retry(&self.client, &url, None).await?;
        let body: TuneHubResponse<Vec<TuneHubSearchItem>> = res.json().await.map_err(|e| {
            HqError::ApiShape(format!("Failed to parse TuneHub search response: {}", e))
        })?;

        let items = body.data.unwrap_or_default();
        let tracks: Vec<HqTrack> = items
            .into_iter()
            .filter_map(|item| {
                let id = match item.id? {
                    serde_json::Value::String(s) => s,
                    serde_json::Value::Number(n) => n.to_string(),
                    _ => return None,
                };
                Some(HqTrack {
                    id,
                    title: item.name.unwrap_or_default(),
                    artist: item.artist.unwrap_or_default(),
                    album: item.album.unwrap_or_default(),
                    source: item.source.unwrap_or_else(|| "netease".to_string()),
                    duration_seconds: item.duration,
                })
            })
            .collect();

        if tracks.is_empty() {
            return Err(HqError::NoMatch(format!("No matches found on TuneHub for query: {}", query)));
        }

        Ok(tracks)
    }

    // Official TuneHub format does NOT accept quality params in requests:
    // GET /api/?source={source}&id={id}&type=url
    // The server chooses quality; we parse format/br if returned, else set Quality::Unknown.
    async fn resolve(
        &self,
        source: &str,
        track_id: &str,
        _track_title: &str,
        _track_artist: &str,
        _requested_quality: Quality,
    ) -> Result<HqStream, HqError> {
        let url = format!(
            "{}/api/?source={}&id={}&type=url",
            self.base_url,
            urlencoding::encode(source),
            urlencoding::encode(track_id)
        );

        let res = execute_with_retry(&self.client, &url, None).await?;
        let body: TuneHubResponse<TuneHubUrlData> = res.json().await.map_err(|e| {
            HqError::ApiShape(format!("Failed to parse TuneHub url response: {}", e))
        })?;

        let data = body.data.ok_or_else(|| {
            HqError::NoMatch(format!("TuneHub returned empty url data for id: {}", track_id))
        })?;

        let stream_url = data.url.ok_or_else(|| {
            HqError::NoMatch("TuneHub payload did not contain stream url".to_string())
        })?;

        let resolved_quality = if let Some(ref fmt) = data.format {
            Quality::from_str_lenient(fmt)
        } else if let Some(br) = data.br {
            if br >= 900 {
                Quality::Lossless
            } else if br >= 320 {
                Quality::High
            } else {
                Quality::Standard
            }
        } else {
            Quality::Unknown
        };

        Ok(HqStream {
            url: stream_url,
            quality: resolved_quality,
            source: source.to_string(),
            bitrate_kbps: data.br,
            format: data.format,
            ttl_seconds: Some(1200), // TuneHub streams typically expire within 20 mins
        })
    }
}

// ---------------------------------------------------------------------------
// 2. PythonBackend (Local ytmusicapi/yt-dlp daemon on port 8000)
// ---------------------------------------------------------------------------

pub struct PythonBackend {
    client: reqwest::Client,
    base_url: String,
}

impl PythonBackend {
    pub fn new() -> Self {
        let base_url = std::env::var("NOCTURNE_PYTHON_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:8000".to_string());
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(12))
            .build()
            .unwrap_or_default();
        Self {
            client,
            base_url,
        }
    }
}

#[derive(Deserialize, Debug)]
struct PythonResolveResponse {
    pub url: Option<String>,
}

#[async_trait]
impl HqBackend for PythonBackend {
    fn name(&self) -> &'static str {
        "python"
    }

    async fn search(&self, query: &str) -> Result<Vec<HqTrack>, HqError> {
        // Direct resolution architecture: return candidate track directly with query details.
        // Full audio resolving and downloading is handled in the resolve step.
        let track = HqTrack {
            id: query.to_string(),
            title: query.to_string(),
            artist: "".to_string(),
            album: "".to_string(),
            source: "python".to_string(),
            duration_seconds: None,
        };
        Ok(vec![track])
    }

    async fn resolve(
        &self,
        _source: &str,
        _track_id: &str,
        track_title: &str,
        track_artist: &str,
        requested_quality: Quality,
    ) -> Result<HqStream, HqError> {
        let url = format!(
            "{}/resolve?title={}&artist={}",
            self.base_url,
            urlencoding::encode(track_title),
            urlencoding::encode(track_artist)
        );

        println!("PYTHON RESOLVE: {}", url);

        let res = self.client.get(&url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
            .send()
            .await
            .map_err(|e| HqError::Network(e.to_string()))?;

        let body: PythonResolveResponse = res.json().await
            .map_err(|e| HqError::ApiShape(format!("Failed to parse Python resolve JSON: {}", e)))?;

        let stream_url = body.url.ok_or_else(|| {
            HqError::NoMatch(format!("No stream URL returned for '{}' by '{}'", track_title, track_artist))
        })?;

        let resolved_quality = if requested_quality == Quality::Unknown {
            Quality::High
        } else {
            requested_quality
        };

        let stream = HqStream {
            url: stream_url,
            quality: resolved_quality,
            source: "python".to_string(),
            bitrate_kbps: Some(320),
            format: Some("mp3".to_string()),
            ttl_seconds: Some(3600),
        };

        Ok(stream)
    }
}

// ---------------------------------------------------------------------------
// 3. Resilient Request Helper with Exponential Backoff
// ---------------------------------------------------------------------------

async fn execute_with_retry(
    client: &reqwest::Client,
    url: &str,
    api_key: Option<&str>,
) -> Result<reqwest::Response, HqError> {
    let mut attempts = 0;
    let max_attempts = 3;
    let mut backoff = Duration::from_millis(200);

    loop {
        attempts += 1;
        let mut req = client.get(url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .header("Referer", "https://www.kugou.com/")
            .header("Cookie", "kg_mid=2333; kg_dfid=0");
        if let Some(key) = api_key {
            req = req.header("X-Request-Key", key);
        }

        match req.send().await {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    return Ok(resp);
                } else if status == reqwest::StatusCode::FORBIDDEN || status == reqwest::StatusCode::UNAUTHORIZED {
                    return Err(HqError::AuthFailed(format!("HTTP {}", status)));
                } else if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
                    if attempts < max_attempts {
                        tokio::time::sleep(backoff).await;
                        backoff = (backoff * 2).min(Duration::from_secs(3));
                        continue;
                    }
                    return Err(HqError::RateLimited("HTTP 429 Too Many Requests".to_string()));
                } else if status.is_server_error() {
                    if attempts < max_attempts {
                        tokio::time::sleep(backoff).await;
                        backoff = (backoff * 2).min(Duration::from_secs(3));
                        continue;
                    }
                    return Err(HqError::BackendDown(format!("HTTP {}", status)));
                } else if status == reqwest::StatusCode::NOT_FOUND {
                    return Err(HqError::NoMatch("HTTP 404 Track Not Found".to_string()));
                } else {
                    return Err(HqError::ApiShape(format!("Unexpected HTTP status {}", status)));
                }
            }
            Err(e) => {
                if e.is_timeout() {
                    if attempts < max_attempts {
                        tokio::time::sleep(backoff).await;
                        backoff = (backoff * 2).min(Duration::from_secs(3));
                        continue;
                    }
                    return Err(HqError::Timeout("Request timed out after 8s".to_string()));
                }
                if attempts < max_attempts {
                    tokio::time::sleep(backoff).await;
                    backoff = (backoff * 2).min(Duration::from_secs(3));
                    continue;
                }
                return Err(HqError::Network(e.to_string()));
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4. In-Flight Invalidation & Deduplication + SQLite Search Cache
// ---------------------------------------------------------------------------

pub struct HqManager {
    backend: Arc<dyn HqBackend>,
    db_conn: Mutex<Connection>,
    inflight_resolves: Arc<tokio::sync::Mutex<HashMap<String, Instant>>>,
}

impl HqManager {
    pub fn new(backend: Arc<dyn HqBackend>, db_path: &str) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS hq_search_cache (
                cache_key TEXT PRIMARY KEY,
                track_id TEXT NOT NULL,
                source TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        Ok(Self {
            backend,
            db_conn: Mutex::new(conn),
            inflight_resolves: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        })
    }

    pub async fn search_track(&self, title: &str, artist: &str) -> Result<HqTrack, HqError> {
        let normalized_key = format!("{}|{}", title.trim().to_lowercase(), artist.trim().to_lowercase());

        // 1. Check SQLite Search Cache (TTL: 24 hours)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        {
            let conn = self.db_conn.lock().unwrap();
            let mut stmt = conn
                .prepare(
                    "SELECT track_id, source, title, artist, album, created_at FROM hq_search_cache WHERE cache_key = ?1",
                )
                .map_err(|e| HqError::ApiShape(e.to_string()))?;

            let cached = stmt
                .query_row(params![normalized_key], |row| {
                    let track_id: String = row.get(0)?;
                    let source: String = row.get(1)?;
                    let title: String = row.get(2)?;
                    let artist: String = row.get(3)?;
                    let album: String = row.get(4)?;
                    let created_at: u64 = row.get(5)?;
                    Ok((track_id, source, title, artist, album, created_at))
                })
                .ok();

            if let Some((track_id, source, title, artist, album, created_at)) = cached {
                if now.saturating_sub(created_at) < 86400 {
                    return Ok(HqTrack {
                        id: track_id,
                        title,
                        artist,
                        album,
                        source,
                        duration_seconds: None,
                    });
                }
            }
        }

        // 2. Query upstream backend
        let clean_artist = artist.trim();
        let query = if clean_artist.is_empty()
            || clean_artist.eq_ignore_ascii_case("unknown artist")
            || clean_artist.eq_ignore_ascii_case("youtube music")
            || clean_artist.eq_ignore_ascii_case("youtube")
            || clean_artist.eq_ignore_ascii_case("topic")
        {
            title.trim().to_string()
        } else if title.trim().eq_ignore_ascii_case(clean_artist) {
            title.trim().to_string()
        } else {
            format!("{} {}", title.trim(), clean_artist)
        };
        let results = self.backend.search(&query).await?;
        let best_match = results.into_iter().next().ok_or_else(|| {
            HqError::NoMatch(format!("No search matches for '{}'", query))
        })?;

        // 3. Save into SQLite search cache (Cache mapping ONLY, never stream URLs!)
        {
            let conn = self.db_conn.lock().unwrap();
            let _ = conn.execute(
                "INSERT OR REPLACE INTO hq_search_cache (cache_key, track_id, source, title, artist, album, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    normalized_key,
                    best_match.id,
                    best_match.source,
                    best_match.title,
                    best_match.artist,
                    best_match.album,
                    now
                ],
            );
        }

        Ok(best_match)
    }

    pub async fn resolve_stream(
        &self,
        source: &str,
        track_id: &str,
        title: &str,
        artist: &str,
        quality: Quality,
    ) -> Result<HqStream, HqError> {
        // Deduplicate in-flight resolves within 200ms
        let resolve_key = format!("{}:{}:{:?}", source, track_id, quality);
        {
            let mut inflight = self.inflight_resolves.lock().await;
            if let Some(prev) = inflight.get(&resolve_key) {
                if prev.elapsed() < Duration::from_millis(200) {
                    tokio::time::sleep(Duration::from_millis(150)).await;
                }
            }
            inflight.insert(resolve_key.clone(), Instant::now());
        }

        let stream_result = self
            .backend
            .resolve(source, track_id, title, artist, quality)
            .await;

        {
            let mut inflight = self.inflight_resolves.lock().await;
            inflight.remove(&resolve_key);
        }

        stream_result
    }

    pub fn backend_name(&self) -> &'static str {
        self.backend.name()
    }
}
