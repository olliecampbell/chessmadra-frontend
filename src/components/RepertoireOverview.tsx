import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, capitalize } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { SIDES, Side } from "app/utils/repertoire";
import { plural } from "app/utils/pluralize";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  useDebugState,
  quick,
  useUserState,
} from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import { BP, useResponsive } from "app/utils/useResponsive";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { CoverageBar } from "./CoverageBar";
import { trackModule } from "app/utils/user_state";
import { CoverageGoal } from "./CoverageGoal";

export const RepertoireOverview = ({}: {}) => {
  const responsive = useResponsive();
  const vertical = responsive.isMobile;
  useEffect(() => {
    trackModule("openings");
  }, []);
  return (
    <RepertoirePageLayout centered lighterBackground>
      <View
        style={s(
          c.containerStyles(responsive.bp),
          c.py(24),
          vertical ? c.column : c.row,
          c.justifyCenter,
          vertical ? c.alignCenter : c.alignStretch
        )}
      >
        {intersperse(
          SIDES.map((side, i) => {
            return <RepertoireSideSummary key={side} side={side} />;
          }),
          (i) => {
            return (
              <Spacer
                height={32}
                width={responsive.switch(
                  16,
                  [BP.lg, 32],
                  [BP.xl, 56],
                  [BP.xxl, 128]
                )}
                key={i}
                {...{ isMobile: vertical }}
              />
            );
          }
        )}
      </View>
    </RepertoirePageLayout>
  );
};

const ReviewMovesView = ({ side }: { side?: Side }) => {
  const responsive = useResponsive();
  let [getMyResponsesLength, startReview] = useRepertoireState((s) => {
    return [s.getMyResponsesLength, s.reviewState.startReview];
  });
  let queue = useRepertoireState(
    (s) => s.reviewState.buildQueue({ side: side }),
    { referenceEquality: true }
  );
  if (getMyResponsesLength(side) === 0) {
    return <View style={s(c.height(getButtonHeight(responsive)))}></View>;
  }
  let cram = queue.length === 0;
  return (
    <SideSummaryButton
      side={side}
      text={cram ? "Cram" : "Learn"}
      icon={"fa-duotone fa-cards-blank"}
      onPress={() => {
        startReview(side, { side, cram });
        trackEvent("overview.review_moves");
      }}
    />
  );
};

export const SideSectionHeader = ({
  header,
  icon: _icon,
}: {
  header: string;
  icon?: any;
}) => {
  const isMobile = useIsMobile();
  let padding = isMobile ? 10 : 12;
  let icon = (
    <i
      className={_icon}
      style={s(c.fontSize(isMobile ? 20 : 24), c.fg(c.grays[30]))}
    />
  );
  if (isEmpty(header)) {
    return (
      <View style={s(c.absolute, c.top(padding), c.right(padding))}>
        {icon}
      </View>
    );
  }
  return (
    <View
      style={s(
        c.row,
        c.brbr(4),
        c.px(padding),
        c.pt(padding),
        c.alignCenter,
        c.justifyBetween,
        c.fullWidth,
        c.selfStart
      )}
    >
      <CMText
        style={s(
          c.fontSize(isMobile ? 16 : 18),
          c.weightBold,
          c.fg(c.colors.textPrimary)
        )}
      >
        {header}
      </CMText>
      <Spacer width={12} />
      {icon}
    </View>
  );
};

const SideEtcButton = ({ side }: { side: Side }) => {
  const responsive = useResponsive();
  const inverse = side === "black";
  const [backgroundColor, _fg, iconColor] = getButtonColors(inverse);
  const [repertoireEmpty] = useRepertoireState((s) => [
    s.getIsRepertoireEmpty(side),
  ]);
  const buttonHeight = getButtonHeight(responsive);
  const foregroundColor = inverse ? c.grays[60] : c.grays[60];
  const contrastForegroundColor = inverse ? c.grays[80] : c.grays[40];
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        c.bg(backgroundColor),
        c.border("none"),
        c.selfStretch,
        c.relative,
        c.px(responsive.switch(8, [BP.lg, 14])),
        c.py(responsive.switch(4, [BP.lg, 8]))
      )}
      onPress={() => {
        quick((s) => {
          if (repertoireEmpty) {
            quick((s) => {
              s.repertoireState.startImporting(side);
            });
          } else {
            s.repertoireState.repertoireSettingsModalSide = side;
          }
        });
      }}
    >
      <CMText
        style={s(c.fg(foregroundColor), c.fontSize(18), c.row, c.alignCenter)}
      >
        {repertoireEmpty ? (
          <>
            <i className={"fa-duotone fa-file-import"} />
            <Spacer width={8} />
            <CMText
              style={s(
                c.fg(contrastForegroundColor),
                c.fontSize(14),
                c.weightSemiBold
              )}
            >
              Import
            </CMText>
          </>
        ) : (
          <i className={"fa-sharp fa-ellipsis"} />
        )}
      </CMText>
    </Button>
  );
};

