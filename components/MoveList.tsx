import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { s, c } from "app/styles";
import { times } from "app/utils";
import { forEach, isEmpty, cloneDeep, takeRight, first } from "lodash";
import client from "app/client";
import { Spacer } from "app/Space";
import { Move } from "@lubert/chess.ts";
import { CMText } from "./CMText";

export const MoveList = ({
  moveList,
  focusedMoveIndex,
  onMoveClick,
}: {
  moveList: Move[];
  focusedMoveIndex?: number;
  onMoveClick: (move: Move, _: number) => void;
}) => {
  let pairs = [];
  let currentPair = [];
  forEach(moveList, (move, i) => {
    if (move.color == "b" && isEmpty(currentPair)) {
      pairs.push([{}, { move, i }]);
      return;
    }
    currentPair.push({ move, i });
    if (move.color == "b") {
      pairs.push(currentPair);
      currentPair = [];
    }
  });
  if (!isEmpty(currentPair)) {
    if (currentPair.length === 1) {
      currentPair.push({});
    }
    pairs.push(currentPair);
  }
  const moveStyles = s(
    c.width(80),
    c.fullHeight,
    c.clickable,
    c.selfStretch,
    c.alignStart,
    c.justifyCenter,
    c.column,
    c.fontSize(18),
    c.weightSemiBold,
    c.fg(c.colors.textPrimary)
  );
  return (
    <View style={s(c.column, c.bg(c.grays[20]), c.br(2))}>
      <View style={s(c.height(1), c.bg(c.grays[30]))} />
      {pairs.map((pair, i) => {
        const [{ move: whiteMove, i: whiteI }, { move: blackMove, i: blackI }] =
          pair;
        const activeMoveStyles = s(c.weightBlack, c.fontSize(20));
        return (
          <View key={i} style={s(c.column, c.overflowHidden)}>
            <View style={s(c.row, c.alignStretch, c.py(8))}>
              <View
                style={s(
                  c.width(48),
                  c.center,
                  c.borderRight(`1px solid ${c.grays[30]}`)
                )}
              >
                <CMText
                  style={s(
                    c.fg(c.colors.textPrimary),
                    c.fontSize(18),
                    c.weightSemiBold
                  )}
                >
                  {i + 1}
                </CMText>
              </View>
              <Spacer width={24} />
              <Pressable
                onPress={() => {
                  onMoveClick(whiteMove, whiteI);
                }}
              >
                <CMText
                  style={s(
                    moveStyles,
                    focusedMoveIndex === whiteI && activeMoveStyles
                  )}
                >
                  {whiteMove?.san ?? "..."}
                </CMText>
              </Pressable>
              <Pressable
                onPress={() => {
                  onMoveClick(blackMove, blackI);
                }}
              >
                <CMText
                  style={s(
                    moveStyles,
                    focusedMoveIndex === blackI && activeMoveStyles
                  )}
                >
                  {blackMove?.san ?? "..."}
                </CMText>
              </Pressable>
            </View>
            {i != pairs.length - 1 && (
              <View style={s(c.height(1), c.bg(c.grays[30]))} />
            )}
          </View>
        );
      })}
    </View>
  );
};
