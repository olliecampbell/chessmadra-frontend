import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
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
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import useKeypress from "react-use-keypress";
import { SidebarActions, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import {
  formatWinPercentage,
  getWinRate,
} from "app/utils/results_distribution";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { CoverageBar } from "./CoverageBar";

export const DeleteLineView = React.memo(function DeleteLineView() {
  const responsive = useResponsive();
  const [responses, deleting] = useRepertoireState((s) => [
    s.repertoire[s.browsingState.activeSide].positionResponses[
      s.browsingState.chessboardState.getCurrentEpd()
    ],
    s.deleteMoveState.isDeletingMove,
  ]);
  if (isNil(responses)) {
    return null;
  }

  const multiple = responses.length > 1;
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>
        {multiple ? "Which line do you want to delete?" : "Are you sure?"}
      </RepertoireEditingHeader>
      <Spacer height={24} />
      <View style={s(c.px(getSidebarPadding(responsive)))}>
        <CMText style={s()}>
          {multiple
            ? "Select the line you want to delete. This cannot be undone."
            : "This will also delete any moves past this one. This cannot be undone."}
        </CMText>
      </View>
      <Spacer height={24} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        {responses.map((response) => (
          <SidebarFullWidthButton
            action={{
              onPress: () => {
                if (deleting) {
                  return;
                }
                quick((s) => {
                  s.repertoireState.deleteMove(response).then(() => {
                    quick((s) => {
                      s.repertoireState.browsingState.moveSidebarState("left");
                      s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                        false;
                    });
                  });
                });
              },
              style: "primary",
              text: multiple
                ? `Delete ${response.sanPlus} and subsequent moves`
                : `Yes I'm sure, delete ${response.sanPlus}`,
            }}
          />
        ))}
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.moveSidebarState("left");
                s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                  false;
              });
            },
            style: "primary",
            text: multiple ? `Nevermind, go back` : `No, I've changed my mind`,
          }}
        />
      </View>
    </View>
  );
});
