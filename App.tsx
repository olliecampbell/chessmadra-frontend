import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { RepertoireBuilder } from "./src/components/RepertoireBuilder";
import { s, c } from "app/styles";
import { Helmet } from "react-helmet";
import { HeadSiteMeta } from "app/components/PageContainer";

import { BrowserTracing } from "@sentry/tracing";
import AuthHandler from "app/components/AuthHandler";
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import Login from "app/components/Login";
import { BlindfoldTrainer } from "app/components/BlindfoldTrainer";
import { Directory } from "app/components/Directory";
import { BlunderRecognition } from "app/components/BlunderRecognition";
import { ColorTraining } from "app/components/ColorTraining";
import { GameMemorization } from "app/components/GameMemorization";
import { GamesSearch } from "app/components/GamesSearch";
import { TheClimb } from "app/components/TheClimb";
import { VisualizationTraining } from "app/components/VisualizationTraining";
import { useAppState, useDebugState } from "app/utils/app_state";
import SharedRepertoireView from "app/components/SharedRepertoire";
import * as Sentry from "sentry-expo";
import { isNil } from "lodash-es";
import Authenticate from "app/components/Authenticate";
import { AdminView } from "app/components/AdminView";
import { ReviewMoveAnnotationsView } from "app/components/ReviewMoveAnnotationsView";
import { init as amplitudeInit } from "@amplitude/analytics-browser";
import { RepertoireEditingView } from "app/components/RepertoireEditingView";
import { RepertoireBrowsingView } from "app/components/RepertoireBrowsingView";
import { RepertoireReview } from "app/components/RepertoireReview";

const development =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";
console.log("Development?", development);
amplitudeInit(
  development
    ? "a15d3fdaf95400ebeae67dafbb5e8929"
    : "3709b7c3cbe8ef56eecec29da70f3d3c",
  undefined,
  {
    serverUrl: development ? undefined : "https://chessmadra.com/amplitude",
  }
);

// Option 1, initialize with API_KEY only

const SENTRY_DSN: string =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn:
    SENTRY_DSN ||
    "https://5c4df4321e7b4428afef85ec9f08cbd1@o1268497.ingest.sentry.io/6456185",
  enableInExpoDevelopment: false,
  debug: !(!process.env.NODE_ENV || process.env.NODE_ENV === "development"),
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
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
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});

export default function App() {
  return (
    <View style={s(c.bg(c.grays[7]), c.lineHeight(1.5))}>
      <HeadSiteMeta
        siteMeta={{
          title: "Chess Madra",
          description:
            "Build your opening repertoire, improve your visualization, train your tactics, and more.",
        }}
      />
      <Helmet>
        <meta name="theme-color" content={c.grays[10]} />
      </Helmet>
      <ErrorBoundary>
        <AuthHandler>
          <Router>
            <RouteProvider>
              <GlobalParamsReader />
              <Routes>
                <Route path="/" element={<RepertoireBuilder />} />
                <Route path="/authenticate" element={<Authenticate />} />
                <Route path="/repertoire" element={<SharedRepertoireView />} />
                <Route path="/openings" element={<RepertoireBuilder />} />
                <Route
                  path="/openings/:side/browse"
                  element={<RepertoireBrowsingView />}
                />
                <Route path="/openings/review" element={<RepertoireReview />} />
                <Route
                  path="/openings/:side/edit"
                  element={<RepertoireEditingView />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/blindfold" element={<BlindfoldTrainer />} />
                <Route
                  path="/blunder_recognition"
                  element={<BlunderRecognition />}
                />
                <Route path="/color_trainer" element={<ColorTraining />} />
                <Route path="/directory" element={<Directory />} />
                <Route
                  path="/game-memorization"
                  element={<GameMemorization />}
                />
                <Route path="/games-search" element={<GamesSearch />} />
                <Route path="/the_climb" element={<TheClimb />} />
                <Route
                  path="/visualization"
                  element={<VisualizationTraining />}
                />
                <Route path="/admin" element={<AdminView />} />
                <Route
                  path="/admin/move-annotations"
                  element={<ReviewMoveAnnotationsView />}
                />
              </Routes>
            </RouteProvider>
          </Router>
        </AuthHandler>
      </ErrorBoundary>
    </View>
  );
}
export const GlobalParamsReader = () => {
  let quick = useAppState((s) => s.quick);
  const [searchParams] = useSearchParams();
  let debugUi = searchParams.get("debug-ui");
  useEffect(() => {
    quick((s) => {
      s.debugState.debugUi = !isNil(debugUi);
    });
  }, [debugUi]);
  return null;
};

export const RouteProvider = ({ children }) => {
  let navigate = useNavigate();
  let [quick] = useAppState((s) => [s.quick]);
  useEffect(() => {
    quick((s) => {
      s.navigationState.setNavigate(navigate);
    });
  }, []);
  return children;
};

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
    console.error("Caught error!", error, errorInfo);
    Sentry.Browser.withScope(function (scope) {
      Sentry.Browser.setExtra("error", error);
      Sentry.Browser.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
