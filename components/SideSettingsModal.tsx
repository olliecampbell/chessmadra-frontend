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

export const SideSettingsModal = () => {
  let [side, exportPgn, deleteRepertoire, quick] = useRepertoireState(
    (s) => [
      s.repertoireSettingsModalSide,
      s.exportPgn,
      s.deleteRepertoire,
      s.quick,
    ],
  );
  const isMobile = useIsMobile();
  console.log("side", side);
  return (
    <Modal
      onClose={() => {
        quick((s) => {
          s.repertoireSettingsModalSide = null;
        });
      }}
      visible={!isNil(side)}
    >
      <View style={s(c.maxWidth(500))}>
        <View
          style={s(
            c.column,
            c.alignStretch,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fas fa-arrow-down-to-line"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Export
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Export your {side} repertoire to a PGN file. You can import this
                file into a Lichess study, ChessBase, Chessable course, etc.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  exportPgn(side);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Export</CMText>
              </Button>
            </View>
          </View>
        </View>
        <View
          style={s(
            c.column,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-regular fa-trash"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Delete
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Delete your entire {side} repertoire. This cannot be undone.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(
                  c.buttons.primary,
                  c.bg(c.failureShades[50]),
                  c.height(36),
                  c.selfEnd
                )}
                onPress={() => {
                  deleteRepertoire(side);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
