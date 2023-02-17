import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, capitalize, dropRight, last } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { SIDES, Side, pgnToLine, lineToPgn } from "app/utils/repertoire";
import { plural, pluralize } from "app/utils/pluralize";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  useDebugState,
  quick,
  useUserState,
  getAppState,
  useBrowsingState,
} from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import { BP, useResponsive } from "app/utils/useResponsive";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { CoverageBar } from "./CoverageBar";
import { trackModule } from "app/utils/user_state";
import { CoverageGoal } from "./CoverageGoal";
import { useHovering } from "app/hooks/useHovering";
import { CoverageAndBar } from "./RepertoirtOverview";
import { START_EPD } from "app/utils/chess";
import { ReviewText } from "./ReviewText";
import { THRESHOLD_OPTIONS } from "./ProfileModal";
import { SettingButton } from "./Settings";
import { getSidebarPadding } from "./RepertoireBrowsingView";

export const RepertoireHome = ({}: {}) => {
  const responsive = useResponsive();
  const vertical = responsive.isMobile;
  useEffect(() => {
    trackModule("openings");
  }, []);
  return (
    <RepertoirePageLayout naked>
      <View
        style={s(
          vertical ? c.column : c.row,
          c.fullWidth,
          c.fullHeight,
          c.justifyCenter,
          c.pageHeight,
          vertical ? c.alignCenter : c.alignStretch,
          c.relative
        )}
      >
        <View
          style={s(
            c.absolute,
            c.zIndex(15),
            c.top(getSidebarPadding(responsive)),
            c.right(getSidebarPadding(responsive))
          )}
        >
          <SettingButton
            title={"Other tools"}
            icon={"fa-sharp fa-gear"}
            onPress={() => {
              quick((s) => {
                quick((s) => {
                  s.navigationState.push("/directory");
                });
              });
            }}
          />
        </View>
        {intersperse(
          (vertical ? ["black", "white"] : SIDES).map((side, i) => {
            return <RepertoireSideSummary key={side} side={side} />;
          }),
          (i) => {
            return null;
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
        // startReview(side, { side, cram });
        quick((s) => {
          s.repertoireState.startBrowsing(side, "browse");
        });
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
  const inverse = side === "white";
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
  const inverse = side === "white";
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
  const inverse = side === "white";
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
          let line = pgnToLine(biggestMiss.lines[0]);
          if (line.length > 1) {
            line = dropRight(line, 1);
          }

          s.repertoireState.startBrowsing(side as Side, "build", {
            pgnToPlay: lineToPgn(line),
          });
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
  const inverse = side === "white";
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
        startBrowsing(side, "build");
      }}
    />
  );
};

const getTextColors = (inverse: boolean): [string, string] => {
  return inverse ? [c.grays[8], c.grays[32]] : [c.grays[95], c.grays[70]];
};

const getButtonColors = (inverse: boolean): [string, string, string] => {
  return inverse
    ? [c.grays[90], c.grays[35], c.grays[70]]
    : // Background, foreground, icon
      [c.grays[12], c.grays[70], c.grays[40]];
};

const RepertoireSideSummary = ({ side }: { side: Side }) => {
  const { hovering, hoveringProps } = useHovering();
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;
  let [biggestMiss, numMoves] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.biggestMiss,
    s.getLineCount(side),
  ]);
  const [numMovesDueFromHere, earliestDueDate] = useBrowsingState(([s, rs]) => [
    rs.numMovesDueFromEpd[side][START_EPD],
    rs.earliestReviewDueFromEpd[side][START_EPD],
  ]);
  // let [queueLength] = useRepertoireState((s) => {
  //   return [s.reviewState.getQueueLength(side)];
  // });
  const inverse = side === "white";
  const [textColor, secondaryTextColor] = getTextColors(inverse);
  const padding = getRepertoireSideCardPadding(responsive);
  const empty = numMoves === 0;
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[side],
  ]);
  let action: SuggestedActionType = null;
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  if (empty) {
    action = {
      cta: null,
      description: (
        <>
          This repertoire is empty.{" "}
          {side === "white"
            ? "Let's start with your first move."
            : "Let's see what moves you need to prepare for."}{" "}
        </>
      ),
      side,
      action: () => {
        quick((s) => {
          s.repertoireState.startBrowsing(side as Side, "build");
          trackEvent("overview.click_empty_state_cta");
        });
      },
    };
  } else if (numMovesDueFromHere > 0) {
    action = {
      cta: "Review now",
      description: (
        <>
          You have <b>{pluralize(numMovesDueFromHere, "move")}</b> due for
          review, it's recommended to review these before building your
          repertoire further.
        </>
      ),
      side,
      action: () => {
        quick((s) => {
          s.repertoireState.reviewState.startReview(side, { side });
          trackEvent("overview.click_empty_state_cta");
        });
      },
    };
  } else if (progressState.completed && threshold > last(THRESHOLD_OPTIONS)) {
    action = {
      cta: null,
      description: (
        <>
          You have completed your repertoire! Increase your coverage target if
          you want to go deeper, or you can go play some games!
        </>
      ),
      side,
      action: () => {
        quick((s) => {
          s.userState.profileModalOpen = true;
        });
      },
    };
  } else if (!progressState.completed) {
    action = {
      cta: "Go to biggest gap",
      description: (
        <>
          Your repertoire is <b>{Math.round(progressState.percentComplete)}%</b>{" "}
          complete. Address the gaps in you repertoire to get that to 100%.
        </>
      ),
      side,
      action: () => {
        quick((s) => {
          let line = pgnToLine(biggestMiss.lines[0]);

          console.log({ line });
          s.repertoireState.startBrowsing(side as Side, "build", {
            pgnToPlay: lineToPgn(line),
          });
          trackEvent("overview.click_go_to_biggest_gap");
        });
      },
    };
  }
  const topPadding = responsive.switch(48, [BP.lg, 28], [BP.xl, 28]);
  const separator = (
    <View
      style={s(
        c.mx(responsive.switch(16, [BP.xl, 24])),
        c.width(1),
        c.selfStretch,
        c.bg(inverse ? c.grays[80] : c.grays[30])
      )}
    ></View>
  );
  // let biggestMissRow = createBiggestMissRow(state, side);
  return (
    <Pressable
      {...hoveringProps}
      onPress={() => {
        quick((s) => {
          console.log("start browsing", side);
          s.repertoireState.startBrowsing(side, "overview");
        });
      }}
      style={s(
        c.clickable,
        c.column,
        c.selfStretch,
        responsive.isMobile && c.fullWidth,
        responsive.isMobile && c.minHeight(300),
        c.shadow(0, 8, 16, 0, "rgba(0, 0, 0, 0.5)"),
        c.grow,
        c.flexShrink,
        !responsive.isMobile && c.flexible,
        c.rounded,
        c.bg(inverse ? c.grays[95] : c.grays[4]),
        // c.px(12),
        c.relative,
        c.zIndex(side === "white" ? 20 : 10),
        c.px(24),
        c.py(topPadding),
        c.center
      )}
    >
      <View style={s(c.column, c.alignCenter)}>
        <CMText
          style={s(
            c.fontSize(responsive.switch(48, [BP.xl, 54], [BP.xxl, 70])),
            c.selfCenter,
            c.weightHeavy,
            c.fg(textColor),
            c.borderBottom(`4px solid ${hovering ? textColor : "transparent"}`)
          )}
        >
          {capitalize(side)}
        </CMText>
      </View>
    </Pressable>
  );
};

