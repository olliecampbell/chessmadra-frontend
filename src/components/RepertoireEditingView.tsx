import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  isEmpty,
  isNil,
  filter,
} from "lodash-es";
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
import {
  RepertoireMovesTable,
} from "./RepertoireMovesTable";
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

const VERTICAL_BREAKPOINT = BP.md;

export const Responses = React.memo(function Responses() {
  const [currentEpd] = useSidebarState((s) => [s.currentEpd]);
  console.log("currentEpd", currentEpd);
  const [positionReport] = useBrowsingState(
    ([s, rs]) => [rs.positionReports[currentEpd]],
    { referenceEquality: true }
  );
  console.log("positionReport", positionReport);
  let [
    activeSide,
    currentSide,
    currentLine,
    hasPendingLine,
    tableResponses,
    isPastCoverageGoal,
  ] = useBrowsingState(([s, rs]) => [
    s.activeSide,
    s.sidebarState.currentSide,
    s.sidebarState.moveLog,
    s.sidebarState.hasPendingLineToAdd,
    s.sidebarState.tableResponses,
    s.sidebarState.isPastCoverageGoal,
  ]);
  let usePeerRates = shouldUsePeerRates(positionReport);
  let yourMoves = filter(tableResponses, (tr) => {
    return !isNil(tr.repertoireMove) && activeSide === currentSide;
  });
  let otherMoves = filter(tableResponses, (tr) => {
    return isNil(tr.repertoireMove) && activeSide === currentSide;
  });
  // let youCanPlay = filter(tableResponses, (tr) => {
  //   return activeSide === side;
  // });
  console.log("tableResponses", tableResponses);
  let prepareFor = filter(tableResponses, (tr) => {
    return activeSide !== currentSide;
  });
  const isMobile = false;
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  let prepareForHeader = "You need to prepare for these moves";
  const debugUi = useDebugState((s) => s.debugUi);
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
  const responsive = useResponsive();
  let body = null;
  if (isPastCoverageGoal) {
    if (hasPendingLine) {
      prepareForHeader = "This line looks good!";
      body =
        "This line is ready to be added to your repertoire. You can continue adding moves if you want.";
    } else {
      prepareForHeader = "You can prepare for these moves";
      body =
        "This line is past your coverage goal, but you can add more moves if you want.";
    }
  }
  return (
    <View style={s(c.column, c.constrainWidth)}>
      <>
        {!isEmpty(yourMoves) && (
          <View style={s()} key={`your-moves-play-${currentEpd}`}>
            <RepertoireMovesTable
              {...{
                header: getResponsesHeader(currentLine, !isEmpty(yourMoves)),
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
                header: getResponsesHeader(currentLine, !isEmpty(yourMoves)),
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
