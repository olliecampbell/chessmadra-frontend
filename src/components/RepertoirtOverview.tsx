// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, isNil } from "lodash-es";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  getAppState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { Side } from "~/utils/repertoire";
import { SidebarTemplate } from "./SidebarTemplate";
import { CoverageBar } from "./CoverageBar";
import { ReviewText } from "./ReviewText";
import { START_EPD } from "~/utils/chess";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { BrowsingMode } from "~/utils/browsing_state";
import { ConfirmDeleteRepertoire } from "./ConfirmDeleteRepertoire";
import { createSignal, Show, createEffect, Accessor } from "solid-js";
import { Pressable } from "./Pressable";
import { clsx } from "~/utils/classes";
import { InstructiveGame } from "~/utils/models";
import { SidebarInstructiveGames } from "./SidebarInstructiveGames";
import {
  ChooseImportSourceOnboarding,
  TrimRepertoireOnboarding,
} from "./SidebarOnboarding";
import { isDevelopment } from "~/utils/env";
import { PreReview } from "./PreReview";
import { PreBuild } from "./PreBuild";
import { useIsMobileV2 } from "~/utils/isMobile";
import { Label } from "./Label";
import {
  SeeMoreActions,
  SidebarAction,
  SidebarActions,
} from "./SidebarActions";

