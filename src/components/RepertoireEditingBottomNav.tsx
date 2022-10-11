import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { clamp, isEmpty, keys } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import {
  useBrowsingState,
  useUserState,
  useAdminState,
  useDebugState,
  useRepertoireState,
  quick,
} from "app/utils/app_state";
import React from "react";
import { Animated } from "react-native";
import { trackEvent } from "app/hooks/useTrackEvent";
import { BP, useResponsive } from "app/utils/useResponsive";
import { getExpectedNumberOfMovesForTarget } from "./RepertoireOverview";
import { pluralize } from "app/utils/pluralize";
import { CoverageBar } from "./CoverageBar";

export const RepertoireEditingBottomNav = ({}: {}) => {
  const [moveLogPgn, hasPendingLineToAdd] = useBrowsingState(([s]) => [
    s.chessboardState.moveLogPgn,
    s.hasPendingLineToAdd,
  ]);
  // const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  // const visible = !isEmpty(moveLogPgn);
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;

  // React.useEffect(() => {
  //   Animated.timing(fadeAnim, {
  //     toValue: visible ? 1 : 0,
  //     duration: 200,
  //     useNativeDriver: false,
  //   }).start();
  // }, [visible]);

  return (
    <View
      style={s(
        c.fixed,
        c.left(0),
        c.right(0),
        c.bottom(0),
        c.minHeight(responsive.switch(70, [BP.lg, 120]))
        // !visible && c.noPointerEvents
      )}
    >
      <View
        style={s(
          c.fullWidth,
          c.grow,
          c.column,
          c.justifyCenter,
          c.bg(c.colors.cardBackground),
          c.shadow(0, 0, 24, 0, "rgba(0, 0, 0, 0.8)")
        )}
      >
        <View
          style={s(
            c.containerStyles(responsive.bp),
            c.alignCenter,
            c.fullHeight
          )}
        >
          <View
            style={s(
              c.row,
              c.fullWidth,
              c.justifyStart,
              c.alignCenter,
              c.fullHeight,
              c.py(isMobile ? 12 : 24)
              // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
            )}
          >
            <CurrentLineProgression />
            <Spacer width={24} />
            {<AddPendingLineButton />}
          </View>
        </View>
      </View>
    </View>
  );
};

