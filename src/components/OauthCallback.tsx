import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size, isNil } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  otherSide,
  RepertoireMiss,
  Side,
} from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import {
  getAppropriateEcoName,
  getNameEcoCodeIdentifier,
} from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";
import { quick, useDebugState, useRepertoireState } from "app/utils/app_state";
import { SimplePageLayout } from "./SimplePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
  SidebarOnboardingStage,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { SidebarActions, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import {
  formatWinPercentage,
  getWinRate,
} from "app/utils/results_distribution";
import {
  getSidebarPadding,
  VERTICAL_BREAKPOINT,
} from "./RepertoireBrowsingView";
import { CoverageBar } from "./CoverageBar";
import { DeleteLineView } from "./DeleteLineView";
import { CMTextInput } from "./TextInput";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { useOutsideClick } from "./useOutsideClick";
import { GridLoader } from "react-spinners";
import client from "app/client";
import { LichessOauthData } from "app/utils/repertoire_state";

enum Stage {
  Initial,
  ObtainingAccessToken,
  FetchingLichessProfile,
  Redirecting,
}

export const OauthCallback = ({ type }: { type: "lichess" }) => {
  let [searchParams] = useSearchParams();
  let [stage, setStage] = useState(Stage.Initial);
  let oauthCode = searchParams.get("code");
  let lichessOauthData = useRef(
    JSON.parse(
      window.sessionStorage.getItem("lichess-oauth-data") ?? "{}"
    ) as LichessOauthData
  ).current;
  console.log({ lichessOauthData });
  useEffect(() => {
    if (stage === Stage.Initial && lichessOauthData) {
      client
        .post("https://lichess.org/api/token", {
          grant_type: "authorization_code",
          code: oauthCode,
          code_verifier: lichessOauthData.codeVerifier,
          // TODO: remove search params
          redirect_uri: lichessOauthData.redirectUri,
          client_id: lichessOauthData.clientId,
        })
        .then((data) => {
          console.log(data);
        });
    }
  }, [stage]);
  return (
    <SimplePageLayout>
      <View style={s(c.maxWidth(600), c.column, c.center)}>
        <CMText style={s(c.fontSize(18))}>Authenticating...</CMText>
        <Spacer height={24} />
        <GridLoader color={c.grays[80]} size={20} />
      </View>
    </SimplePageLayout>
  );
};
