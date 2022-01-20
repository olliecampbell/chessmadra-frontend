import type { AppProps /*, AppContext */ } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false);
  console.log("Using the app!");
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <>
      <Head>
        <title>Chess Madra</title>
      </Head>
      {isMounted && <Component {...pageProps} />}
    </>
  );
}
export default MyApp;
