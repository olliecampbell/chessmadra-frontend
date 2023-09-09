import { useNavigate } from "@solidjs/router";
import { Routes, Route } from "solid-start";
import { onMount } from "solid-js";
import AuthHandler from "./components/AuthHandler";
import LandingPageWrapper from "./components/LandingPageWrapper";
import posthog from "posthog-js";
import {
  posthogFeaturesLoaded,
  setPosthogFeaturesLoaded,
} from "./utils/experiments";
import * as Sentry from "@sentry/browser";
import { isChessmadra, isDevelopment } from "./utils/env";
import { BrowserTracing } from "@sentry/browser";
import { PageWrapper } from "./components/PageWrapper";
import { quick } from "~/utils/app_state";
import { ReviewMoveAnnotationsView } from "./components/ReviewMoveAnnotationsView";
import { MoveAnnotationsDashboard } from "./components/MoveAnnotationsDashboard";
import { AdminView } from "./components/AdminView";
import LichessOAuthCallback from "./pages/LichessOAuthCallback";
import { ChessMadra } from "./components/ChessMadra";
import DesignSytem from "./pages/DesignSystem";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { LoginSidebar } from "./components/LoginSidebar";
import { HeadSiteMeta } from "./components/HeadSiteMeta";

export const App = () => {
  onMount(() => {
    posthog.init("phc_atElVsO6VniR0N7SppwOvz56DB3pRkkGiL0kRFdKYwu", {
      api_host: "https://eu.posthog.com",
      autocapture: false,
    });
    posthog.onFeatureFlags((x, y) => {
      setPosthogFeaturesLoaded(true);
    });

    // Option 1, initialize with API_KEY only

    Sentry.init({
      dsn: isDevelopment
        ? "https://5c4df4321e7b4428afef85ec9f08cbd1@o1268497.ingest.sentry.io/6456185"
        : undefined,
      integrations: [new BrowserTracing()],

      debug: !(!process.env.NODE_ENV || process.env.NODE_ENV === "development"),
      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 1.0,
      beforeBreadcrumb: (breadcrumb, hint) => {
        if (breadcrumb.category === "xhr") {
          // @ts-ignore
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
    <AuthHandler>
      <RouteProvider />
      <Routes>
        <Route path="/" component={isChessmadra ? ChessMadra : PageWrapper} />
        <Route
          path="/admin/move-annotations/community"
          component={ReviewMoveAnnotationsView}
        />
        <Route
          path="/admin/move-annotations"
          component={MoveAnnotationsDashboard}
        />
        <Route path="/admin" component={AdminView} />
        <Route path="/oauth/lichess" component={LichessOAuthCallback} />
        <Route path="/chessnuke" component={PageWrapper} />
        <Route path="/stupactlyo" component={PageWrapper} />
        <Route path="/willtaylorchess" component={PageWrapper} />
        <Route path="/design-system" component={DesignSytem} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route
          path="/login"
          component={() => <PageWrapper initialView={LoginSidebar} />}
        />
        <Route
          path="/visualization"
          component={() => <ChessMadra initialTool="visualization" />}
        />
        <Route path="/*" component={isChessmadra ? ChessMadra : PageWrapper} />
      </Routes>
    </AuthHandler>
  );
};

const RouteProvider = () => {
  const navigate = useNavigate();
  onMount(() => {
    quick((s) => {
      s.navigationState.setNavigate(navigate);
    });
  });
  return null;
};
