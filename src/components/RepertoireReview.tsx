// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isNil, sortBy, filter, range } from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { useRepertoireState, quick, useSidebarState } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Accessor, createEffect, Show } from "solid-js";
import { Intersperse } from "./Intersperse";
import { RepertoireMove } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";

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
  createEffect(() => {
    console.log("current move", currentMove());
  });
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const actions: Accessor<SidebarAction[]> = () => [
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
      style: showNext() ? "focus" : "primary",
      text: showNext() ? "Next" : "I don't know, show me the answer",
    },
    {
      onPress: () => {
        quick((s) => {
          trackEvent(`${mode()}.inspect_line`);
          const qm = s.repertoireState.reviewState.currentMove;
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
  createEffect(() => {
    console.log("current move", currentMove());
  });
  const num = () => currentMove()?.moves.length ?? 0;
  const numCompleted = () =>
    filter(
      currentMove()?.moves,
      (m) => !isNil(completedReviewPositionMoves()?.[m.sanPlus])
    ).length;
  return (
    <SidebarTemplate
      header={
        currentMove()?.moves.length === 1
          ? currentMove()?.moves[0].epd === START_EPD
            ? "Play your first move as white"
            : "Play the correct move on the board"
          : `You have ${
              currentMove()?.moves.length
            } responses to this position in your repertoire. Play all your responses on the board`
      }
      actions={actions()}
      bodyPadding={true}
    >
      <Show when={num() > 1}>
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
            {(() => {
              console.log("this gets re-rendered");
              return null;
            })()}
            <Intersperse
              each={() => range(num())}
              separator={() => {
                return (
                  <div
                    class={clsx("bg-gray-20 w-0.5")}
                    style={s(c.fullHeight)}
                  ></div>
                );
              }}
            >
              {(x: Accessor<number>) => {
                const hasCompleted = () => x() < numCompleted();
                return (
                  <div
                    class={clsx(
                      hasCompleted() ? "bg-gray-80" : "bg-gray-40",
                      "transition-colors"
                    )}
                    style={s(c.grow)}
                  ></div>
                );
              }}
            </Intersperse>
          </div>
          <Spacer height={12} />
        </>
      </Show>
    </SidebarTemplate>
  );
};
