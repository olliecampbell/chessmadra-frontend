import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import shallow from "zustand/shallow";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  take,
  sortBy,
  reverse,
  some,
  forEach,
  find,
  filter,
  times,
  findIndex,
  map,
} from "lodash";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { EditingTab, RepertoireState } from "app/utils/repertoire_state";
import { RepertoireMove, Side, Repertoire } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { PositionReport, StockfishReport, SuggestedMove } from "app/models";
import { AddedLineModal } from "./AddedLineModal";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  getTotalGames,
  formatPlayPercentage,
  getWinRate,
  getPlayRate,
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { Modal } from "./Modal";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { useRepertoireState } from "app/utils/app_state";
import React, { useState } from "react";
import { plural, pluralize } from "app/utils/pluralize";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { RepertoireMovesTable, TableResponse } from "./RepertoireMovesTable";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";

type BackControlsProps = {
  includeAnalyze?: boolean;
};

export const BackControls: React.FC<BackControlsProps> = ({
  includeAnalyze,
}) => {
  let [
    searchOnChessable,
    analyzeLineOnLichess,
    quick,
    currentLine,
    backToStartPosition,
    backOne,
  ] = useRepertoireState((s) => [
    s.searchOnChessable,
    s.analyzeLineOnLichess,
    s.quick,
    s.currentLine,
    s.backToStartPosition,
    s.backOne,
  ]);
  const isMobile = useIsMobile();
  let gap = isMobile ? 6 : 12;
  let foreground = c.grays[90];
  let textColor = c.fg(foreground);
  return (
    <View style={s(c.row, c.height(isMobile ? 32 : 42))}>
      <Button
        style={s(c.buttons.extraDark, c.width(48))}
        onPress={() => {
          backToStartPosition();
        }}
      >
        <i
          className="fas fa-angles-left"
          style={s(c.buttons.extraDark.textStyles, c.fontSize(18), textColor)}
        />
      </Button>
      <Spacer width={gap} />
      <Button
        style={s(c.buttons.extraDark, c.grow)}
        onPress={() => {
          backOne();
        }}
      >
        <i
          className="fas fa-angle-left"
          style={s(c.buttons.extraDark.textStyles, c.fontSize(18), textColor)}
        />
      </Button>
      {includeAnalyze && (
        <>
          <Spacer width={gap} />
          <Button
            style={s(c.buttons.extraDark)}
            onPress={() => {
              analyzeLineOnLichess(currentLine);
            }}
          >
            <View style={s(c.size(isMobile ? 20 : 22))}>
              <LichessLogoIcon color={foreground} />
            </View>
            <Spacer width={8} />
            <CMText
              style={s(
                c.buttons.extraDark.textStyles,
                textColor,
                c.weightRegular,
                c.fontSize(14)
              )}
            >
              Analyze on Lichess
            </CMText>
          </Button>
        </>
      )}
    </View>
  );
};
