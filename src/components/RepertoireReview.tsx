import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isNil, filter, range, forEach, find, first } from "lodash-es";
import { useIsMobileV2 } from "~/utils/isMobile";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  getAppState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Accessor, createEffect, createMemo, For, JSX, Show } from "solid-js";
import { Intersperse } from "./Intersperse";
import { Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { Quiz, QuizGroup } from "~/utils/queues";
import { pieceSymbolToPieceName } from "~/utils/plans";
import {
  BoardTheme,
  BOARD_THEMES_BY_ID,
  CombinedTheme,
  combinedThemes,
  COMBINED_THEMES_BY_ID,
} from "~/utils/theming";

export const RepertoireReview = (props: {}) => {
  const isMobile = useIsMobileV2();
  const [completedReviewPositionMoves, currentMove, showNext] =
    useRepertoireState((s) => [
      s.reviewState.completedReviewPositionMoves,
      s.reviewState.currentQuizGroup,
      s.reviewState.showNext,
    ]);
  const reviewOptions = () =>
    getAppState().repertoireState.reviewState.activeOptions;
  const reviewingMistakes = () => reviewOptions()?.lichessMistakes;
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const side = () =>
    getAppState().repertoireState.reviewState.reviewSide as Side;
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [allReviewPositionMoves] = useRepertoireState((s) => [
    s.reviewState.allReviewPositionMoves,
  ]);
  const [reviewStats] = useRepertoireState((s) => [s.reviewState.reviewStats]);
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
  const progressIcons = () => {
    return [
      {
        icon: "fa fa-clock",
        class: "text-yellow-60",
        text: `${reviewStats().due + 1} Due`,
      },
      {
        icon: "fa fa-circle-check",
        class: "text-green-60",
        text: reviewStats().correct,
      },
      {
        icon: "fa fa-circle-xmark",
        class: "text-red-60",
        text: reviewStats().incorrect,
      },
    ];
  };
  const actions: Accessor<(SidebarAction & { hidden?: boolean })[]> = () => [
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
          s.repertoireState.browsingState.moveSidebarState("right");
          s.repertoireState.reviewState.setupNextMove();
        });
      },
      hidden: !currentMove()?.lichessMistake,
      style: "primary",
      text: "Skip this one",
    },
    {
      onPress: () => {
        quick((s) => {
          trackEvent(`${mode()}.inspect_line`);
          const m = currentMove() as QuizGroup;
          s.repertoireState.backToOverview();
          s.repertoireState.startBrowsing(m.side, "build", {
            pgnToPlay: m.line,
            animated: false
          });
        });
      },
      style: "primary",
      hidden: onboarding().isOnboarding || !currentMove(),
      text: "Exit practice and view in repertoire builder",
    },
  ];
  const userState = getAppState().userState;
  const user = () => userState.user;
  const combinedTheme: Accessor<CombinedTheme> = createMemo(
    () =>
      find(combinedThemes, (theme) => theme.boardTheme === user()?.theme) ||
      COMBINED_THEMES_BY_ID["default"],
  );
  const theme: Accessor<BoardTheme> = () =>
    BOARD_THEMES_BY_ID[combinedTheme().boardTheme];
  const num = () => Quiz.getMoves(currentMove()!)?.length ?? 0;
  const numCompleted = () =>
    filter(
      Quiz.getMoves(currentMove()!),
      (m) => !isNil(completedReviewPositionMoves()?.[m.sanPlus]),
    ).length;
  const isPlanPractice = () => !!Quiz.getPlans(currentMove()!);
  const reviewState = () => getAppState().repertoireState.reviewState;
  const body: Accessor<JSX.Element> = () => {
    const lichessMistake = currentMove()?.lichessMistake;
    if (reviewingMistakes() && lichessMistake) {
      return (
        <>
          In this position in{" "}
          <a
            href={`https://lichess.org/${lichessMistake.gameId}`}
            target={"_blank"}
            rel="noreferrer"
            class="font-semibold "
          >
            your game against {lichessMistake.opponentName}
          </a>
          , you played{" "}
          <span
            class={clsx(
              "bg-red-80 text-red-20 p-px px-1 rounded font-semibold",
            )}
          >
            {lichessMistake.playedSan}
          </span>
          . Play the correct move on the board.
        </>
      );
    }
    if (showNext() && !isPlanPractice()) {
      if (num() === 1) {
        return "This move is in your repertoire";
      } else {
        return null;
      }
    }
    const plans = Quiz.getRemainingPlans(
      currentMove()!,
      reviewState().planIndex,
    );
    if (isPlanPractice()) {
      const plan = first(plans);
      if (!plan) {
        return (
          <>
            These are your plans from this position, take a second to review
            them
          </>
        );
      }
      if (plan.type === "castling") {
        return (
          <>
            Which side does{" "}
            <span
              class="rounded-sm p-1 py-0.5 font-bold"
              style={{ ["background-color"]: theme().highlightNextMove }}
            >
              {side()}
            </span>{" "}
            usually castle to? Tap on the board to indicate the correct square.
          </>
        );
      }
      return (
        <>
          Where does the{" "}
          <span
            class="rounded-sm p-1 py-0.5 font-bold"
            style={{ ["background-color"]: theme().highlightNextMove }}
          >
            {pieceSymbolToPieceName(plan.piece)} on {plan.fromSquare}
          </span>{" "}
          usually belong? Tap on the board to indicate the correct square.
        </>
      );
    }
    const moves = Quiz.getMoves(currentMove()!);
    if (moves?.length === 1) {
      if (moves[0].epd === START_EPD) {
        return "Play your first move on the board";
      } else {
        return "Play the correct move on the board";
      }
    } else {
      return `You have ${moves?.length} responses to this position in your repertoire. Play all your responses on the board`;
    }
  };
  return (
    <SidebarTemplate
      header={null}
      actions={filter(actions(), (a) => !a.hidden)}
      bodyPadding={true}
    >
      <div class={"row w-full items-end justify-between"}>
        <SidebarHeader>
          {reviewingMistakes()
            ? "Reviewing mistakes"
            : isMobile()
            ? "Practice"
            : `Practicing ${isPlanPractice() ? "plans" : "moves"}`}
        </SidebarHeader>
        <Show when={!reviewingMistakes()}>
          <div class="row items-center space-x-4 lg:space-x-8">
            <For each={progressIcons()}>
              {(i) => {
                return (
                  <div class="row items-center">
                    <p
                      class={clsx(
                        i.class,
                        "text-sm font-semibold lg:text-base",
                      )}
                    >
                      {i.text}
                    </p>
                    <i
                      class={clsx(
                        i.class,
                        i.icon,
                        " ml-2 text-sm lg:text-base",
                      )}
                    />
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
      <div class={"h-6 lg:h-10"} />
      <p class="text-body leading-5">{body()}</p>
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
              c.border(`1px solid ${c.gray[20]}`),
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
                      "transition-colors",
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
