// Use next.js page for the mobile app
// export { default } from './pages'
import React, { useEffect } from "react";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  const [isMounted, setIsMounted] = useState(false);
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
