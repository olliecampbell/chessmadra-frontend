import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import { useRepertoireState, quick } from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import React, { useEffect } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { pgnToLine } from "app/utils/repertoire";
import { SidebarLayout } from "./RepertoireBrowsingView";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";

export const RepertoireReview = (props: {}) => {
  const isMobile = useIsMobile();
  const buttonStyles = s(c.width("unset"), c.py(8));
  const [
    completedReviewPositionMoves,
    currentMove,
    repertoireLoading,
    showNext,
  ] = useRepertoireState((s) => [
    s.reviewState.completedReviewPositionMoves,
    s.reviewState.currentMove,
    s.repertoire === undefined,
    s.reviewState.showNext,
  ]);
  const actions: SidebarAction[] = [
    {
      onPress: () => {
        quick((s) => {
          if (s.repertoireState.reviewState.showNext) {
            s.repertoireState.reviewState.setupNextMove();
          } else {
            trackEvent(`reviewing.give_up`);
            s.repertoireState.reviewState.giveUp();
          }
        });
      },
      style: showNext ? "focus" : "primary",
      text: showNext ? "Next" : "I don't know, show me the answer",
    },
    {
      onPress: () => {
        quick((s) => {
          trackEvent(`reviewing.inspect_line`);
          let qm = s.repertoireState.reviewState.currentMove;
          s.repertoireState.backToOverview();
          s.repertoireState.startBrowsing(qm.moves[0].side, "build", qm.line);
        });
      },
      style: "primary",
      text: "View in repertoire builder",
    },
  ];
  return (
    <SidebarTemplate
      header="Practicing your repertoire"
      actions={actions}
      bodyPadding={true}
    >
      <CMText style={s()}>
        {currentMove?.moves.length === 1
          ? "Play the correct response on the board"
          : `You have ${currentMove?.moves.length} responses to this position in your repertoire. Play all your responses on the board`}
      </CMText>
      {currentMove?.moves.length > 1 && (
        <>
          <View
            style={s(
              c.row,
              c.overflowHidden,
              c.fullWidth,
              c.height(12),
              c.round,
              c.alignStretch,
              c.border(`1px solid ${c.grays[20]}`)
            )}
          >
            {intersperse(
              sortBy(currentMove.moves, (m) =>
                isNil(completedReviewPositionMoves[m.sanPlus])
              ).map((x, i) => {
                let hasCompleted = !isNil(
                  completedReviewPositionMoves[x.sanPlus]
                );
                return (
                  <View
                    style={s(
                      hasCompleted ? c.bg(c.grays[80]) : c.bg(c.grays[10]),
                      c.grow
                    )}
                  ></View>
                );
              }),
              (i) => {
                return (
                  <View
                    style={s(c.width(1), c.bg(c.grays[20]), c.fullHeight)}
                  ></View>
                );
              }
            )}
          </View>
          <Spacer height={12} />
        </>
      )}
    </SidebarTemplate>
  );
};
