import React from "react";
import Head from "next/head";
import Signin from "@/components/Signin";

export default function SigninPage() {
  return (
    <>
      <Head>
        <title>Sign In | Lirics</title>
        <meta name="description" content="Sign in to Lirics with Spotify for real-time synced lyrics" />
      </Head>
      <Signin />
    </>
  );
}
