// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  isEmpty,
  findLastIndex,
  filter,
  map,
  last,
  isNil,
  cloneDeep,
} from "lodash-es";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { lineToPgn, pgnToLine } from "~/utils/repertoire";
import { lineToPositions } from "~/utils/chess";
import { getNameEcoCodeIdentifier } from "~/utils/eco_codes";
import { trackEvent } from "~/utils/trackEvent";
import { Component, JSXElement } from "solid-js";
import { useHovering } from "~/mocks";
import { Pressable } from "./Pressable";
import { Intersperse } from "./Intersperse";

export interface SidebarAction {
  rightText?: string;
  onPress: () => void;
  text: string;
  right?: Component;
  subtext?: string;
  style: "primary" | "focus" | "secondary" | "tertiary" | "wide";
}

export const SidebarActions = () => {
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  let [
    hasPendingLineToAdd,
    isPastCoverageGoal,
    addedLineState,
    submitFeedbackState,
    deleteLineState,
    currentLine,
    stageStack,
    currentEpd,
    nearestMiss,
    lineMiss,
    positionHistory,
    showPlansState,
    transposedState,
    mode,
    numDue,
  ] = useSidebarState(([s, bs, rs]) => [
    s.hasPendingLineToAdd,
    s.isPastCoverageGoal,
    s.addedLineState,
    s.submitFeedbackState,
    s.deleteLineState,
    s.moveLog,
    s.sidebarOnboardingState.stageStack,
    s.currentEpd,
    cloneDeep(bs.getNearestMiss(s)),
    cloneDeep(bs.getMissInThisLine(s)),
    s.positionHistory,
    s.showPlansState,
    s.transposedState,
    s.mode,
    rs.numMovesDueFromEpd?.[s.activeSide]?.[s.currentEpd],
  ]);
  positionHistory = positionHistory ?? [];
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
  const [hasPlans] = useBrowsingState(([s, rs]) => [
    !isEmpty(
      rs.positionReports[s.sidebarState.currentSide][s.sidebarState.currentEpd]
        ?.plans
    ),
  ]);
  const reviewCurrentLineAction: SidebarAction = {
    onPress: () => {
      trackEvent(`${mode}.added_line_state.practice_line`);
      quick((s) => {
        s.repertoireState.reviewState.reviewLine(currentLine(), activeSide());
      });
    },
    text: "Practice this line",
    style: "primary",
  };
  const continueAddingToThisLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        trackEvent(`${mode}.added_line_state.contrinue_this_line`);
        s.repertoireState.browsingState.moveSidebarState("right");
        s.repertoireState.browsingState.sidebarState.addedLineState.visible =
          false;
      });
    },
    text: "Continue adding to this line",
    style: "primary",
  };
  const buttonsSig = () => {
    let buttons = [];
    const addBiggestMissAction = () => {
      let miss = null;
      if (addedLineState().visible) {
        miss = nearestMiss() ?? lineMiss();
      } else {
        miss = lineMiss();
      }
      if (isNil(miss)) {
        return;
      }
      const text = `Go to the next gap in your repertoire`;
      const line = pgnToLine(miss.lines[0]);
      const missPositions = lineToPositions(line);
      const missPositionsSet = new Set(missPositions);
      const currentOpeningName = last(
        filter(
          map(positionHistory(), (epd) => {
            const ecoCode = ecoCodeLookup()[epd];
            if (ecoCode) {
              return getNameEcoCodeIdentifier(ecoCode.fullName);
            }
          })
        )
      );
      const openingNameOfMiss = last(
        filter(
          map(missPositions, (epd) => {
            const ecoCode = ecoCodeLookup()[epd];
            if (ecoCode) {
              return getNameEcoCodeIdentifier(ecoCode.fullName);
            }
          })
        )
      );

      const i = findLastIndex(positionHistory(), (epd) => {
        if (missPositionsSet.has(epd)) {
          return true;
        }
        return false;
      });
      const isAtBiggestMiss = currentEpd() === last(missPositions);
      if (miss && !isAtBiggestMiss) {
        buttons.push({
          onPress: () => {
            quick((s) => {
              trackEvent(`${mode}.added_line_state.next_gap`);
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.dismissTransientSidebarState();
              const lastMatchingEpd = positionHistory()[i];
              s.repertoireState.browsingState.chessboardState.playPgn(
                lineToPgn(line),
                {
                  animated: true,
                  fromEpd: lastMatchingEpd,
                  animateLine: line.slice(i),
                }
              );
            });
          },
          text: text,
          style: "focus",
        });
      }
    };
    let showTogglePlansButton = true;
    if (submitFeedbackState().visible) {
      showTogglePlansButton = false;
      // This is taken care of by the delete line view, maybe bad though
    } else if (transposedState().visible) {
      showTogglePlansButton = false;
    } else if (showPlansState().visible) {
      showTogglePlansButton = false;
      // This is taken care of by the delete line view, maybe bad though
    } else if (deleteLineState().visible) {
      showTogglePlansButton = false;
      // This is taken care of by the delete line view, maybe bad though
    } else if (!isEmpty(stageStack())) {
      showTogglePlansButton = false;
      // Taken care of by onboarding
    } else if (addedLineState().visible) {
      addBiggestMissAction();
      buttons.push(reviewCurrentLineAction);
      buttons.push(continueAddingToThisLineAction);
    } else if (!hasPendingLineToAdd()) {
      addBiggestMissAction();
    } else if (hasPendingLineToAdd()) {
      buttons.push({
        onPress: () => {
          isPastCoverageGoal()
            ? trackEvent(`${mode}.save_line`)
            : trackEvent(`${mode}.save_line_premature`);
          quick((s) => {
            s.repertoireState.browsingState.requestToAddCurrentLine();
          });
        },
        text: isPastCoverageGoal()
          ? "Save this line to my repertoire"
          : "I'll finish this later, save my progress",
        style: "primary",
      });
    }
    if (showTogglePlansButton && hasPlans()) {
      buttons.push({
        onPress: () => {
          quick((s) => {
            const bs = s.repertoireState.browsingState;
            bs.moveSidebarState("right");
            bs.sidebarState.showPlansState.visible = true;
            bs.sidebarState.showPlansState.coverageReached = false;
            bs.chessboardState.showPlans = true;
          });
        },
        text: "How to play from here",
        style: "primary",
      });
    }
    if (mode() === "browse") {
      buttons = [];
      if (numDue() > 0) {
        buttons.push({
          onPress: () => {
            trackEvent(`${mode}.practice_due`);
            quick((s) => {
              s.repertoireState.reviewState.startReview(activeSide(), {
                side: activeSide,
                startLine: currentLine,
                startPosition: currentEpd,
              });
            });
          },
          text: `Practice ${numDue()} moves which are due for review`,
          style: "primary",
        });
      }
      buttons.push({
        onPress: () => {
          quick((s) => {
            trackEvent(`${mode}.practice_all`);
            s.repertoireState.reviewState.startReview(activeSide(), {
              side: activeSide,
              cram: true,
              startLine: currentLine,
              startPosition: currentEpd,
            });
          });
        },
        text: `Practice ALL moves from here`,
        style: "primary",
      });
    }
    // TODO: this is terrible, the views should just define their own actions
    if (mode() === "review") {
      buttons = [];
    }
    if (mode() === "overview") {
      buttons = [];
    }
    if (mode() === "home") {
      buttons = [];
    }
    return buttons;
  };
  return (
    <div style={s(c.column, c.fullWidth)}>
      <Intersperse
        each={buttonsSig}
        separator={() => {
          return <Spacer height={10} />;
        }}
      >
        {(b, i) => <SidebarFullWidthButton key={i} action={b} />}
      </Intersperse>
    </div>
  );
};
export const SidebarFullWidthButton = ({
  action,
}: {
  action: SidebarAction;
}) => {
  const responsive = useResponsive();
  const { hovering, hoveringProps } = useHovering();
  let py = 12;
  const styles = () => {
    let backgroundColor,
      foregroundColor,
      subtextColor = null;
    let textStyles = s();
    if (action.style === "focus") {
      foregroundColor = c.grays[10];
      subtextColor = c.grays[20];
      if (hovering()) {
        backgroundColor = c.grays[86];
      } else {
        backgroundColor = c.grays[82];
      }
    }
    if (action.style === "wide") {
      textStyles = s(textStyles, c.fontSize(18), c.weightBold);
      foregroundColor = c.colors.textPrimary;
      // subtextColor = c.grays[20];
      py = 20;
      if (hovering()) {
        backgroundColor = c.grays[36];
      } else {
        backgroundColor = c.grays[30];
      }
    }
    if (action.style === "tertiary") {
      foregroundColor = c.colors.textTertiary;
      subtextColor = c.grays[20];
      if (hovering()) {
        foregroundColor = c.colors.textSecondary;
      }
      // if (hovering) {
      //   backgroundColor = c.grays[8];
      // } else {
      //   backgroundColor = c.grays[16];
      // }
    }
    if (action.style === "secondary") {
      foregroundColor = c.colors.textSecondary;
      subtextColor = c.grays[20];
      if (hovering()) {
        foregroundColor = c.colors.textPrimary;
      }
    }
    if (action.style === "primary") {
      foregroundColor = c.colors.textPrimary;
      subtextColor = c.grays[70];
      if (hovering()) {
        backgroundColor = c.grays[36];
      } else {
        backgroundColor = c.grays[30];
      }
    }
    return {
      backgroundColor,
      foregroundColor,
      subtextColor,
      textStyles,
    };
  };
  return (
    <Pressable
      onPress={action.onPress}
      {...hoveringProps}
      style={s(
        c.fullWidth,
        c.bg(styles().backgroundColor),
        c.row,
        c.justifyBetween,
        c.alignCenter,
        c.py(py),
        c.px(c.getSidebarPadding(responsive)),
        action.style === "secondary" &&
          c.borderBottom(`1px solid ${c.colors.border}`)
      )}
      key={action.text}
    >
      <div style={s(c.column)}>
        <CMText
          style={s(
            c.fg(styles().foregroundColor),
            action.style === "focus" ? c.weightBold : c.weightSemiBold,
            c.fontSize(14),
            styles().textStyles
          )}
        >
          {action.text}
        </CMText>
        <Show when={action.subtext}>
          <>
            <Spacer height={4} />
            <CMText
              style={s(
                c.fg(styles().subtextColor),
                action.style === "focus" ? c.weightBold : c.weightSemiBold,
                c.fontSize(14)
              )}
            >
              {action.subtext}
            </CMText>
          </>
        </Show>
      </div>
      <Spacer width={16} />
      <Show when={action.right}>
        <div style={s(c.row, c.center)}>
          {typeof action.right === "string" ? (
            <CMText
              style={s(
                c.fg(c.colors.textTertiary),
                action.style === "focus" ? c.weightBold : c.weightSemiBold,
                c.fontSize(12)
              )}
            >
              {action.right}
            </CMText>
          ) : (
            <CMText style={s(c.fg(c.colors.textTertiary), c.fontSize(14))}>
              {action.right}
            </CMText>
          )}
        </div>
      </Show>
    </Pressable>
  );
};

