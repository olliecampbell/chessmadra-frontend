// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "~/components/TrainerLayout";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { useRepertoireState, quick, useSidebarState } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { pgnToLine } from "~/utils/repertoire";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { View } from "./View";

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
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const actions: SidebarAction[] = [
    {
      onPress: () => {
        quick((s) => {
          if (s.repertoireState.reviewState.showNext) {
            s.repertoireState.reviewState.setupNextMove();
          } else {
            trackEvent(`${mode}.give_up`);
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
          trackEvent(`${mode}.inspect_line`);
          let qm = s.repertoireState.reviewState.currentMove;
          s.repertoireState.backToOverview();
          s.repertoireState.startBrowsing(qm.moves[0].side, "build", {
            pgnToPlay: qm.line,
          });
        });
      },
      style: "primary",
      text: "View in repertoire builder",
    },
  ];
  return (
    <SidebarTemplate
      header={
        currentMove?.moves.length === 1
          ? "Play the correct move on the board"
          : `You have ${currentMove?.moves.length} responses to this position in your repertoire. Play all your responses on the board`
      }
      actions={actions}
      bodyPadding={true}
    >
      {currentMove?.moves.length > 1 && (
        <>
          <div
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
                  <div
                    style={s(
                      hasCompleted ? c.bg(c.grays[80]) : c.bg(c.grays[10]),
                      c.grow
                    )}
                  ></div>
                );
              }),
              (i) => {
                return (
                  <div
                    style={s(c.width(1), c.bg(c.grays[20]), c.fullHeight)}
                  ></div>
                );
              }
            )}
          </div>
          <Spacer height={12} />
        </>
      )}
    </SidebarTemplate>
  );
};
