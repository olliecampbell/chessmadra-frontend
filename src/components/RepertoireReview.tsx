// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isNil, filter, range, forEach } from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { useRepertoireState, quick, useSidebarState } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Accessor, createEffect, createMemo, For, Show } from "solid-js";
import { Intersperse } from "./Intersperse";
import { Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";
import { SidebarHeader } from "./RepertoireEditingHeader";

export const RepertoireReview = (props: {}) => {
  const isMobile = useIsMobile();
  const [completedReviewPositionMoves, currentMove, showNext] =
    useRepertoireState((s) => [
      s.reviewState.completedReviewPositionMoves,
      s.reviewState.currentMove,
      s.reviewState.showNext,
    ]);
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [allReviewPositionMoves] = useRepertoireState((s) => [
    s.reviewState.allReviewPositionMoves,
  ]);
  const [queue] = useRepertoireState((s) => [s.reviewState.activeQueue]);
  const moves = createMemo(() => {
    const moves: {
      epd: string;
      sanPlus: string;
      failed: boolean;
      side: Side;
    }[] = [];
    forEach(allReviewPositionMoves(), (sanLookup, epd) => {
      forEach(sanLookup, ({ failed, side, reviewed }, sanPlus) => {
        if (reviewed) {
          moves.push({ epd, sanPlus, failed, side });
        }
      });
    });
    return moves;
  });
  const numFailed = () => {
    return moves().filter((m) => m.failed).length;
  };
  const numCorrect = () => {
    return moves().filter((m) => !m.failed).length;
  };
  const progressIcons = () => {
    return [
      {
        icon: "fa fa-clock",
        class: "text-orange-70",
        text: `${queue().length} Due`,
      },
      {
        icon: "fa fa-circle-check",
        class: "text-[#79c977]",
        text: numCorrect(),
      },
      {
        icon: "fa fa-circle-xmark",
        class: "text-[#c92b2b]",
        text: numFailed(),
      },
    ];
  };
  const actions: Accessor<SidebarAction[]> = () => [
    {
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.moveSidebarState("right");
          if (s.repertoireState.reviewState.showNext) {
            s.repertoireState.reviewState.setupNextMove();
          } else {
            trackEvent(`${mode()}.give_up`);
            s.repertoireState.reviewState.giveUp();
          }
        });
      },
      style: showNext() ? "focus" : "primary",
      text: showNext()
        ? "Got it, continue practicing"
        : "I don't know, show me the answer",
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
      hidden: onboarding().isOnboarding,
      text: "Exit practice and view in repertoire builder",
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
  const body = () => {
    if (showNext()) {
      if (num() === 1) {
        return "This move is in your repertoire";
      } else {
        return null;
      }
    }
    if (currentMove()?.moves.length === 1) {
      if (currentMove()?.moves[0].epd === START_EPD) {
        return "Play your first move on the board";
      } else {
        return "Play the correct move on the board";
      }
    } else {
      return `You have ${
        currentMove()?.moves.length
      } responses to this position in your repertoire. Play all your responses on the board`;
    }
  };
  return (
    <SidebarTemplate
      header={null}
      actions={filter(actions(), (a) => !a.hidden)}
      bodyPadding={true}
    >
      <div class={"row w-full items-center justify-between"}>
        <SidebarHeader>
          {isMobile ? "Practice" : "Practicing moves"}
        </SidebarHeader>
        <div class="row items-center space-x-4 lg:space-x-8">
          <For each={progressIcons()}>
            {(i) => {
              return (
                <div class="row items-center">
                  <p
                    class={clsx(
                      i.class,
                      "text-sm font-semibold lg:text-[20px]"
                    )}
                  >
                    {i.text}
                  </p>
                  <i
                    class={clsx(
                      i.class,
                      i.icon,
                      " ml-2 text-sm lg:text-[20px]"
                    )}
                  />
                </div>
              );
            }}
          </For>
        </div>
      </div>
      <div class={"h-6 lg:h-10"} />
      <p class="text-body">{body()}</p>
      <Show when={num() > 1}>
        <>
          <div
            class="mt-2"
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
                  />
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
                  />
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