export const SidebarSectionHeader = ({
  text,
  right,
}: {
  text: string;
  right?: JSXElement;
}) => {
  const responsive = useResponsive();
  return (
    <div
      style={s(
        c.row,
        c.justifyBetween,
        c.alignCenter,
        c.px(c.getSidebarPadding(responsive)),
        c.pb(12),
        c.borderBottom(`1px solid ${c.colors.border}`)
      )}
    >
      <CMText style={s(c.fontSize(14), c.fg(c.colors.textTertiary))}>
        {text}
      </CMText>
      {right}
    </div>
  );
};

const TogglePlansButton = () => {
  const [showPlans] = useBrowsingState(([s, rs]) => [
    s.chessboardState.showPlans,
  ]);
  const responsive = useResponsive();
  return (
    <Pressable
      style={s(
        c.row,
        c.fullWidth,
        c.alignCenter,
        c.bg(c.grays[10]),
        c.py(8),
        c.px(c.getSidebarPadding(responsive))
      )}
      onPress={() => {
        quick((s) => {
          const cs = s.repertoireState.browsingState.chessboardState;
          cs.showPlans = !cs.showPlans;
        });
      }}
    >
      <div style={s(c.row, c.alignCenter)}>
        <CMText style={s(c.fg(c.colors.textSecondary), c.weightSemiBold)}>
          Show some common plans?
        </CMText>
        <Spacer width={8} />
        <CMText
          style={s(
            c.bg(c.grays[80]),
            c.fontSize(9),
            c.px(5),
            c.py(3),
            c.round,
            c.caps,
            c.weightHeavy,
            c.fg(c.colors.textInverse)
          )}
        >
          Beta
        </CMText>
      </div>
      <Spacer width={12} grow />
      <i
        class={`fa-solid fa-toggle-${showPlans ? "on" : "off"}`}
        style={s(c.fg(c.grays[90]), c.fontSize(24))}
      />
    </Pressable>
  );
};
