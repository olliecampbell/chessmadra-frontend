// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isEmpty, isNil, filter } from "lodash-es";
import { Side } from "~/utils/repertoire";
import { CMText } from "./CMText";
import { StockfishReport } from "~/utils/models";
import {
  useDebugState,
  useUserState,
  useBrowsingState,
  useSidebarState,
} from "~/utils/app_state";
import { RepertoireMovesTable } from "./RepertoireMovesTable";
import { BP, useResponsive } from "~/utils/useResponsive";
import { shouldUsePeerRates } from "~/utils/table_scoring";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { InstructiveGamesView } from "./InstructiveGamesView";
import { createEffect, createMemo, Show } from "solid-js";
import { View } from "./View";
import { destructure } from "@solid-primitives/destructure";
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
    console.log("pos report", positionReport());
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
      return !isNil(tr.repertoireMove) && activeSide === currentSide;
    })
  );
  const otherMoves = createMemo(() =>
    filter(tableResponses(), (tr) => {
      return isNil(tr.repertoireMove) && activeSide === currentSide;
    })
  );
  const prepareFor = createMemo(() =>
    filter(tableResponses(), (tr) => {
      return activeSide !== currentSide;
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
    let prepareForHeader: any = "You need to prepare for these moves";
    if (isPastCoverageGoal()) {
      prepareForHeader = "Most common responses";
    }
    if (mode() == "browse") {
      reviewHeader = "What do you want to review?";
    }
    return { prepareForHeader, reviewHeader };
  });
  return (
    <div style={s(c.column, c.constrainWidth)}>
      <Show when={positionReport()}>
        <>
          {!isEmpty(yourMoves()) && (
            <div style={s()} key={`your-moves-play-${currentEpd}`}>
              <RepertoireMovesTable
                {...{
                  header: () =>
                    reviewHeader() ??
                    getResponsesHeader(currentLine(), !isEmpty(yourMoves())),
                  usePeerRates,
                  activeSide,
                  side: currentSide,
                  responses: yourMoves,
                }}
              />
            </div>
          )}
          {isEmpty(yourMoves()) && !isEmpty(otherMoves()) && (
            <div style={s()} key={`choose-next-move-${currentEpd}`}>
              <RepertoireMovesTable
                {...{
                  header: () =>
                    reviewHeader() ??
                    getResponsesHeader(currentLine(), !isEmpty(yourMoves())),
                  usePeerRates,
                  activeSide,
                  side: currentSide,
                  responses: otherMoves,
                }}
              />
            </div>
          )}
          {!isEmpty(yourMoves()) &&
            !isEmpty(otherMoves()) &&
            mode() == "build" && (
              <div style={s(c.mt(36))} key={`alternate-moves-${currentEpd}`}>
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
            )}
          {!isEmpty(prepareFor()) && (
            <RepertoireMovesTable
              {...{
                header: () => reviewHeader() ?? prepareForHeader(),
                usePeerRates,
                body: body,
                activeSide,
                side: currentSide,
                responses: prepareFor,
                myMoves: false,
              }}
            />
          )}
        </>
      </Show>
      {user()?.isAdmin && <InstructiveGamesView />}
      {(() => {
        if (!positionReport()) {
          return (
            <div style={s(c.center, c.column, c.py(48))}>
              <div>todo: solid</div>
            </div>
          );
        } else if (
          isEmpty(positionReport().suggestedMoves) &&
          isEmpty(yourMoves)
        ) {
          return (
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
                No moves available for this position. You can still add a move
                by playing it on the board.
              </CMText>
            </div>
          );
        } else {
          return <></>;
        }
      })()}
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

function getResponsesHeader(currentLine: string[], hasMove?: boolean): string {
  // TODO: account for multiple moves, "These moves are"
  if (hasMove && !isEmpty(currentLine)) {
    return "This move is in your repertoire";
  }
  if (!hasMove && isEmpty(currentLine)) {
    return "Which first move do you play as white?";
  }
  return `${hasMove ? "Your" : "Choose your"} ${
    isEmpty(currentLine) ? "first" : "next"
  } move`;
}
