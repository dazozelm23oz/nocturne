import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useWakeLock } from "react-screen-wake-lock";
import { Hind_Madurai, Noto_Sans } from "next/font/google";
import Head from "next/head";
import { useEffect } from "react";
import Providers from "@/providers";

const tamil = Hind_Madurai({
  fallback: ["sans-serif"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  style: ["normal"],
  subsets: ["latin"],
  variable: "--tamil-font",
});

const hindi = Noto_Sans({
  fallback: ["sans-serif"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  style: ["normal"],
  subsets: ["latin"],
  variable: "--hindi-font",
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const { request } = useWakeLock();

  useEffect(() => {
    request();
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="manifest" href="/manifest.json" />

        <meta name="application-name" content="Nocturne" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nocturne" />
        <meta
          name="description"
          content="Spotify lyrics didnt work so i took things into my own hands lol. A fun project."
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />

        <title>Nocturne</title>
        <meta name="title" content="Nocturne" />
        <meta
          name="description"
          content="Spotify lyrics didnt work so i took things into my own hands lol. A fun project."
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lirics.vercel.app" />
        <meta property="og:title" content="lirics." />

        <meta
          property="og:description"
          content="Spotify lyrics didnt work so i took things into my own hands lol. A fun project."
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://lirics.vercel.app" />
        <meta property="twitter:title" content="lirics." />

        <meta
          property="twitter:description"
          content="Spotify lyrics didnt work so i took things into my own hands lol. A fun project."
        />

        <link key="icon" rel="icon" href={"/favicon.svg"} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&family=Montserrat:ital,wght@0,600;0,700;0,800;1,700&family=Nunito:ital,wght@0,700;0,800;0,900;1,800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,700&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>
        {`
          html {
            --tamil-font: ${tamil.style.fontFamily};
            --hindi-font: ${hindi.style.fontFamily};
          }
        `}
      </style>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </SessionProvider>
  );
}
