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
import { PositionOverview, Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { SidebarActions } from "./SidebarActions";
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
import { SidebarOnboarding } from "./SidebarOnboarding";

export const BrowserSidebar = React.memo(function BrowserSidebar() {
  const [addedLineState, deleteLineState, seenOnboarding] = useRepertoireState(
    (s) => [
      s.browsingState.addedLineState,
      s.browsingState.deleteLineState,
      s.browsingState.seenOnboarding,
    ]
  );
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  let inner = null;
  if (!seenOnboarding.value) {
    inner = <SidebarOnboarding />;
  } else if (deleteLineState.visible) {
    inner = <DeleteLineView />;
  } else if (addedLineState.visible) {
    inner = <SavedLineView />;
  } else {
    inner = <Responses />;
  }
  const paddingTop = 140;
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  return (
    <View style={s(c.column, c.zIndex(4))}>
      <Pressable
        onPress={() => {
          quick((s) => {
            if (s.repertoireState.browsingState.addedLineState.visible) {
              s.repertoireState.browsingState.addedLineState.visible = false;
              return;
            } else if (
              s.repertoireState.browsingState.deleteLineState.visible
            ) {
              s.repertoireState.browsingState.deleteLineState.visible = false;
              return;
            }
            if (
              isEmpty(s.repertoireState.browsingState.chessboardState.moveLog)
            ) {
              s.repertoireState.backToOverview();
            } else {
              s.repertoireState.browsingState.chessboardState.backOne();
            }
          });
        }}
        style={s(
          !vertical ? c.height(paddingTop) : c.pt(40),
          c.unshrinkable,
          c.column,
          c.justifyEnd,
          c.px(getSidebarPadding(responsive))
        )}
      >
        <CMText style={s()}>
          <i className="fa fa-arrow-left"></i>
          <Spacer width={8} />
          Back
        </CMText>
        <Spacer height={44} />
      </Pressable>
      {inner}
    </View>
  );
});

const SavedLineView = React.memo(function SavedLineView() {
  const [positionReport, activeSide] = useRepertoireState((s) => [
    s.browsingState.getCurrentPositionReport(),
    s.browsingState.activeSide,
  ]);
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[activeSide],
  ]);
  const responsive = useResponsive();
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>Line saved!</RepertoireEditingHeader>
      <View style={s(c.px(getSidebarPadding(responsive)))}>
        <Spacer height={8} />
        {positionReport && (
          <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
            At your level, {activeSide} wins{" "}
            <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
              {formatWinPercentage(
                getWinRate(positionReport.results, activeSide)
              )}
              %
            </CMText>{" "}
            of the time.
          </CMText>
        )}
        <Spacer height={12} />
        <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
          Your {activeSide} repertoire is now{" "}
          <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
            {Math.round(progressState.percentComplete)}%
          </CMText>{" "}
          complete.
        </CMText>
        <Spacer height={12} />
        <View style={s(c.fullWidth, c.height(12))}>
          <CoverageBar side={activeSide} />
        </View>
        <Spacer height={12} />
      </View>
    </View>
  );
});
