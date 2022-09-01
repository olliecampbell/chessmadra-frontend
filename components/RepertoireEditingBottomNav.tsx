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
import React from "react";
import { plural, pluralize } from "app/utils/pluralize";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { RepertoireMovesTable, TableResponse } from "./RepertoireMovesTable";
import { Animated } from "react-native";

export const RepertoireEditingBottomNav = ({}: {}) => {
  const isMobile = useIsMobile();
  const [moveLogPgn, hasPendingLineToAdd] = useRepertoireState((s) => [
    s.chessboardState.moveLogPgn,
    s.hasPendingLineToAdd,
  ]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const visible = !isEmpty(moveLogPgn);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={s(
        c.fullWidth,
        c.bg(c.grays[10]),
        c.opacity(fadeAnim),
        c.borderTop(`2px solid ${c.grays[8]}`)
      )}
    >
      <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
        <View
          style={s(
            c.row,
            c.fullWidth,
            c.justifyStart,
            c.alignCenter,
            c.py(24),
            c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
          )}
        >
          <View style={s(c.column, c.flexShrink(1))}>
            <CMText
              style={s(
                c.fontSize(16),
                c.fg(c.colors.textPrimary),
                c.weightSemiBold
              )}
            >
              Current line
            </CMText>
            <Spacer height={12} />
            <CMText
              style={s(
                c.fontSize(14),
                c.fg(c.colors.textSecondary),
                c.height(16)
              )}
            >
              {moveLogPgn}
            </CMText>
          </View>
          <Spacer width={24} grow />
          {hasPendingLineToAdd && <AddPendingLineButton />}
        </View>
      </View>
    </Animated.View>
  );
};

const AddPendingLineButton = () => {
  const [
    isAddingPendingLine,
    addPendingLine,
    pendingLineHasConflictingMoves,
    quick,
  ] = useRepertoireState((s) => [
    s.isAddingPendingLine,
    s.addPendingLine,
    s.pendingLineHasConflictingMoves,
    s.quick,
  ]);
  const isMobile = useIsMobile();
  return (
    <Button
      style={s(
        c.buttons.primary,
        c.height(isMobile ? 36 : 54),
        c.selfStretch,
        c.bg(c.purples[45])
      )}
      isLoading={isAddingPendingLine}
      loaderProps={{ color: c.grays[75] }}
      onPress={() => {
        if (pendingLineHasConflictingMoves) {
          quick((s) => {
            s.editingState.addConflictingMoveModalOpen = true;
          });
        } else {
          addPendingLine();
        }
      }}
    >
      <CMText style={s(c.buttons.primary.textStyles, c.row, c.alignCenter)}>
        <i
          className="fas fa-check"
          style={s(c.fg(c.grays[90]), c.fontSize(20))}
        />
        <Spacer width={8} />
        <CMText
          style={s(c.weightBold, c.fg(c.colors.textPrimary), c.fontSize(14))}
        >
          Save{!isMobile && " to repertoire"}
        </CMText>
      </CMText>
    </Button>
  );
};
