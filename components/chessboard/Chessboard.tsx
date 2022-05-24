import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { s, c } from "app/styles";
import { times } from "app/utils";
import BishopBlackIcon from "app/components/chessboard/pieces/BishopBlackIcon";
import BishopWhiteIcon from "app/components/chessboard/pieces/BishopWhiteIcon";
import KingBlackIcon from "app/components/chessboard/pieces/KingBlackIcon";
import KingWhiteIcon from "app/components/chessboard/pieces/KingWhiteIcon";
import KnightBlackIcon from "app/components/chessboard/pieces/KnightBlackIcon";
import KnightWhiteIcon from "app/components/chessboard/pieces/KnightWhiteIcon";
import PawnBlackIcon from "app/components/chessboard/pieces/PawnBlackIcon";
import PawnWhiteIcon from "app/components/chessboard/pieces/PawnWhiteIcon";
import QueenBlackIcon from "app/components/chessboard/pieces/QueenBlackIcon";
import QueenWhiteIcon from "app/components/chessboard/pieces/QueenWhiteIcon";
import RookBlackIcon from "app/components/chessboard/pieces/RookBlackIcon";
import RookWhiteIcon from "app/components/chessboard/pieces/RookWhiteIcon";
import { Chess, PieceSymbol, SQUARES } from "@lubert/chess.ts";
import { Move, Piece, Square } from "@lubert/chess.ts/dist/types";
import { ChessboardState } from "app/types/ChessboardBiref";
import { ChessColor, COLUMNS, ROWS } from "app/types/Chess";
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState,
} from "app/types/VisualizationState";
import { getSquareOffset } from "../../utils/chess";

const animatedXYToPercentage = (x) => {
  return s(
    c.top(
      x.y.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      })
    ),
    c.left(
      x.x.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      })
    )
  );
};

const cloneBoard = (board: Chess): Chess => {
  return new Chess(board.fen());
};

export const getPlaybackSpeedDescription = (ps: PlaybackSpeed) => {
  switch (ps) {
    case PlaybackSpeed.Slow:
      return "Slow";
    case PlaybackSpeed.Normal:
      return "Normal";
    case PlaybackSpeed.Fast:
      return "Fast";
    case PlaybackSpeed.Ludicrous:
      return "Ludicrous";
  }
};

enum ChessPiece {
  Pawn = "p",
  Rook = "r",
  Knight = "n",
  Bishop = "b",
  Queen = "q",
  King = "k",
}

const getIconForPiece = (piece: PieceSymbol, color: ChessColor) => {
  switch (color) {
    case "b":
      switch (piece) {
        case ChessPiece.Rook:
          return <RookBlackIcon />;
        case ChessPiece.Pawn:
          return <PawnBlackIcon />;
        case ChessPiece.Knight:
          return <KnightBlackIcon />;
        case ChessPiece.Queen:
          return <QueenBlackIcon />;
        case ChessPiece.Bishop:
          return <BishopBlackIcon />;
        case ChessPiece.King:
          return <KingBlackIcon />;
      }
    case "w":
      switch (piece) {
        case ChessPiece.Rook:
          return <RookWhiteIcon />;
        case ChessPiece.Pawn:
          return <PawnWhiteIcon />;
        case ChessPiece.Knight:
          return <KnightWhiteIcon />;
        case ChessPiece.Queen:
          return <QueenWhiteIcon />;
        case ChessPiece.Bishop:
          return <BishopWhiteIcon />;
        case ChessPiece.King:
          return <KingWhiteIcon />;
      }
  }
};

export const PieceView = ({ piece }: { piece: Piece }) => {
  return (
    <View style={s(c.fullWidth, c.fullHeight)}>
      {getIconForPiece(piece.type, piece.color)}
    </View>
  );
};

export const getAnimationDurations = (playbackSpeed: PlaybackSpeed) => {
  switch (playbackSpeed) {
    case PlaybackSpeed.Slow:
      return {
        moveDuration: 300,
        fadeDuration: 200,
        stayDuration: 500,
      };
    case PlaybackSpeed.Normal:
      return {
        moveDuration: 200,
        fadeDuration: 150,
        stayDuration: 300,
      };
    case PlaybackSpeed.Fast:
      return {
        moveDuration: 200,
        fadeDuration: 100,
        stayDuration: 100,
      };
    case PlaybackSpeed.Ludicrous:
      return {
        moveDuration: 150,
        fadeDuration: 50,
        stayDuration: 50,
      };
  }
};

