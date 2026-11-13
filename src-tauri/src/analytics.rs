use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AnalyticsRecord {
    pub timestamp: i64,
    pub video_id: Option<String>,
    pub listened_second: Option<i64>,
    pub artist_name: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HourlyStat {
    pub hour: u32,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ArtistStat {
    pub name: String,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AnalyticsSummary {
    pub total_events: u32,
    pub top_artists: Vec<ArtistStat>,
    pub hourly_stats: Vec<HourlyStat>,
}

fn get_analytics_db_path() -> PathBuf {
    let data_dir = std::env::var("XDG_DATA_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".local").join("share")
        })
        .join("nocturne");
    let _ = std::fs::create_dir_all(&data_dir);
    data_dir.join("nocturne_analytics.db")
}

pub fn init_analytics_db() -> Result<Connection, rusqlite::Error> {
    let path = get_analytics_db_path();
    let conn = Connection::open(path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS nocturne_playback_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            video_id TEXT,
            listened_second INTEGER,
            artist_name TEXT
        )",
        [],
    )?;
    Ok(conn)
}

pub fn clear_analytics() -> Result<(), String> {
    let conn = init_analytics_db().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM nocturne_playback_events", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn import_simpmusic_database(file_path: &str) -> Result<Vec<AnalyticsRecord>, String> {
    let src_conn = Connection::open(file_path).map_err(|e| format!("Failed to open SimpMusic database: {}", e))?;
    let dst_conn = init_analytics_db().map_err(|e| format!("Failed to initialize Nocturne analytics database: {}", e))?;

    let mut stmt = src_conn.prepare(
        "SELECT 
            pe.timestamp,
            pe.videoId,
            pe.listenedSecond,
            COALESCE(a.name, 'Unknown Artist') as artist_name
         FROM playback_event pe
         LEFT JOIN event_artist ea ON pe.eventId = ea.eventId
         LEFT JOIN artist a ON ea.channelId = a.channelId"
    ).map_err(|e| format!("Failed to query SimpMusic schema: {}", e))?;

    let record_rows = stmt.query_map([], |row| {
        Ok(AnalyticsRecord {
            timestamp: row.get(0)?,
            video_id: row.get(1)?,
            listened_second: row.get(2)?,
            artist_name: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "Unknown Artist".to_string()),
        })
    }).map_err(|e| format!("Failed to read playback records: {}", e))?;

    let mut records = Vec::new();
    let mut insert_stmt = dst_conn.prepare(
        "INSERT INTO nocturne_playback_events 
         (timestamp, video_id, listened_second, artist_name)
         VALUES (?1, ?2, ?3, ?4)"
    ).map_err(|e| format!("Failed to prepare insert statement: {}", e))?;

    for rec in record_rows.flatten() {
        let _ = insert_stmt.execute(params![
            rec.timestamp,
            rec.video_id,
            rec.listened_second,
            rec.artist_name,
        ]);
        records.push(rec);
    }

    Ok(records)
}

pub fn get_analytics_summary() -> Result<AnalyticsSummary, String> {
    let conn = init_analytics_db().map_err(|e| e.to_string())?;

    let total_events: u32 = conn.query_row(
        "SELECT COUNT(*) FROM nocturne_playback_events",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let mut top_artists = Vec::new();
    let mut artist_stmt = conn.prepare(
        "SELECT artist_name, COUNT(*) as play_count 
         FROM nocturne_playback_events 
         WHERE artist_name IS NOT NULL AND TRIM(artist_name) != '' AND artist_name != 'Unknown Artist'
         GROUP BY artist_name 
         ORDER BY play_count DESC 
         LIMIT 10"
    ).map_err(|e| e.to_string())?;

    let artist_rows = artist_stmt.query_map([], |row| {
        Ok(ArtistStat {
            name: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    for a in artist_rows.flatten() {
        top_artists.push(a);
    }

    let mut hours_map = [0u32; 24];
    let mut time_stmt = conn.prepare("SELECT timestamp FROM nocturne_playback_events").map_err(|e| e.to_string())?;
    let time_rows = time_stmt.query_map([], |row| row.get::<_, i64>(0)).map_err(|e| e.to_string())?;

    for ts in time_rows.flatten() {
        let secs = if ts > 10_000_000_000 { ts / 1000 } else { ts };
        let hour = ((secs / 3600) % 24) as usize;
        hours_map[hour] += 1;
    }

    let mut hourly_stats = Vec::with_capacity(24);
    for hour in 0..24 {
        hourly_stats.push(HourlyStat {
            hour: hour as u32,
            count: hours_map[hour],
        });
    }

    Ok(AnalyticsSummary {
        total_events,
        top_artists,
        hourly_stats,
    })
}
