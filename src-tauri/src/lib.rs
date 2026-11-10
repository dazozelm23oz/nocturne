mod hq_music;
mod hq_proxy;

use std::sync::Arc;
use tauri::State;

#[derive(serde::Serialize)]
struct HqBackendInfo {
    enabled: bool,
    backend: String,
}

#[tauri::command]
fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
async fn hq_search(
    manager: State<'_, Option<Arc<hq_music::HqManager>>>,
    title: String,
    artist: Option<String>,
) -> Result<hq_music::HqTrack, String> {
    match manager.inner() {
        Some(mgr) => {
            let artist_str = artist.unwrap_or_default();
            mgr.search_track(&title, &artist_str)
                .await
                .map_err(|e| format!("{:?}", e))
        }
        None => Err("HQ provider disabled".into()),
    }
}

#[tauri::command]
async fn hq_resolve(
    manager: State<'_, Option<Arc<hq_music::HqManager>>>,
    source: String,
    track_id: String,
    title: String,
    artist: String,
    quality: String,
) -> Result<serde_json::Value, String> {
    match manager.inner() {
        Some(mgr) => {
            let quality_enum = match quality.to_lowercase().as_str() {
                "standard" => hq_music::Quality::Standard,
                "high" => hq_music::Quality::High,
                "lossless" => hq_music::Quality::Lossless,
                "hires" => hq_music::Quality::HiRes,
                _ => hq_music::Quality::Standard,
            };

            let stream_result = mgr
                .resolve_stream(&source, &track_id, &title, &artist, quality_enum)
                .await;

            match stream_result {
                Ok(mut stream) => {
                    let proxy_port = hq_proxy::get_proxy_port();
                    if proxy_port > 0 {
                        stream.url = format!(
                            "http://127.0.0.1:{}/stream?url={}",
                            proxy_port,
                            urlencoding::encode(&stream.url)
                        );
                    }
                    Ok(serde_json::to_value(stream).map_err(|e| e.to_string())?)
                }
                Err(hq_music::HqError::QualityDowngraded { requested, resolved, mut stream }) => {
                    let proxy_port = hq_proxy::get_proxy_port();
                    if proxy_port > 0 {
                        stream.url = format!(
                            "http://127.0.0.1:{}/stream?url={}",
                            proxy_port,
                            urlencoding::encode(&stream.url)
                        );
                    }
                    Err(serde_json::to_string(&serde_json::json!({
                        "type": "QualityDowngraded",
                        "details": {
                            "requested": format!("{:?}", requested).to_lowercase(),
                            "resolved": format!("{:?}", resolved).to_lowercase(),
                            "stream": stream
                        }
                    })).unwrap_or_else(|_| "QualityDowngraded".into()))
                }
                Err(e) => Err(format!("{:?}", e)),
            }
        }
        None => Err("HQ provider disabled".into()),
    }
}

#[tauri::command]
fn hq_get_backend_info(manager: State<'_, Option<Arc<hq_music::HqManager>>>) -> HqBackendInfo {
    match manager.inner() {
        Some(mgr) => HqBackendInfo {
            enabled: true,
            backend: mgr.backend_name().to_string(),
        },
        None => HqBackendInfo {
            enabled: false,
            backend: "none".to_string(),
        },
    }
}

#[tauri::command]
fn get_mpris_active_players() -> Result<Vec<String>, String> {
    let output = std::process::Command::new("playerctl")
        .arg("-l")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout);
        let players: Vec<String> = text
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        Ok(players)
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
fn get_mpris_playback_state(player: Option<String>) -> Result<String, String> {
    let mut cmd = std::process::Command::new("playerctl");
    if let Some(ref p) = player {
        if !p.is_empty() && p != "auto" {
            cmd.arg(format!("--player={}", p));
        }
    }
    cmd.args(["metadata", "--format", "{{title}}|{{artist}}|{{status}}|{{position}}|{{mpris:length}}"]);

    match cmd.output() {
        Ok(out) => Ok(String::from_utf8_lossy(&out.stdout).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn send_mpris_command(action: String, player: Option<String>) -> Result<(), String> {
    let subcmd = match action.as_str() {
        "next" => "next",
        "prev" => "previous",
        "playpause" => "play-pause",
        "play" => "play",
        "pause" => "pause",
        _ => return Err("Unknown action".into()),
    };

    let mut cmd = std::process::Command::new("playerctl");
    if let Some(ref p) = player {
        if !p.is_empty() && p != "auto" {
            cmd.arg(format!("--player={}", p));
        }
    }
    cmd.arg(subcmd);

    let status = cmd.status().map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("Command failed".into())
    }
}

#[tauri::command]
fn seek_mpris_media(position_ms: i64, player: Option<String>) -> Result<(), String> {
    let pos_secs = position_ms as f64 / 1000.0;
    let mut cmd = std::process::Command::new("playerctl");
    if let Some(ref p) = player {
        if !p.is_empty() && p != "auto" {
            cmd.arg(format!("--player={}", p));
        }
    }
    cmd.args(["position", &pos_secs.to_string()]);

    let status = cmd.status().map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("Seek failed".into())
    }
}

#[tauri::command]
fn get_real_gpu() -> String {
    let output = std::process::Command::new("sh").arg("-c").arg("lspci | grep -i -E 'vga|3d|display'").output();
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout).to_string();
        let lines: Vec<&str> = text.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect();
        let target_line = lines.iter()
            .find(|l| l.to_lowercase().contains("nvidia"))
            .or_else(|| lines.iter().find(|l| l.to_lowercase().contains("radeon") || l.to_lowercase().contains("amd")))
            .or_else(|| lines.first());

        if let Some(line) = target_line {
            return line.split(": ").last().unwrap_or(line).trim().to_string();
        }
        text.split(": ").last().unwrap_or("Unknown GPU").trim().to_string()
    } else {
        "Unknown GPU".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let hq_enabled = std::env::var("NOCTURNE_HQ_ENABLED")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let backend_mode = std::env::var("NOCTURNE_HQ_BACKEND").unwrap_or_else(|_| "selfhosted".to_string());
    
    let hq_manager = if hq_enabled {
        let backend: Arc<dyn hq_music::HqBackend + Send + Sync> = match backend_mode.as_str() {
            "tunehub" => Arc::new(hq_music::TuneHubBackend::new()),
            _ => Arc::new(hq_music::SelfHostedBackend::new()),
        };
        let data_dir = std::env::var("XDG_DATA_HOME")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                std::path::PathBuf::from(home).join(".local").join("share")
            })
            .join("nocturne");
        let _ = std::fs::create_dir_all(&data_dir);
        let db_path = data_dir.join("hq_cache.db");
        let db_path_str = db_path.to_string_lossy().to_string();
        Some(Arc::new(hq_music::HqManager::new(backend, &db_path_str).unwrap()))
    } else {
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(hq_manager)
        .invoke_handler(tauri::generate_handler![
            close_app,
            hq_search,
            hq_resolve,
            hq_get_backend_info,
            get_mpris_active_players,
            get_mpris_playback_state,
            send_mpris_command,
            seek_mpris_media,
            get_real_gpu
        ])
        .setup(move |_app| {
            

            if hq_enabled {
                tauri::async_runtime::spawn(async {
                    hq_proxy::start_hq_stream_proxy().await;
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