export const ChessboardView = ({
  state,
  onSquarePress,
  disableDrag,
  styles,
}: {
  state?: ChessboardState;
  onSquarePress?: any;
  disableDrag?: boolean;
  styles?: any;
}) => {
  const { position, availableMoves } = state;
  const tileStyles = s(c.bg("green"), c.grow);

  const { moveIndicatorAnim, moveIndicatorOpacityAnim, indicatorColor } = state;

  const hiddenColorsBorder = `1px solid ${c.grays[70]}`;

  const { width: windowWidth } = useWindowDimensions();
  return (
    <View
      style={s(c.pb("100%"), c.height(0), c.width("100%"), styles)}
      // @ts-ignore
    >
      <View
        style={s(
          {
            width: "100%",
            height: "100%",
            position: "absolute",
            borderRadius: 2,
            overflow: "hidden",
            shadowColor: "black",
            shadowOpacity: 0.4,
            shadowRadius: 10,
          },
          state.hideColors && c.border(hiddenColorsBorder)
        )}
      >
        <Animated.View
          pointerEvents="none"
          style={s(
            c.size("calc(1/8 * 100%)"),
            c.zIndex(5),
            c.absolute,
            c.center,
            c.opacity(moveIndicatorOpacityAnim),
            moveIndicatorAnim && animatedXYToPercentage(moveIndicatorAnim)
          )}
        >
          <View
            style={s(
              c.size("50%"),
              c.round,
              c.bg(indicatorColor),
              c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
            )}
          ></View>
        </Animated.View>
        <Animated.View // Special animatable View
          style={s(
            c.absolute,
            c.fullWidth,
            c.fullHeight,
            c.zIndex(3),
            // c.bg("black"),
            c.border(`6px solid ${state.ringColor}`),
            // @ts-ignore
            c.opacity(state.ringIndicatorAnim)
          )}
          pointerEvents="none"
        ></Animated.View>
        {Object.keys(SQUARES).map((sq) => {
          let pos = position;
          let piece: Piece = null;
          if (pos) {
            piece = pos.get(sq);
          }
          let layout = {};

          let posStyles = s(
            c.top(`${getSquareOffset(sq, state.flipped).y * 100}%`),
            c.left(`${getSquareOffset(sq, state.flipped).x * 100}%`)
          );
          let pieceView = null;
          if (piece) {
            pieceView = (
              <Animated.View
                style={s(
                  c.fullWidth,
                  c.absolute,
                  posStyles,
                  c.zIndex(1),
                  c.size("12.5%"),
                  layout
                )}
                pointerEvents="none"
              >
                <PieceView piece={piece} />
              </Animated.View>
            );
          }
          let moveIndicatorView = null;
          let availableMove = availableMoves.find((m) => m.to == sq);
          if (availableMove) {
            moveIndicatorView = (
              <Animated.View
                style={s(
                  c.fullWidth,
                  c.absolute,
                  posStyles,
                  c.zIndex(2),
                  c.center,
                  c.size("12.5%"),
                  layout
                )}
                pointerEvents="none"
              >
                <View
                  style={s(
                    c.size("30%"),
                    c.opacity(40),
                    c.round,
                    c.bg("black"),
                    c.absolute,
                    c.zIndex(4)
                  )}
                />
              </Animated.View>
            );
          }
          return (
            <>
              {pieceView}
              {moveIndicatorView}
            </>
          );
        })}
        <View style={s(c.column, c.fullWidth, c.fullHeight)}>
          {times(8)((i) => {
            return (
              <View
                key={i}
                style={s(c.fullWidth, c.bg("red"), c.row, c.grow, c.flexible)}
              >
                {times(8)((j) => {
                  let color =
                    (i + j) % 2 == 0 ? c.colors.lightTile : c.colors.darkTile;
                  if (state.hideColors) {
                    color = c.grays[30];
                  }
                  let square = `${COLUMNS[j]}${ROWS[7 - i]}` as Square;
                  if (state.flipped) {
                    square = `${COLUMNS[7 - j]}${ROWS[i]}` as Square;
                  }
                  const isBottomEdge = i == 7;
                  const isRightEdge = j == 7;
                  return (
                    <Pressable
                      key={j}
                      style={s(
                        tileStyles,
                        c.bg(color),
                        c.center,
                        c.clickable,
                        c.flexible,
                        c.overflowHidden,
                        state.hideColors &&
                          s(
                            !isBottomEdge && c.borderBottom(hiddenColorsBorder),
                            !isRightEdge && c.borderRight(hiddenColorsBorder)
                          )
                      )}
                      onPress={() => {
                        onSquarePress(square);
                      }}
                    >
                      <Animated.View
                        style={s(
                          {
                            opacity: state.squareHighlightAnims[square],
                          },
                          c.bg(c.primaries[60]),
                          c.absolute,
                          c.size("100%"),
                          c.zIndex(4)
                        )}
                      ></Animated.View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
