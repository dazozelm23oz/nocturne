import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import GruvboxIcon from "@/components/icons/GruvboxIcon";

export default function AuthErrorPage() {
  const router = useRouter();
  const { error } = router.query;
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isRateLimit = error === "OAuthCallback" || error === "OAuthSignin";

  return (
    <>
      <Head>
        <title>Spotify Sign-In | Lirics</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 20%, #1e1e24 0%, #0d0d11 100%)",
          color: "#f5f5f7",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "540px",
            width: "100%",
            background: "rgba(28, 28, 32, 0.85)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <GruvboxIcon name="warning" size={30} />
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 10px 0",
              color: "#ffffff",
            }}
          >
            Spotify Authorization Cooldown
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.7)",
              margin: "0 0 24px 0",
            }}
          >
            Spotify&apos;s Web API temporarily throttled sign-in requests (
            <code
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                padding: "2px 6px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              429 Quota Exceeded
            </code>
            ). We&apos;ve silenced all background calls so Spotify&apos;s quota can fully clear.
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "16px",
              textAlign: "left",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "rgba(255, 255, 255, 0.75)",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}>
              💡 Two Common Reasons for This:
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>1. Spotify 429 Cooldown:</strong> Wait {countdown > 0 ? `${countdown}s` : "a few seconds"} for the rate limit to reset before retrying.
            </div>
            <div>
              <strong>2. Secondary Account Whitelist:</strong> If logging in with a different Spotify account than the one that created the Spotify Developer App, that account&apos;s email must be added in the Spotify Developer Dashboard under <em>User Management</em>.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => signIn("spotify", { callbackUrl: "/" })}
              disabled={countdown > 0}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "14px",
                background: countdown > 0 ? "rgba(255, 255, 255, 0.15)" : "#1db954",
                color: countdown > 0 ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: countdown > 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {countdown > 0
                ? `Retry Sign In (${countdown}s cooldown)`
                : "Try Signing In with Spotify"}
            </button>

            <Link
              href="/"
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "rgba(255, 255, 255, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                display: "block",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
            >
              Continue to Player (Local SMTC Mode)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