export const SideSettingsButton = ({ side }: { side: Side }) => {
  const isMobile = useIsMobile();
  const [quick] = useRepertoireState((s) => [s.quick]);
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        // isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        quick((s) => {
          s.repertoireSettingsModalSide = side;
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa-sharp fa-wrench" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.basicSecondary.textStyles,
              c.fontSize(isMobile ? 16 : 18),
              c.weightSemiBold
            )}
          >
            More
          </CMText>
        </>
      )}
    </Button>
  );
};

const SideSummaryButton = ({
  side,
  text,
  icon,
  onPress,
}: {
  side: Side;
  text: string;
  icon: string;
  onPress: () => void;
}) => {
  const responsive = useResponsive();
  const { startBrowsing } = useRepertoireState((s) => ({
    startBrowsing: s.startBrowsing,
  }));
  const inverse = side === "black";
  const [backgroundColor, foregroundColor, iconColor] =
    getButtonColors(inverse);
  const buttonHeight = getButtonHeight(responsive);
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        c.bg(backgroundColor),
        c.border("none"),
        c.selfStretch,
        c.height(buttonHeight),
        c.px(24)
      )}
      onPress={() => {
        onPress();
      }}
    >
      <CMText style={s(c.fg(iconColor), c.fontSize(18))}>
        <i className={icon} />
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(
          c.fg(foregroundColor),
          c.fontSize(responsive.switch(16)),
          c.weightBold
        )}
      >
        {text}
      </CMText>
    </Button>
  );
};

const SeeBiggestMissButton = ({ side }: { side: Side }) => {
  const [biggestMiss] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.biggestMiss,
    s.quick,
  ]);
  let height = 48;
  const responsive = useResponsive();
  const { startBrowsing } = useRepertoireState((s) => ({
    startBrowsing: s.startBrowsing,
  }));
  const inverse = side === "black";
  const [backgroundColor, foregroundColor, iconColor] =
    getButtonColors(inverse);
  if (!biggestMiss) {
    return <View style={s(c.height(height))}></View>;
  }
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        c.bg("none"),
        c.border("none"),
        c.selfStretch,
        c.px(24),
        c.pt(4),
        c.height(height),
        c.pr(0),
        c.pb(0)
      )}
      onPress={() => {
        quick((s) => {
          s.repertoireState.startBrowsing(side as Side, biggestMiss.lines[0]);
          trackEvent("overview.go_to_biggest_miss");
        });
      }}
    >
      <CMText
        style={s(
          c.fg(foregroundColor),
          c.fontSize(responsive.switch(16)),
          c.weightBold
        )}
      >
        Go to biggest gap
      </CMText>
      <Spacer width={8} />
      <CMText style={s(c.fg(iconColor), c.fontSize(18))}>
        <i className="fa fa-arrow-right" />
      </CMText>
    </Button>
  );
};

export const BrowseButton = ({ side }: { side: Side }) => {
  const responsive = useResponsive();
  const { startBrowsing } = useRepertoireState((s) => ({
    startBrowsing: s.startBrowsing,
  }));
  const inverse = side === "black";
  let [getMyResponsesLength] = useRepertoireState((s) => {
    return [s.getMyResponsesLength];
  });
  let hasNoMovesThisSide = getMyResponsesLength(side) === 0;
  if (hasNoMovesThisSide) {
    return <View style={s(c.height(getButtonHeight(responsive)))}></View>;
  }
  return (
    <SideSummaryButton
      side={side}
      text={"Build"}
      icon={"fa-sharp fa-solid fa-compass"}
      onPress={() => {
        trackEvent("overview.browse_repertoire");
        startBrowsing(side);
      }}
    />
  );
};

const getTextColors = (inverse: boolean): [string, string] => {
  return inverse ? [c.grays[95], c.grays[70]] : [c.grays[8], c.grays[32]];
};

