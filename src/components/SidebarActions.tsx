import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty } from "lodash-es";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import { quick, useBrowsingState, useSidebarState } from "app/utils/app_state";
import { useResponsive } from "app/utils/useResponsive";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { useHovering } from "app/hooks/useHovering";

export interface SidebarAction {
  onPress: () => void;
  text: string;
  style: "primary" | "focus";
}

export const SidebarActions = () => {
  const responsive = useResponsive();
  const buttons = [] as SidebarAction[];
  const [
    hasPendingLineToAdd,
    isPastCoverageGoal,
    currentSide,
    addedLineState,
    submitFeedbackState,
    deleteLineState,
    currentLine,
    stageStack,
    currentEpd,
    nearestMiss,
  ] = useSidebarState(([s, bs]) => [
    s.hasPendingLineToAdd,
    s.isPastCoverageGoal,
    s.currentSide,
    s.addedLineState,
    s.submitFeedbackState,
    s.deleteLineState,
    s.moveLog,
    s.sidebarOnboardingState.stageStack,
    s.currentEpd,
    bs.getNearestMiss(s),
  ]);
  const [activeSide] = useBrowsingState(([s]) => [s.activeSide]);
  let reviewCurrentLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.reviewState.reviewLine(currentLine, activeSide);
      });
    },
    text: "Practice this line",
    style: "primary",
  };
  let continueAddingToThisLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.browsingState.moveSidebarState("right");
        s.repertoireState.browsingState.sidebarState.addedLineState.visible =
          false;
      });
    },
    text: "Continue adding to this line",
    style: "primary",
  };
  let addBiggestMissAction = () => {
    if (nearestMiss && nearestMiss.epd !== currentEpd) {
      buttons.push(goToBiggestMissAction);
    }
  };
  let goToBiggestMissAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.browsingState.moveSidebarState("right");
        s.repertoireState.browsingState.dismissTransientSidebarState();
        s.repertoireState.browsingState.chessboardState.playPgn(
          nearestMiss.lines[0]
        );
      });
    },
    text: "Go to the biggest gap in your repertoire",
    style: "primary",
  };
  if (submitFeedbackState.visible) {
    // This is taken care of by the delete line view, maybe bad though
  } else if (deleteLineState.visible) {
    // This is taken care of by the delete line view, maybe bad though
  } else if (!isEmpty(stageStack)) {
    // Taken care of by onboarding
  } else if (addedLineState.visible) {
    addBiggestMissAction();
    buttons.push(reviewCurrentLineAction);
    buttons.push(continueAddingToThisLineAction);
  } else if (!hasPendingLineToAdd) {
    addBiggestMissAction();
  } else if (hasPendingLineToAdd) {
    buttons.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.requestToAddCurrentLine();
        });
      },
      text: isPastCoverageGoal
        ? "Save this line to my repertoire"
        : "I'll finish this later, save my progress",
      style: isPastCoverageGoal ? "focus" : "primary",
    });
  }
  return (
    <View style={s(c.column, c.fullWidth)}>
      {intersperse(
        buttons.map((b) => <SidebarFullWidthButton action={b} />),
        () => {
          return <Spacer height={10} />;
        }
      )}
    </View>
  );
};
export const SidebarFullWidthButton = ({
  action,
}: {
  action: SidebarAction;
}) => {
  const responsive = useResponsive();
  const { hovering, hoveringProps } = useHovering();
  let backgroundColor,
    foregroundColor = null;
  if (action.style === "focus") {
    foregroundColor = c.grays[10];
    if (hovering) {
      backgroundColor = c.grays[86];
    } else {
      backgroundColor = c.grays[82];
    }
  }
  if (action.style === "primary") {
    foregroundColor = c.grays[90];
    if (hovering) {
      backgroundColor = c.grays[26];
    } else {
      backgroundColor = c.grays[22];
    }
  }
  return (
    <Pressable
      onPress={action.onPress}
      {...hoveringProps}
      style={s(
        c.fullWidth,
        c.bg(backgroundColor),
        c.row,
        c.justifyBetween,
        c.alignCenter,
        c.py(12),
        c.px(getSidebarPadding(responsive))
      )}
      key={action.text}
    >
      <CMText
        style={s(
          c.fg(foregroundColor),
          action.style === "focus" ? c.weightBold : c.weightSemiBold,
          c.fontSize(14)
        )}
      >
        {action.text}
      </CMText>
      <i
        className="fa-regular fa-arrow-right-long"
        style={s(c.fg(foregroundColor))}
      />
    </Pressable>
  );
};
