import styles from "@/styles/Home.module.css";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";

interface NotPlayingProps {
  onOpenSettings?: () => void;
}

function NotPlaying({ onOpenSettings }: NotPlayingProps) {
  const router = useRouter();
  return (
    <div className={styles.dialog}>
      <h1>Not playing</h1>
      <p>Seems like you are not playing any song.</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => router.reload()}>Refresh</button>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{
              background: "#1ed760",
              color: "#121212",
              fontWeight: 700,
            }}
          >
            Open Settings
          </button>
        )}
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  );
}

export default NotPlaying;