const getButtonColors = (inverse: boolean): [string, string, string] => {
  return inverse
    ? [c.grays[12], c.grays[70], c.grays[40]]
    : // Background, foreground, icon
      [c.grays[90], c.grays[35], c.grays[70]];
};

const RepertoireSideSummary = ({ side }: { side: Side }) => {
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;
  let [expectedDepth, biggestMiss, numMoves] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.expectedDepth,
    s.repertoireGrades[side]?.biggestMiss,
    s.getLineCount(side),
  ]);
  let queue = useRepertoireState(
    (s) => s.reviewState.buildQueue({ side: side }),
    { referenceEquality: true }
  );
  // let [queueLength] = useRepertoireState((s) => {
  //   return [s.reviewState.getQueueLength(side)];
  // });
  const inverse = side === "black";
  const [textColor, secondaryTextColor] = getTextColors(inverse);
  const padding = getRepertoireSideCardPadding(responsive);
  const empty = numMoves === 0;
  const topPadding = responsive.switch(12, [BP.lg, 28], [BP.xl, 28]);
  // let biggestMissRow = createBiggestMissRow(state, side);
  return (
    <View
      style={s(
        c.column,
        responsive.isMobile && c.fullWidth,
        c.maxWidth(600),
        responsive.isMobile && c.minHeight(300),
        c.shadow(0, 8, 16, 0, "rgba(0, 0, 0, 0.5)"),
        c.grow,
        c.flexShrink,
        !responsive.isMobile && c.flexible,
        c.rounded,
        c.bg(inverse ? c.grays[4] : c.grays[95]),
        // c.px(12),
        c.pt(topPadding),
        c.relative,
        c.zIndex(side === "white" ? 20 : 10)
      )}
    >
      <View style={s(c.absolute, c.top(topPadding), c.right(padding))}>
        <SideEtcButton side={side} />
      </View>
      <CMText
        style={s(
          c.fontSize(
            responsive.switch(24, [BP.lg, 24], [BP.xl, 28], [BP.xxl, 32])
          ),
          c.selfCenter,
          c.weightBold,
          c.fg(textColor)
        )}
      >
        {capitalize(side) + responsive.switch("", [BP.md, " repertoire"])}
      </CMText>
      <Spacer height={responsive.switch(48, [BP.lg, 72], [BP.xl, 108])} />
      <View style={s(c.row, c.selfCenter, c.px(24))}>
        {empty ? (
          <EmptyStatus side={side} />
        ) : (
          <>
            <SummaryRow
              {...{
                k: plural(numMoves, "Line"),
                v: numMoves,
                inverse,
                button: <BrowseButton side={side} />,
              }}
            />
            <Spacer
              width={responsive.switch(16, [BP.md, 32], [BP.xl, 48])}
              height={24}
              style={s(c.flexShrink)}
              isMobile={responsive.isMobile}
            />
            <SummaryRow
              {...{
                k: "Due",
                v: queue?.length ?? 0,
                inverse,
                button: <ReviewMovesView side={side} />,
              }}
            />
          </>
        )}
      </View>
      <Spacer height={responsive.switch(48, [BP.lg, 72], [BP.xl, 108])} grow />
      {numMoves > 0 && (
        <>
          <SideProgressReport side={side} />
        </>
      )}
    </View>
  );
};
const EmptyStatus = ({ side }: { side: Side }) => {
  const responsive = useResponsive();
  const inverse = side === "black";
  const [backgroundColor, foregroundColor, iconColor] =
    getButtonColors(inverse);
  return (
    <Pressable
      style={s(c.column, c.maxWidth(200), c.alignEnd, c.clickable)}
      onPress={() => {
        quick((s) => {
          s.repertoireState.startBrowsing(side as Side);
          trackEvent("overview.click_empty_state_cta");
        });
      }}
    >
      <CMText style={s(c.weightSemiBold, c.fg(foregroundColor))}>
        This repertoire is empty.{" "}
        {side === "white"
          ? "Let's start with your first move."
          : "Let's see what moves you need to prepare for."}{" "}
      </CMText>
      <Spacer height={8} />
      <View style={s(c.border("none"), c.pt(4), c.pr(0), c.pb(0), c.row)}>
        <CMText
          style={s(
            c.fg(foregroundColor),
            c.fontSize(responsive.switch(16)),
            c.weightBold
          )}
        >
          Take me there
        </CMText>
        <Spacer width={8} />
        <CMText style={s(c.fg(iconColor), c.fontSize(18))}>
          <i className="fa fa-arrow-right" />
        </CMText>
      </View>
    </Pressable>
  );
};

