// @refresh reload
import { onMount, Show, Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Style,
  useNavigate,
} from "solid-start";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";

import { init as amplitudeInit } from "@amplitude/analytics-browser";
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";
import { c, s } from "./utils/styles";
import "~/global.css";
import AuthHandler from "./components/AuthHandler";
import { isServer } from "solid-js/web";
import "virtual:uno.css";
import { quick } from "~/utils/app_state";
import { HeadSiteMeta } from "./components/PageContainer";
import { isChessmadra } from "./utils/env";

const development =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export default function Root() {
  onMount(() => {
    amplitudeInit(
      development
        ? "a15d3fdaf95400ebeae67dafbb5e8929"
        : isChessmadra
        ? "5691c416a07b218210dba749f3638067"
        : "3709b7c3cbe8ef56eecec29da70f3d3c",
      undefined,
      {
        serverUrl: undefined,
        // serverUrl: development ? undefined : "https://chessmadra.com/amplitude",
      }
    );

    // Option 1, initialize with API_KEY only

    const SENTRY_DSN: string =
      process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

    Sentry.init({
      dsn:
        SENTRY_DSN ||
        "https://5c4df4321e7b4428afef85ec9f08cbd1@o1268497.ingest.sentry.io/6456185",
      integrations: [new BrowserTracing()],

      debug: !(!process.env.NODE_ENV || process.env.NODE_ENV === "development"),
      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 1.0,
      beforeBreadcrumb: (breadcrumb, hint) => {
        if (breadcrumb.category === "xhr") {
          const xhr = hint.xhr as XMLHttpRequest;
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
      // ...
      // Note: if you want to override the automatic release value, do not set a
      // `release` value here - use the environment variable `SENTRY_RELEASE`, so
      // that it will also get attached to your source maps
    });
  });
  return (
    <Html lang="en">
      <Head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          http-equiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <meta name="theme-color" content={c.gray[8]} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />
        <HeadSiteMeta />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="site_manifest.json" />

        <Meta charset="utf-8" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="yes" name="mobile-web-app-capable" />

        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link
          id="apple-touch-icon"
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
        />

        <script
          src="https://kit.fontawesome.com/b1f0634f74.js"
          crossorigin="anonymous"
        />
      </Head>
      <Style>
        {`
    body {
      color: ${c.colors.text.primary}
    }
  `}
      </Style>

      <Body
        style={s(
          c.bg(c.gray[7]),
          // c.lineHeight(1.5),
          c.fg(c.colors.text.primary)
        )}
      >
        <Suspense>
          <ErrorBoundary>
            <RouteProvider />
            <Show when={!isServer} fallback={null}>
              <AuthHandler>
                <Routes>
                  <FileRoutes />
                </Routes>
              </AuthHandler>
            </Show>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}

const RouteProvider = () => {
  const navigate = useNavigate();
  onMount(() => {
    quick((s) => {
      s.navigationState.setNavigate(navigate);
    });
  });
  return null;
};
