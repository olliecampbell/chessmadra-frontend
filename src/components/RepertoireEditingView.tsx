// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isEmpty, isNil, filter } from "lodash-es";
import { Side } from "~/utils/repertoire";
import { CMText } from "./CMText";
import { StockfishReport } from "~/utils/models";
import {
  useUserState,
  useBrowsingState,
  useSidebarState,
} from "~/utils/app_state";
import { RepertoireMovesTable } from "./RepertoireMovesTable";
import { shouldUsePeerRates } from "~/utils/table_scoring";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { InstructiveGamesView } from "./InstructiveGamesView";
import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { destructure } from "@solid-primitives/destructure";
import { Puff } from "solid-spinner";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

const desktopHeaderStyles = s(
  c.fg(c.colors.textPrimary),
  c.fontSize(22),
  c.mb(12),
  c.weightBold
);

export const Responses = function Responses() {
  const [currentEpd] = useSidebarState(([s]) => [s.currentEpd]);
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [user] = useUserState((s) => [s.user]);
  const [positionReport] = useBrowsingState(
    // TODO: we should have the active side on sidebar too
    ([s, rs]) => [rs.positionReports[activeSide()]?.[currentEpd()]]
  );
  createEffect(() => {
    // console.log("pos report", positionReport());
  });
  const [currentSide, currentLine, hasPendingLine, isPastCoverageGoal] =
    useSidebarState(([s]) => [
      s.currentSide,
      s.moveLog,
      s.hasPendingLineToAdd,
      s.isPastCoverageGoal,
    ]);
  const [tableResponses] = useSidebarState(([s]) => [s.tableResponses]);

  const usePeerRates = () => shouldUsePeerRates(positionReport());
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const yourMoves = createMemo(() =>
    filter(tableResponses(), (tr) => {
      return !isNil(tr.repertoireMove) && activeSide() === currentSide();
    })
  );
  const otherMoves = createMemo(() =>
    filter(tableResponses(), (tr) => {
      return isNil(tr.repertoireMove) && activeSide() === currentSide();
    })
  );
  const prepareFor = createMemo(() =>
    filter(tableResponses(), (tr) => {
      return activeSide() !== currentSide();
    })
  );
  // TODO: solid
  // createEffect(() => {
  //   const beforeUnloadListener = (event) => {
  //     if (hasPendingLine()) {
  //       event.preventDefault();
  //       let prompt = "You have an unsaved line, are you sure you want to exit?";
  //       event.returnValue = prompt;
  //       return prompt;
  //     }
  //   };
  //   addEventListener("beforeunload", beforeUnloadListener, { capture: true });
  //   return () => {
  //     removeEventListener("beforeunload", beforeUnloadListener, {
  //       capture: true,
  //     });
  //   };
  // }, [hasPendingLine]);
  const body = null;
  const { prepareForHeader, reviewHeader } = destructure(() => {
    let reviewHeader = null;
    let prepareForHeader: any = "Choose a move to prepare for";
    if (isPastCoverageGoal()) {
      prepareForHeader = "Most common responses";
    }
    if (mode() == "browse") {
      reviewHeader = "What do you want to review?";
    }
    return { prepareForHeader, reviewHeader };
  });
  const header = () => {
    if (reviewHeader()) {
      return reviewHeader();
    }
    if (!isEmpty(prepareFor())) {
      return prepareForHeader();
    }
    return getResponsesHeader(currentLine(), yourMoves().length, activeSide());
  };
  const responses = createMemo(() => {
    if (!isEmpty(yourMoves())) {
      return yourMoves();
    } else if (!isEmpty(prepareFor())) {
      return prepareFor();
    } else {
      return tableResponses();
    }
  });
  return (
    <div style={s(c.column, c.constrainWidth)}>
      <Show when={positionReport()}>
        <>
          <Show
            when={
              !isEmpty(yourMoves()) ||
              (isEmpty(yourMoves()) && !isEmpty(otherMoves())) ||
              !isEmpty(prepareFor())
            }
          >
            <div style={s()} id={`your-moves-play-${currentEpd}`}>
              <RepertoireMovesTable
                {...{
                  header: header,
                  usePeerRates,
                  activeSide,
                  side: currentSide,
                  responses: responses,
                }}
              />
            </div>
          </Show>

          <Show
            when={
              !isEmpty(yourMoves()) &&
              !isEmpty(otherMoves()) &&
              mode() == "build"
            }
          >
            <div style={s(c.mt(36))} id={`alternate-moves-${currentEpd}`}>
              <CollapsibleSidebarSection header="Add an alternative move">
                <Spacer height={12} />
                <RepertoireMovesTable
                  {...{
                    header: () => null,
                    usePeerRates,
                    activeSide,
                    side: currentSide,
                    responses: otherMoves,
                  }}
                />
              </CollapsibleSidebarSection>
            </div>
          </Show>
        </>
      </Show>
      {user()?.isAdmin && <InstructiveGamesView />}
      <Switch>
        <Match when={!positionReport()}>
          <div style={s(c.center, c.column, c.py(48))}>
            <Puff color={c.primaries[60]} />
          </div>
        </Match>
        <Match when={isEmpty(tableResponses()) && isEmpty(yourMoves())}>
          <div
            style={s(
              c.column,
              c.alignCenter,
              c.selfCenter,
              c.px(12),
              c.maxWidth(240),
              c.py(48)
            )}
          >
            <CMText>
              <i
                class="fa-light fa-empty-set"
                style={s(c.fg(c.grays[50]), c.fontSize(24))}
              />
            </CMText>
            <Spacer height={18} />
            <CMText style={s(c.fg(c.grays[75]))}>
              No moves available for this position. You can still add a move by
              playing it on the board.
            </CMText>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

const isGoodStockfishEval = (stockfish: StockfishReport, side: Side) => {
  if (!isNil(stockfish.eval) && stockfish.eval >= 0 && side === "white") {
    return true;
  }
  if (stockfish.mate && stockfish.mate > 0 && side === "white") {
    return true;
  }
  if (!isNil(stockfish.eval) && stockfish.eval <= 0 && side === "black") {
    return true;
  }
  if (stockfish.mate && stockfish.mate < 0 && side === "black") {
    return true;
  }
  return false;
};

function getResponsesHeader(
  currentLine: string[],
  myMoves?: number,
  side: Side
): string {
  const hasMove = myMoves;
  // TODO: account for multiple moves, "These moves are"
  if (myMoves) {
    if (myMoves == 1) {
      return "This move is in your repertoire";
    } else {
      return "These moves are in your repertoire";
    }
  }
  if (!hasMove && isEmpty(currentLine)) {
    return "Which first move do you play as white?";
  }
  if (side === "black" && currentLine.length === 1) {
    return `What do you play as black against 1. ${currentLine[0]}?`;
  }
  return `${hasMove ? "Your" : "Choose your"} ${
    isEmpty(currentLine) ? "first" : "next"
  } move`;
}
