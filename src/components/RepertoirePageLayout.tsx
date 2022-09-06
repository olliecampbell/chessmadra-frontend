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
} from "lodash-es";
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
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { Modal } from "./Modal";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { useRepertoireState } from "app/utils/app_state";
import React from "react";
import { plural, pluralize } from "app/utils/pluralize";

export const RepertoirePageLayout = ({
  children,
  bottom,
}: {
  children: any;
  bottom?: any;
}) => {
  const isMobile = useIsMobile();
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(c.grays[14]),
        c.grow,
        c.height("100vh"),
        c.keyedProp("minHeight")("-webkit-fill-available"),
        c.keyedProp("maxHeight")("-webkit-fill-available")
      )}
    >
      <View
        style={s(
          c.fullWidth,
          c.height(72),
          c.bg(c.grays[10]),
          c.borderBottom(`2px solid ${c.grays[8]}`)
          // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
        )}
      >
        <View
          style={s(
            c.containerStyles(isMobile),
            c.alignStart,
            c.justifyEnd,
            c.column,
            c.fullHeight,
            c.pb(16)
          )}
        >
          <RepertoireNavBreadcrumbs />
        </View>
      </View>
      <View
        style={s(
          c.grow,
          c.scrollY,
          c.center,
          c.justifyStart,
          c.flexShrink(1),
          c.pt(isMobile ? 24 : 92),
          c.pb(isMobile ? 128 : 128)
        )}
      >
        {children}
      </View>
      {bottom}
    </View>
  );
};

export const RepertoireNavBreadcrumbs = () => {
  const [breadcrumbs] = useRepertoireState((s) => [s.breadcrumbs]);
  return (
    <View style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth)}>
      {intersperse(
        breadcrumbs.map((breadcrumb, i) => {
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              style={s(breadcrumb.onPress ? c.clickable : c.unclickable)}
              onPress={() => {
                breadcrumb.onPress?.();
              }}
            >
              <View style={s()}>
                <CMText
                  style={s(
                    breadcrumb.onPress ? c.weightHeavy : c.weightThin,
                    c.fg(c.colors.textPrimary)
                  )}
                >
                  {breadcrumb.text}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <View key={i} style={s(c.mx(12))}>
              <CMText style={s()}>
                <i className="fa fa-angle-right" />
              </CMText>
            </View>
          );
        }
      )}
    </View>
  );
};