interface SuggestedActionType {
  action: () => void;
  description: React.ReactNode;
  cta?: string;
  side: Side;
}

const SuggestedAction = ({
  action,
  description,
  cta,
  side,
}: SuggestedActionType) => {
  const responsive = useResponsive();
  const inverse = side === "white";
  const [backgroundColor, foregroundColor, iconColor] =
    getButtonColors(inverse);
  const { hovering, hoveringProps } = useHovering();
  const bgShade = inverse ? 90 : 10;
  return (
    <Pressable
      style={s(
        c.column,
        c.px(12),
        c.br(4),
        c.py(12),
        c.bg(c.grays[bgShade + (hovering ? 5 : 0) * (inverse ? -1 : 1)]),
        c.border(`1px solid ${c.grays[inverse ? 80 : 25]}`),
        c.minWidth(200),
        c.maxWidth(400),
        c.alignEnd,
        c.clickable,
        c.selfCenter
      )}
      {...hoveringProps}
      onPress={() => {
        console.log("action");
        action();
      }}
    >
      <CMText
        style={s(
          c.weightSemiBold,
          c.fontSize(responsive.switch(12, [BP.md, 14])),
          c.lineHeight("1.1rem"),
          c.fg(foregroundColor),
          c.selfStart
        )}
      >
        {description}
      </CMText>
      <Spacer height={responsive.switch(12, [BP.md, 16])} />
      <View
        style={s(
          c.border("none"),
          c.pt(4),
          c.pr(0),
          c.pb(0),
          c.row,
          c.alignCenter
        )}
      >
        <CMText
          style={s(
            c.fg(foregroundColor),
            c.fontSize(responsive.switch(14, [BP.md, 16])),
            c.weightBold
          )}
        >
          {cta ?? "Take me there"}
        </CMText>
        <Spacer width={8} />
        <CMText style={s(c.fg(iconColor), c.fontSize(18))}>
          <i className="fa fa-arrow-right" />
        </CMText>
      </View>
    </Pressable>
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
