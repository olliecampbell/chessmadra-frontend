import type { AppProps /*, AppContext */ } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AuthHandler from "app/components/AuthHandler";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import React from "react";

Sentry.init({
  dsn: "https://5c4df4321e7b4428afef85ec9f08cbd1@o1268497.ingest.sentry.io/6456185",
  integrations: [new BrowserTracing()],
  beforeBreadcrumb: (breadcrumb, hint) => {
    if (breadcrumb.category === "xhr") {
      let xhr = hint.xhr as XMLHttpRequest;
      const data = {
        // @ts-ignore
        requestBody: xhr.__sentry_xhr__.body,
        responseCode: xhr.status,
        response: xhr.response,
        responseUrl: xhr.responseURL,
      };
      return { ...breadcrumb, data };
    }
    return breadcrumb;
  },
  environment:
    !process.env.NODE_ENV || process.env.NODE_ENV === "development"
      ? "development"
      : "production",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

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
      <AuthHandler>
        <ErrorBoundary>
          {isMounted && <Component {...pageProps} />}
        </ErrorBoundary>
      </AuthHandler>
    </>
  );
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      return { hasError: true };
    }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.withScope(function (scope) {
      Sentry.setExtra("error", error);
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

export default MyApp;
