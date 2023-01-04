import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, isNil, filter } from "lodash-es";
import { Side } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
import { CMText } from "./CMText";
import { StockfishReport } from "app/models";
import {
  useDebugState,
  useBrowsingState,
  useSidebarState,
} from "app/utils/app_state";
import React, { useEffect, useState } from "react";
import { RepertoireMovesTable } from "./RepertoireMovesTable";
import { BP, useResponsive } from "app/utils/useResponsive";
import { shouldUsePeerRates } from "app/utils/table_scoring";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

let desktopHeaderStyles = s(
  c.fg(c.colors.textPrimary),
  c.fontSize(22),
  c.mb(12),
  c.weightBold
);

export const Responses = React.memo(function Responses() {
  const [currentEpd] = useSidebarState(([s]) => [s.currentEpd], {});
  const positionReport = useBrowsingState(
    ([s, rs]) => rs.positionReports[s.activeSide][currentEpd],
    { referenceEquality: true }
  );
  let [activeSide] = useBrowsingState(([s]) => [s.activeSide], {});
  let [
    currentSide,
    currentLine,
    hasPendingLine,
    tableResponses,
    isPastCoverageGoal,
  ] = useSidebarState(
    ([s]) => [
      s.currentSide,
      s.moveLog,
      s.hasPendingLineToAdd,
      s.tableResponses,
      s.isPastCoverageGoal,
    ],
    {}
  );
  let usePeerRates = shouldUsePeerRates(positionReport);
  let yourMoves = filter(tableResponses, (tr) => {
    return !isNil(tr.repertoireMove) && activeSide === currentSide;
  });
  let otherMoves = filter(tableResponses, (tr) => {
    return isNil(tr.repertoireMove) && activeSide === currentSide;
  });
  console.log({ otherMoves });
  let prepareFor = filter(tableResponses, (tr) => {
    return activeSide !== currentSide;
  });
  let prepareForHeader: any = "You need to prepare for these moves";
  useEffect(() => {
    const beforeUnloadListener = (event) => {
      if (hasPendingLine) {
        event.preventDefault();
        let prompt = "You have an unsaved line, are you sure you want to exit?";
        event.returnValue = prompt;
        return prompt;
      }
    };
    addEventListener("beforeunload", beforeUnloadListener, { capture: true });
    return () => {
      removeEventListener("beforeunload", beforeUnloadListener, {
        capture: true,
      });
    };
  }, [hasPendingLine]);
  let body = null;
  if (isPastCoverageGoal) {
    prepareForHeader = "Most common responses";
  }
  return (
    <View style={s(c.column, c.constrainWidth)}>
      <>
        {positionReport && (
          <>
            {!isEmpty(yourMoves) && (
              <View style={s()} key={`your-moves-play-${currentEpd}`}>
                <RepertoireMovesTable
                  {...{
                    header: getResponsesHeader(
                      currentLine,
                      !isEmpty(yourMoves)
                    ),
                    usePeerRates,
                    activeSide,
                    side: currentSide,
                    responses: yourMoves,
                  }}
                />
              </View>
            )}
            {isEmpty(yourMoves) && !isEmpty(otherMoves) && (
              <View style={s()} key={`choose-next-move-${currentEpd}`}>
                <RepertoireMovesTable
                  {...{
                    header: getResponsesHeader(
                      currentLine,
                      !isEmpty(yourMoves)
                    ),
                    usePeerRates,
                    activeSide,
                    side: currentSide,
                    responses: otherMoves,
                  }}
                />
              </View>
            )}
            {!isEmpty(yourMoves) && !isEmpty(otherMoves) && (
              <View style={s(c.mt(36))} key={`alternate-moves-${currentEpd}`}>
                <CollapsibleSidebarSection header="Add an alternative move">
                  <Spacer height={12} />
                  <RepertoireMovesTable
                    {...{
                      header: null,
                      usePeerRates,
                      activeSide,
                      side: currentSide,
                      responses: otherMoves,
                    }}
                  />
                </CollapsibleSidebarSection>
              </View>
            )}
            {!isEmpty(prepareFor) && (
              <RepertoireMovesTable
                {...{
                  header: prepareForHeader,
                  body: body,
                  activeSide,
                  side: currentSide,
                  responses: prepareFor,
                  myMoves: false,
                }}
              />
            )}
          </>
        )}
      </>
      {(() => {
        if (!positionReport) {
          return (
            <View style={s(c.center, c.column, c.py(48))}>
              <BeatLoader color={c.grays[100]} size={14} />
            </View>
          );
        } else if (
          isEmpty(positionReport.suggestedMoves) &&
          isEmpty(yourMoves)
        ) {
          return (
            <>
              <View
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
                    className="fa-light fa-empty-set"
                    style={s(c.fg(c.grays[50]), c.fontSize(24))}
                  />
                </CMText>
                <Spacer height={18} />
                <CMText style={s(c.fg(c.grays[75]))}>
                  No moves available for this position. You can still add a move
                  by playing it on the board.
                </CMText>
              </View>
            </>
          );
        } else {
          return <></>;
        }
      })()}
    </View>
  );
});

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
