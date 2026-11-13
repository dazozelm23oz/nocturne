use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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
            event_id INTEGER PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            video_id TEXT,
            duration_second INTEGER,
            listened_second INTEGER,
            artist_name TEXT,
            song_title TEXT
        )",
        [],
    )?;
    Ok(conn)
}

pub fn import_simpmusic_database(file_path: &str) -> Result<AnalyticsSummary, String> {
    let src_conn = Connection::open(file_path).map_err(|e| format!("Failed to open SimpMusic database: {}", e))?;
    let dst_conn = init_analytics_db().map_err(|e| format!("Failed to initialize Nocturne analytics database: {}", e))?;

    let mut stmt = src_conn.prepare(
        "SELECT 
            pe.eventId,
            pe.timestamp,
            pe.videoId,
            pe.durationSecond,
            pe.listenedSecond,
            COALESCE(a.name, s.artistName, 'Unknown Artist') as artist_name,
            COALESCE(s.title, 'Unknown Title') as song_title
         FROM playback_event pe
         LEFT JOIN event_artist ea ON pe.eventId = ea.eventId
         LEFT JOIN artist a ON ea.channelId = a.channelId
         LEFT JOIN song s ON pe.videoId = s.videoId"
    ).map_err(|e| format!("Failed to query SimpMusic schema: {}", e))?;

    let event_rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, Option<String>>(2)?,
            row.get::<_, Option<i64>>(3)?,
            row.get::<_, Option<i64>>(4)?,
            row.get::<_, Option<String>>(5)?.unwrap_or_else(|| "Unknown Artist".to_string()),
            row.get::<_, Option<String>>(6)?.unwrap_or_else(|| "Unknown Title".to_string()),
        ))
    }).map_err(|e| format!("Failed to read playback_event records: {}", e))?;

    let mut insert_stmt = dst_conn.prepare(
        "INSERT OR REPLACE INTO nocturne_playback_events 
         (event_id, timestamp, video_id, duration_second, listened_second, artist_name, song_title)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    ).map_err(|e| format!("Failed to prepare insert statement: {}", e))?;

    for ev in event_rows {
        if let Ok((event_id, timestamp, video_id, duration_second, listened_second, artist_name, song_title)) = ev {
            let _ = insert_stmt.execute(params![
                event_id,
                timestamp,
                video_id,
                duration_second,
                listened_second,
                artist_name,
                song_title,
            ]);
        }
    }

    get_analytics_summary()
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