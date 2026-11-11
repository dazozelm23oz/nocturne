use async_trait::async_trait;
use app_lib::hq_music::{HqBackend, HqError, HqManager, HqStream, HqTrack, Quality, TuneHubBackend};
use std::sync::Arc;

struct MockSuccessBackend;

#[async_trait]
impl HqBackend for MockSuccessBackend {
    fn name(&self) -> &'static str {
        "mock_success"
    }

    async fn search(&self, query: &str) -> Result<Vec<HqTrack>, HqError> {
        Ok(vec![HqTrack {
            id: "track_123".to_string(),
            title: "Test Track".to_string(),
            artist: "Test Artist".to_string(),
            album: "Test Album".to_string(),
            source: "netease".to_string(),
            duration_seconds: Some(210),
        }])
    }

    async fn resolve(
        &self,
        source: &str,
        track_id: &str,
        _title: &str,
        _artist: &str,
        quality: Quality,
    ) -> Result<HqStream, HqError> {
        Ok(HqStream {
            url: format!("https://cdn.example.com/{}/{}.flac", source, track_id),
            quality,
            source: source.to_string(),
            bitrate_kbps: Some(960),
            format: Some("flac".to_string()),
            ttl_seconds: Some(1200),
            title: None,
            artist: None,
        })
    }
}

struct MockDowngradeBackend;

#[async_trait]
impl HqBackend for MockDowngradeBackend {
    fn name(&self) -> &'static str {
        "mock_downgrade"
    }

    async fn search(&self, _query: &str) -> Result<Vec<HqTrack>, HqError> {
        Ok(vec![HqTrack {
            id: "track_456".to_string(),
            title: "Old Track".to_string(),
            artist: "Old Artist".to_string(),
            album: "Old Album".to_string(),
            source: "kuwo".to_string(),
            duration_seconds: Some(180),
        }])
    }

    async fn resolve(
        &self,
        source: &str,
        track_id: &str,
        _title: &str,
        _artist: &str,
        requested_quality: Quality,
    ) -> Result<HqStream, HqError> {
        let fallback_stream = HqStream {
            url: format!("https://cdn.example.com/{}/{}.mp3", source, track_id),
            quality: Quality::High,
            source: source.to_string(),
            bitrate_kbps: Some(320),
            format: Some("mp3".to_string()),
            ttl_seconds: Some(1200),
            title: None,
            artist: None,
        };

        Err(HqError::QualityDowngraded {
            requested: requested_quality,
            resolved: Quality::High,
            stream: fallback_stream,
        })
    }
}

#[tokio::test]
async fn test_hq_manager_search_and_cache_hit() {
    let mock = Arc::new(MockSuccessBackend);
    let temp_db = std::env::temp_dir().join(format!("test_hq_cache_{}.db", std::time::Instant::now().elapsed().as_nanos()));
    let manager = HqManager::new(mock, temp_db.to_str().unwrap()).expect("Failed to create HqManager");

    // 1. Initial search (Cache miss -> upstream search)
    let track1 = manager.search_track("Test Track", "Test Artist").await.expect("Search should succeed");
    assert_eq!(track1.id, "track_123");
    assert_eq!(track1.source, "netease");

    // 2. Second search (Cache hit)
    let track2 = manager.search_track("test track", "test artist").await.expect("Cache hit search should succeed");
    assert_eq!(track2.id, "track_123");
    assert_eq!(track2.title, "Test Track");
}

#[tokio::test]
async fn test_hq_manager_quality_downgraded() {
    let mock = Arc::new(MockDowngradeBackend);
    let temp_db = std::env::temp_dir().join(format!("test_hq_down_{}.db", std::time::Instant::now().elapsed().as_nanos()));
    let manager = HqManager::new(mock, temp_db.to_str().unwrap()).expect("Failed to create HqManager");

    let result = manager
        .resolve_stream("kuwo", "track_456", "Old Track", "Old Artist", Quality::Lossless)
        .await;

    match result {
        Err(HqError::QualityDowngraded { requested, resolved, stream }) => {
            assert_eq!(requested, Quality::Lossless);
            assert_eq!(resolved, Quality::High);
            assert_eq!(stream.quality, Quality::High);
            assert_eq!(stream.format.as_deref(), Some("mp3"));
        }
        other => panic!("Expected QualityDowngraded, got {:?}", other),
    }
}

#[tokio::test]
#[ignore = "Live call to external TuneHub instance"]
async fn test_live_tunehub_resolve() {
    let backend = TuneHubBackend::new();
    let result = backend.resolve("netease", "186016", "晴天", "周杰伦", Quality::Standard).await;
    match result {
        Ok(stream) => {
            assert!(!stream.url.is_empty(), "Stream URL should not be empty on live call");
        }
        Err(e) => {
            // Must be one of the typed HqError variants (e.g. AuthFailed 403 due to WAF challenge or BackendDown)
            match e {
                HqError::AuthFailed(_) | HqError::RateLimited(_) | HqError::BackendDown(_) | HqError::NoMatch(_) | HqError::Timeout(_) | HqError::Network(_) => {
                    println!("Live call returned expected typed HqError: {:?}", e);
                }
                other => panic!("Unexpected error type on live test: {:?}", other),
            }
        }
    }
}