export const RepertoireOverview = (props: {}) => {
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const textStyles = s(c.weightSemiBold);
  const textClasses = "text-primary";
  const appState = getAppState();
  const { repertoireState } = appState;
  const { browsingState } = repertoireState;
  const progressState = () => browsingState.repertoireProgressState[side()!];
  const biggestMiss = () =>
    // @ts-ignore
    repertoireState.repertoireGrades[side()]?.biggestMiss;
  const numMoves = () => repertoireState.getLineCount(side());
  const numMovesDueFromHere = () =>
    // @ts-ignore
    repertoireState.numMovesDueFromEpd[side()][START_EPD];
  const earliestDueDate = () =>
    // @ts-ignore
    repertoireState.earliestReviewDueFromEpd[side()][START_EPD];
  const modelGames: Accessor<InstructiveGame[]> = () => {
    return repertoireState.positionReports[side() as Side][START_EPD]
      ?.instructiveGames;
  };

  console.log("[HOME] rendering overview");
  createEffect(() => {
    console.log("[HOME] empty?", empty());
  });
  const empty = () => numMoves() === 0;
  const responsive = useResponsiveV2();
  const startBrowsing = (mode: BrowsingMode, skipAnimation?: boolean) => {
    quick((s) => {
      if (skipAnimation) {
        // @ts-ignore
        s.repertoireState.startBrowsing(side(), mode);
      } else {
        // @ts-ignore
        s.repertoireState.startBrowsing(side(), mode);
      }
    });
  };
  const isMobile = useIsMobileV2();
  const reviewTimer = () => {
    const reviewTimer = (
      <ReviewText
        date={earliestDueDate()}
        numDue={numMovesDueFromHere()}
        overview={true}
      />
    );
    return reviewTimer;
  };
  const options = () =>
    [
      {
        right: !empty() && (
          <div style={s(c.height(4), c.row)}>
            <CoverageAndBar home={false} side={side()!} />
          </div>
        ),

        onPress: () => {
          quick((s) => {
            if (empty() || isNil(biggestMiss())) {
              s.repertoireState.browsingState.moveSidebarState("right");
              startBrowsing("build", empty());
              if (empty()) {
                trackEvent("side_overview.start_building");
              } else {
                trackEvent("side_overview.keep_building");
              }
              return;
            }
            trackEvent("side_overview.keep_building");
            s.repertoireState.browsingState.pushView(PreBuild, {
              props: { side: side() },
            });
          });
        },
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            {empty()
              ? "Start building your repertoire"
              : isNil(biggestMiss())
              ? "Browse / add new moves"
              : `Keep building ${!isMobile() ? "your repertoire" : ""}`}
          </CMText>
        ),
        style: "secondary",
      },
      {
        hidden: empty(),
        onPress: () => {
          quick((s) => {
            trackEvent("side_overview.start_review");
            s.repertoireState.browsingState.pushView(PreReview, {
              props: { side: side() },
            });
          });
        },
        right: reviewTimer,
        // disabled: numMovesDueFromHere() === 0,
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            Practice your repertoire
          </CMText>
        ),
        style: "secondary",
      },
      {
        hidden: modelGames()?.length == 0,
        onPress: () => {
          trackEvent("side_overview.view_instructive_games");
          quick((s) => {
            s.repertoireState.browsingState.replaceView(
              SidebarInstructiveGames,
              {
                props: { games: modelGames() },
              }
            );
          });
        },
        text: (
          <div class={clsx("row items-center")}>
            <CMText style={s(textStyles)} class={clsx(textClasses)}>
              View model games in lines you play
            </CMText>
            <Label>Beta</Label>
          </div>
        ),
        right: null,
        style: "secondary",
      },
      {
        hidden: !expanded() || !isDevelopment,
        onPress: () => {
          trackEvent("side_overview.trim");
          quick((s) => {
            s.repertoireState.browsingState.pushView(TrimRepertoireOnboarding);
          });
        },
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            Trim repertoire
          </CMText>
        ),
        icon: "fa-sharp fa-file-import",
        right: null,
        style: "secondary",
      },
      {
        hidden: !(expanded() || empty()),
        onPress: () => {
          trackEvent("side_overview.import");
          quick((s) => {
            s.repertoireState.browsingState.pushView(
              ChooseImportSourceOnboarding
            );
          });
        },
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            Import
          </CMText>
        ),
        icon: "fa-sharp fa-file-import",
        right: null,
        style: "secondary",
      },
      {
        onPress: () => {
          quick((s) => {
            trackEvent("side_overview.export");
            // @ts-ignore
            s.repertoireState.exportPgn(side());
          });
        },
        hidden: !expanded(),
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            Export repertoire
          </CMText>
        ),
        icon: "fa-sharp fa-arrow-down-to-line",
        right: null,
        style: "secondary",
      },
      {
        hidden: !expanded(),
        onPress: () => {
          quick((s) => {
            trackEvent("side_overview.delete_repertoire");
            s.repertoireState.browsingState.replaceView(
              ConfirmDeleteRepertoire
            );
          });
        },
        text: (
          <CMText style={s(textStyles)} class={clsx(textClasses)}>
            Delete repertoire
          </CMText>
        ),
        icon: "fa-sharp fa-trash",
        right: null,
        style: "secondary",
      },
    ].filter((o) => {
      return !o.hidden;
    }) as SidebarAction[];
  const [expanded, setExpanded] = createSignal(false);
  // let reviewStatus = `You have ${pluralize(
  //   numMovesDueFromHere,
  //   "move"
  // )} due for review`;
  createEffect(() => {
    console.log("options", options());
  });
  const repertoireStatus = () => {
    if (empty()) {
      return `Your repertoire is empty`;
    }
    return `Your repertoire is ${Math.round(
      progressState().percentComplete
    )}% complete`;
  };
  return (
    <SidebarTemplate
      header={`${capitalize(side())} Repertoire`}
      actions={[]}
      bodyPadding={false}
    >
      <Spacer height={24} />
      <SidebarActions actions={options()} />
      <Show when={!empty()}>
        <SeeMoreActions
          text={!expanded() ? "More options..." : "Hide"}
          onClick={() => setExpanded(!expanded())}
        />
      </Show>
    </SidebarTemplate>
  );
};

export const CoverageAndBar = (props: {
  side: Side;
  home: boolean;
  hideBar?: boolean;
}) => {
  const inverse = () => props.home && props.side === "white";
  const textStyles = () =>
    s(
      c.fg(inverse() ? c.colors.text.inverse : c.colors.text.secondary),
      !props.home && c.fg(c.colors.text.secondary),
      c.weightSemiBold,
      c.fontSize(12)
    );
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[props.side],
  ]);

  return (
    <div style={s(c.row, c.alignCenter)}>
      <CMText style={s(textStyles())}>
        {progressState().completed ? (
          <>Completed</>
        ) : (
          <>{Math.round(progressState().percentComplete)}% Complete</>
        )}
      </CMText>
      <Show when={!props.hideBar}>
        <>
          <Spacer width={8} />
          <div
            style={s(
              c.height(props.home ? 4 : 4),
              c.width(props.home ? 100 : 80),
              c.row
            )}
          >
            <CoverageBar isInSidebar={!props.home} side={props.side} />
          </div>
        </>
      </Show>
    </div>
  );
};
