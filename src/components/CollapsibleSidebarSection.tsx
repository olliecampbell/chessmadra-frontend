import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  sortBy,
  reverse,
  forEach,
  filter,
  times,
  values,
  sumBy,
  every,
  cloneDeep,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { EditingTab } from "app/utils/repertoire_state";
import { Side } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
import { CMText } from "./CMText";
import { PositionReport, StockfishReport } from "app/models";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  getTotalGames,
  getWinRate,
  getPlayRate,
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import {
  useDebugState,
  useRepertoireState,
  useBrowsingState,
  useUserState,
  quick,
} from "app/utils/app_state";
import React, { useEffect, useState } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  RepertoireMovesTable,
  ScoreTable,
  TableResponse,
} from "./RepertoireMovesTable";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";
import { BackControls } from "./BackControls";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { useParams } from "react-router-dom";
import { failOnAny } from "app/utils/test_settings";
import { START_EPD } from "app/utils/chess";
import { formatLargeNumber } from "app/utils/number_formatting";
import { BP, useResponsive } from "app/utils/useResponsive";
import { getMoveRating } from "app/utils/move_inaccuracy";
import { plural, pluralize } from "app/utils/pluralize";
import { shouldUsePeerRates } from "app/utils/table_scoring";
import { Button } from "./Button";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { getSidebarPadding } from "./RepertoireBrowsingView";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

export const CollapsibleSidebarSection = ({
  header,
  children,
}: {
  children: JSX.Element | JSX.Element[];
  header: string;
}) => {
  const responsive = useResponsive();
  const [collapsed, setCollapsed] = useState(true);
  return (
    <View style={s()}>
      <Pressable
        style={s(
          c.row,
          c.justifyBetween,
          c.py(8),
          c.alignCenter,
          c.px(getSidebarPadding(responsive)),
          c.clickable
        )}
        onPress={() => {
          setCollapsed(!collapsed);
        }}
      >
        <CMText
          style={s(
            c.fontSize(responsive.switch(14, [BP.lg, 14])),
            c.fg(c.colors.textPrimary)
          )}
        >
          {header}
        </CMText>
        <View style={s()}>
          <i
            className={
              !collapsed ? "fa fa-chevron-down" : "fa fa-chevron-right"
            }
            style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
          ></i>
        </View>
      </Pressable>
      <View style={s()}>{collapsed ? null : children}</View>
    </View>
  );
};