const SideProgressReport = ({ side }: { side: Side }) => {
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  const responsive = useResponsive();
  const inverse = side === "black";
  const [backgroundColor, inProgressColor, completedColor] = inverse
    ? [c.grays[14], c.yellows[45], c.greens[50]]
    : [c.grays[80], c.yellows[65], c.greens[50]];
  let [biggestMissIncidence, numMoves, numAboveThreshold, progressState] =
    useRepertoireState((s) => [
      s.repertoireGrades[side]?.biggestMiss?.incidence * 100,
      s.myResponsesLookup?.[side]?.length,
      s.numResponsesAboveThreshold?.[side],
      s.browsingState.repertoireProgressState[side],
    ]);
  const debugUi = useDebugState((s) => s.debugUi);

  const [textColor, secondaryTextColor] = getTextColors(inverse);
  const percentComplete = progressState.percentComplete;
  return (
    <View
      style={s(
        c.column,
        c.justifyStart,
        c.fullWidth,
        c.py(responsive.switch(18, [BP.lg, 24])),
        c.px(getRepertoireSideCardPadding(responsive)),
        c.bg(inverse ? c.grays[10] : c.grays[90])
        // c.borderTop(`1px solid ${inverse ? c.grays[15] : c.grays[80]}`)
      )}
    >
      <View
        style={s(c.row, c.justifyBetween, c.alignEnd, c.zIndex(12), c.relative)}
      >
        <CMText
          style={s(
            c.fg(secondaryTextColor),
            c.fontSize(responsive.switch(20)),
            c.weightSemiBold
          )}
        >
          {progressState.completed ? (
            <>Completed</>
          ) : (
            <>{Math.round(percentComplete)}% complete</>
          )}
        </CMText>
        <CoverageGoal textColor={secondaryTextColor} />
      </View>
      <Spacer height={8} />
      <View
        style={s(
          c.fullWidth,
          c.bg(backgroundColor),
          c.round,
          c.overflowHidden,
          c.height(6)
        )}
      >
        <CoverageBar side={side} inverse={inverse} />
      </View>
      {debugUi && (
        <View style={s()}>
          <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
            # above threshold {numAboveThreshold}
          </CMText>
        </View>
      )}
      {!progressState.completed && (
        <>
          <Spacer height={8} />
          <View style={s(c.selfEnd)}>
            <SeeBiggestMissButton side={side} />
          </View>
        </>
      )}
    </View>
  );
};

const SummaryRow = ({ k, v, inverse, button }) => {
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;
  const [textColor, secondaryTextColor] = getTextColors(inverse);
  return (
    <View
      style={s(
        c.column,
        c.alignCenter,
        !responsive.isMobile && c.width(responsive.switch(180, [BP.xl, 220]))
      )}
    >
      <View style={s(c.row, c.alignEnd)}>
        <CMText
          style={s(
            c.fg(textColor),
            c.weightBold,
            c.fontSize(responsive.switch(22, [BP.lg, 32]))
          )}
        >
          {v}
        </CMText>
        <Spacer width={8} isMobile={isMobile} height={4} />
        <CMText
          style={s(
            c.fg(secondaryTextColor),
            c.weightSemiBold,
            c.fontSize(responsive.switch(14, [BP.lg, 16])),
            c.mb(2)
          )}
        >
          {k}
        </CMText>
      </View>
      <Spacer height={responsive.switch(4, [BP.lg, 12])} />
      {button}
    </View>
  );
};

const getButtonHeight = (responsive: any) => {
  return responsive.switch(36, [BP.lg, 48]);
};

function getRepertoireSideCardPadding(responsive) {
  return responsive.switch(12, [BP.lg, 20], [BP.xl, 24]);
}

export const getExpectedNumberOfMovesForTarget = (target: number) => {
  // if (target === 0.04) {
  //   return 32;
  // }
  // if (target === 0.02) {
  //   return 72;
  // }
  // let [a, b] = [536, -1.22];
  //
  // return a * Math.exp(b * target);
  let [a, b] = [98.76334927, 137.34870497];

  return (1 / (target * a)) * b;
};
// THRESHOLD_OPTIONS.forEach((o) => {
//   console.log("_____THRESHOLDS______");
//   console.log(o, getExpectedNumberOfMovesForTarget(o));
// });