const CurrentLineProgression = () => {
  const debugUi = useDebugState((s) => s.debugUi);
  const threshold = useUserState((s) => s.getCurrentThreshold());
  const [side] = useBrowsingState(([s]) => [s.activeSide]);

  const backgroundColor = c.grays[90];
  const completedColor = c.greens[55];
  let [biggestMissIncidence] = useRepertoireState((s) => [
    s.repertoireGrades[s.browsingState.activeSide]?.biggestMiss?.incidence *
      100,
  ]);
  const [
    hasPendingLineToAdd,
    hasAnyPendingResponses,
    pendingResponses,
    progressState,
  ] = useBrowsingState(([s]) => {
    return [
      s.hasPendingLineToAdd,
      s.hasAnyPendingResponses,
      s.pendingResponses,
      s.repertoireProgressState[s.activeSide],
    ];
  });
  const [numMovesAboveTarget] = useRepertoireState((s) => [
    s.numResponsesAboveThreshold?.[s.browsingState.activeSide],
  ]);
  // let incidence = tableResponse?.incidenceUpperBound ?? tableResponse.incidence;
  // let coverage = tableResponse?.coverage ?? incidence;
  let debugElements = debugUi && (
    <View style={s(c.column)}>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        {numMovesAboveTarget} + {keys(pendingResponses).length}
      </CMText>
    </View>
  );
  let minProgress = 0;
  // let progress = clamp(
  //   (numMovesAboveTarget / expectedNumMovesNeeded) * 100,
  //   minProgress,
  //   100
  // );
  // let animatedBarProgress = clamp(
  //   (keys(pendingResponses)?.length / expectedNumMovesNeeded) * 100,
  //   0,
  //   100
  // );
  const popoverOpacityAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(popoverOpacityAnim, {
      toValue: hasAnyPendingResponses ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [hasAnyPendingResponses]);
  let height = 8;
  let overlap = height;
  let responsive = useResponsive();
  const showPopover =
    (hasPendingLineToAdd || hasPendingLineToAdd) && !responsive.isMobile;
  return (
    <View style={s(c.column, c.grow)}>
      <Animated.View
        style={s(
          c.row,
          c.alignEnd,
          c.justifyBetween,
          c.fullWidth,
          c.opacity(progressState.headerOpacityAnim)
        )}
      >
        <CMText
          style={s(
            c.fg(c.colors.textPrimary),
            c.fontSize(responsive.switch(16, [BP.md, 20])),
            c.weightSemiBold
          )}
        >
          Repertoire coverage
          {/*completed ? (
            <>
              You have a response to every position that you will see every 200
              games or more. This is a good repertoire for your level. You can
              increase your target if you want to go deeper.
            </>
          ) : (
            <>
              Looks like you have to add a few more moves to hit your target,
              why not start with the biggest gap in your repertoire?
            </>
          )*/}
        </CMText>
        {responsive.bp >= BP.md && (
          <View style={s(c.column, c.alignEnd)}>
            <CMText
              style={s(
                c.fg(c.colors.textSecondary),
                c.fontSize(12),
                c.weightSemiBold
              )}
            >
              Goal
            </CMText>
            <Spacer height={0} />
            <CMText
              style={s(
                c.weightBold,
                c.fg(c.colors.textSecondary),
                c.weightBold,
                c.fontSize(14)
              )}
            >
              1 in {Math.round(100 / threshold)} games
            </CMText>
          </View>
        )}
      </Animated.View>
      <Spacer height={8} />
      <View style={s(c.fullWidth, c.height(height))}>
        <CoverageBar bottomNav side={side} />
      </View>
      {debugUi && debugElements}
    </View>
  );
};

const AddPendingLineButton = () => {
  const [
    isAddingPendingLine,
    addPendingLine,
    hasPendingLineToAdd,
    hasAnyPendingResponses,
    pendingLineHasConflictingMoves,
    currentLineIncidence,
  ] = useBrowsingState(([s]) => [
    s.isAddingPendingLine,
    s.addPendingLine,
    s.hasPendingLineToAdd,
    s.hasAnyPendingResponses,
    s.pendingLineHasConflictingMoves,
    s.getIncidenceOfCurrentLine(),
  ]);
  let [biggestMiss] = useRepertoireState((s) => [
    s.repertoireGrades[s.browsingState.activeSide]?.biggestMiss,
  ]);
  const isMobile = useIsMobile();
  let responsive = useResponsive();
  let minWidth = responsive.switch(100, [BP.lg, 160]);
  if (hasPendingLineToAdd || hasAnyPendingResponses) {
    return (
      <Button
        style={s(
          c.minWidth(minWidth),
          c.buttons.primary,
          c.height(isMobile ? 36 : 54),
          c.selfStretch,
          hasPendingLineToAdd ? c.bg(c.purples[45]) : c.bg(c.grays[45])
        )}
        isLoading={isAddingPendingLine}
        loaderProps={{ color: c.grays[75] }}
        onPress={() => {
          if (hasPendingLineToAdd) {
            if (pendingLineHasConflictingMoves) {
              quick((s) => {
                s.repertoireState.browsingState.editingState.addConflictingMoveModalOpen =
                  true;
              });
            } else {
              trackEvent("repertoire.add_pending_line");
              addPendingLine();
            }
          }
        }}
      >
        <CMText style={s(c.buttons.primary.textStyles, c.row, c.alignCenter)}>
          <i
            className="fa-sharp fa-check"
            style={s(
              c.fg(hasPendingLineToAdd ? c.grays[90] : c.grays[90]),
              c.fontSize(20)
            )}
          />
          <Spacer width={8} />
          <CMText
            style={s(
              c.weightBold,
              c.fg(hasPendingLineToAdd ? c.colors.textPrimary : c.grays[90]),
              c.fontSize(14)
            )}
          >
            <>Save{!isMobile && " to repertoire"}</>
          </CMText>
        </CMText>
      </Button>
    );
  }
  if (biggestMiss && !responsive.isMobile) {
    return (
      <Button
        style={s(c.buttons.basic)}
        onPress={() => {
          quick((s) => {
            s.repertoireState.browsingState.chessboardState.playPgn(
              biggestMiss.lines[0]
            );
          });
        }}
      >
        Go to biggest miss
      </Button>
    );
  }
  if (hasAnyPendingResponses) {
    return <View style={s(c.minWidth(minWidth))}></View>;
  }
  return null;
};
