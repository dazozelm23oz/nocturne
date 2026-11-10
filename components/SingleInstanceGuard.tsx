import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "@/styles/SingleInstance.module.css";
import GruvboxIcon from "@/components/icons/GruvboxIcon";

interface SingleInstanceGuardProps {
  children: React.ReactNode;
}

const STORAGE_ACTIVE_ID = "lirics_active_instance_id";
const STORAGE_HEARTBEAT = "lirics_instance_heartbeat";
const CHANNEL_NAME = "lirics_single_instance_lock";
const HEARTBEAT_INTERVAL_MS = 1000;
const STALE_TIMEOUT_MS = 3000;

export default function SingleInstanceGuard({ children }: SingleInstanceGuardProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const isBlockedRef = useRef(false);
  const tabIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  isBlockedRef.current = isBlocked;

  // Initialize unique tab ID once per window session
  if (!tabIdRef.current) {
    tabIdRef.current = "inst_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
  }

  const tabId = tabIdRef.current;

  const claimOwnership = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID, tabId);
      localStorage.setItem(STORAGE_HEARTBEAT, Date.now().toString());
      if (channelRef.current) {
        channelRef.current.postMessage({ type: "CLAIM_ACTIVE", tabId });
      }
      setIsBlocked(false);
    } catch {
      // ignore storage errors
    }
  }, [tabId]);

  const handleTakeover = () => {
    claimOwnership();
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Setup BroadcastChannel for sub-millisecond tab-to-tab messaging
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "CLAIM_ACTIVE") {
          // Another tab took ownership -> this tab must block
          if (data.tabId !== tabId) {
            setIsBlocked(true);
          }
        } else if (data.type === "RELEASE_ACTIVE") {
          // The active tab was closed; claim ownership if we were blocked
          const currentActive = localStorage.getItem(STORAGE_ACTIVE_ID);
          if (currentActive === data.tabId) {
            claimOwnership();
          }
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported; falling back to localStorage", e);
    }

    // 2. Initial state check against localStorage
    try {
      const activeId = localStorage.getItem(STORAGE_ACTIVE_ID);
      const lastHeartbeatStr = localStorage.getItem(STORAGE_HEARTBEAT);
      const lastHeartbeat = lastHeartbeatStr ? parseInt(lastHeartbeatStr, 10) : 0;
      const isStale = Date.now() - lastHeartbeat > STALE_TIMEOUT_MS;

      if (!activeId || isStale || activeId === tabId) {
        // No other tab is actively running, or previous tab crashed/stale
        claimOwnership();
      } else {
        // Another tab is actively heartbeating
        setIsBlocked(true);
      }
    } catch {
      setIsBlocked(false);
    }

    // 3. Heartbeat & Staleness Monitor Loop
    const interval = setInterval(() => {
      try {
        const activeId = localStorage.getItem(STORAGE_ACTIVE_ID);
        const lastHeartbeatStr = localStorage.getItem(STORAGE_HEARTBEAT);
        const lastHeartbeat = lastHeartbeatStr ? parseInt(lastHeartbeatStr, 10) : 0;
        const isStale = Date.now() - lastHeartbeat > STALE_TIMEOUT_MS;

        if (!isBlockedRef.current) {
          // If this tab is the active tab, refresh heartbeat
          if (activeId === tabId) {
            localStorage.setItem(STORAGE_HEARTBEAT, Date.now().toString());
          } else {
            // Another tab claimed ownership behind our back
            setIsBlocked(true);
          }
        } else {
          // If this tab is blocked, check if the active tab died without clean release
          if (!activeId || isStale) {
            claimOwnership();
          }
        }
      } catch {
        // ignore
      }
    }, HEARTBEAT_INTERVAL_MS);

    // 4. Clean release on window close
    const handleBeforeUnload = () => {
      try {
        const activeId = localStorage.getItem(STORAGE_ACTIVE_ID);
        if (activeId === tabId) {
          localStorage.removeItem(STORAGE_ACTIVE_ID);
          localStorage.removeItem(STORAGE_HEARTBEAT);
          if (channel) {
            channel.postMessage({ type: "RELEASE_ACTIVE", tabId });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (channel) {
        channel.close();
      }
    };
  }, [tabId, claimOwnership]);

  if (isBlocked) {
    return (
      <div className={styles.blockedOverlay}>
        <div className={styles.ambientGlow} />
        <div className={styles.blockedCard}>
          <div className={styles.iconWrapper}>
            <GruvboxIcon name="focus" size={32} />
          </div>
          <h2 className={styles.title}>Nocturne is Already Running</h2>
          <p className={styles.description}>
            Another window or tab is currently playing lyrics. To maintain zero-latency
            hardware synchronization, only one instance can run at a time.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleTakeover}
              className={styles.switchBtn}
            >
              <GruvboxIcon name="waves" size={16} />
              <span>Switch Playback to This Window</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={styles.closeBtn}
            >
              Close This Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
