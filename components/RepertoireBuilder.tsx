import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { cloneDeep, isEmpty, isNil, takeRight } from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { useRepertoireBuilderStore } from "../utils/state";
import { MOCK_WHITE_REPERTOIRE } from "app/mocks/repertoires";
import { Repertoire, RepertoireMove } from "app/models";
import { keyBy, groupBy } from "lodash";
import { intersperse } from "app/utils/intersperse";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireBuilderStore();
  return (
    <TrainerLayout
      chessboard={
        <ChessboardView
          {...{
            state: state.chessState,
          }}
        />
      }
    >
      <View style={s(!isMobile && s(c.width(300)))}>
        <View style={s(c.bg(c.grays[50]), c.px(12), c.py(4))}>
          <OpeningTree repertoire={MOCK_WHITE_REPERTOIRE} />
        </View>
      </View>
    </TrainerLayout>
  );
};

const OpeningTree = ({ repertoire }) => {
  let fenLookup: Record<string, RepertoireMove[]> = groupBy(
    repertoire.moves,
    (m) => m.fen
  );
  return (
    <View style={s()}>
      {fenLookup[START_FEN].map((move) => {
        return <OpeningNode move={move} fenLookup={fenLookup} />;
      })}
    </View>
  );
};

const OpeningNode = ({
  move,
  fenLookup,
}: {
  move: RepertoireMove;
  fenLookup: Record<string, RepertoireMove[]>;
}) => {
  return (
    <View>
      <View
        style={s(
          c.row,
          c.br(2),
          c.px(4),
          c.bg(c.grays[20]),
          c.my(4),
          c.py(4),
          c.justifyBetween
        )}
      >
        <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
          {move.sanPlus}
        </Text>
        <Text style={s(c.clickable)}>
          <i
            style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
            className={`fa-light fa-trash-can`}
          ></i>
        </Text>
      </View>
      <View style={s(c.pl(12))}>
        <View style={s()}>
          {intersperse(
            (fenLookup[move.fenAfter] || []).map((move) => {
              return <OpeningNode move={move} fenLookup={fenLookup} />;
            }),
            (i) => {
              return <Spacer key={i} height={0} />;
            }
          )}
        </View>
      </View>
    </View>
  );
};

let START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
