import type { AppProps /*, AppContext */ } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false);
  console.log("Using the app!");
  const router = useRouter();
  useEffect(() => {
    setIsMounted(true);
    // On prod for some reason the first load always loads the base route, attempted fix
    router.push(router.asPath);
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
