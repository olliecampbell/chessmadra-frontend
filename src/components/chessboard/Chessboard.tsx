import React, { useLayoutEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  PanResponderInstance,
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
import { Piece, Square } from "@lubert/chess.ts/dist/types";
import { ChessColor, COLUMNS, ROWS } from "app/types/Chess";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { getSquareOffset } from "../../utils/chess";
import { ChessboardState } from "app/utils/chessboard_state";
import { useIsMobile } from "app/utils/isMobile";
import { CMText } from "../CMText";
import { isEmpty, isEqual, isNil } from "lodash-es";
import { FadeInOut } from "../FadeInOut";

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
const pieceCache = {};

export const PieceView = ({ piece }: { piece: Piece }) => {
  let key = piece.type + piece.color;
  if (pieceCache[key]) {
    return pieceCache[key];
  } else {
    pieceCache[key] = getIconForPiece(piece.type, piece.color);
    return pieceCache[key];
  }
};

export const getAnimationDurations = (playbackSpeed: PlaybackSpeed) => {
  switch (playbackSpeed) {
    case PlaybackSpeed.DebugSlow:
      return {
        moveDuration: 1000,
        fadeDuration: 1000,
        stayDuration: 1000,
      };
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
        moveDuration: 150,
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
  disableDrag,
  onSquarePress: customOnSquarePress,
  styles,
  shadow,
}: {
  state?: ChessboardState;
  shadow?: boolean;
  disableDrag?: boolean;
  onSquarePress?: any;
  styles?: any;
}) => {
  const { availableMoves } = state;
  const position = state._animatePosition ?? state.position;
  const tileStyles = s(c.bg("green"), c.grow);
  const stateRef = useRef(state);
  stateRef.current = state;
  const chessboardLayout = useRef(null);
  const getSquareFromLayoutAndGesture = (chessboardLayout, gesture): Square => {
    let columnPercent =
      (gesture.moveX - chessboardLayout.left) / chessboardLayout.width;
    let rowPercent =
      (gesture.moveY - chessboardLayout.top - window.scrollY) /
      chessboardLayout.height;
    let row = Math.min(7, Math.max(0, Math.floor(rowPercent * 8)));
    let column = Math.min(7, Math.max(0, Math.floor(columnPercent * 8)));
    if (stateRef.current.flipped) {
      column = 7 - column;
      row = 7 - row;
    }
    // @ts-ignore
    return `${COLUMNS[column]}${ROWS[7 - row]}`;
  };

  const { moveIndicatorAnim, moveIndicatorOpacityAnim, indicatorColor } = state;

  const hiddenColorsBorder = `1px solid ${c.grays[70]}`;
  const pans = useMemo(() => {
    // @ts-ignore
    let pans: Record<Square, Animated.ValueXY> = {};
    Object.keys(SQUARES).map((sq) => {
      pans[sq] = new Animated.ValueXY();
    });
    return pans;
  }, []);
  const tapTimeout = useRef(null);
  const isTap = useRef(false);
  const chessboardContainerRef = useRef(null);
  const didImmediatelyTap = useRef(false);
  const panResponders = useMemo(() => {
    // @ts-ignore
    let panResponders: Record<Square, PanResponderInstance> = {};
    Object.keys(SQUARES).map((sq: Square) => {
      panResponders[sq] = PanResponder.create({
        // Ask to be the responder:
        onStartShouldSetPanResponder: (evt, gestureState) => {
          if (state.frozen) {
            return false;
          }
          return true;
        },
        onStartShouldSetPanResponderCapture: (evt, gestureState) => {
          if (state.frozen) {
            return false;
          }
          return true;
        },
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
          return !state.frozen;
        },
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          if (state.frozen) {
            return false;
          }
          return true;
        },

        onPanResponderGrant: (evt, gestureState) => {
          if (chessboardContainerRef.current) {
            chessboardLayout.current =
              chessboardContainerRef.current.getBoundingClientRect();
          }
          const state = stateRef.current;
          didImmediatelyTap.current = false;
          if (sq !== state.activeFromSquare) {
            didImmediatelyTap.current = true;
            state.onSquarePress(sq, false);
          }
          isTap.current = true;
          tapTimeout.current = window.setTimeout(() => {
            isTap.current = false;
          }, 100);
        },
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
        onPanResponderMove: (evt, gesture) => {
          let square = getSquareFromLayoutAndGesture(
            chessboardLayout.current,
            gesture
          );
          Animated.event([null, { dx: pans[sq].x, dy: pans[sq].y }], {
            useNativeDriver: true,
          })(evt, gesture);
          if (chessboardLayout.current) {
            let isOverMovableSquare = stateRef.current.availableMoves.find(
              (m) => m.to == square
            );
            let newSquare = square;
            let currentSquare = stateRef.current.draggedOverSquare;
            if (
              (currentSquare !== newSquare && isOverMovableSquare) ||
              (!isOverMovableSquare && stateRef.current.draggedOverSquare)
            ) {
              state.quick((s) => {
                if (isOverMovableSquare) {
                  s.draggedOverSquare = square;
                } else {
                  s.draggedOverSquare = null;
                }
              });
            }
          }
        },
        onPanResponderTerminationRequest: (evt, gestureState) => {
          pans[sq].setValue({ x: 0, y: 0 });
          return true;
        },
        onPanResponderRelease: (evt, gestureState) => {
          window.clearTimeout(tapTimeout.current);
          pans[sq].setValue({ x: 0, y: 0 });
          if (isTap.current && !stateRef.current.draggedOverSquare) {
            if (!didImmediatelyTap.current) {
              state.onSquarePress(sq);
            }
            // if (stateRef.current.activeFromSquare) {
            // }
          } else {
            state.quick((s) => {
              s.draggedOverSquare = null;
              s.activeFromSquare = null;
            });
            let square = getSquareFromLayoutAndGesture(
              chessboardLayout.current,
              gestureState
            );
            state.onSquarePress(square, true);

            // The user has released all touches while this view is the
            // responder. This typically means a gesture has succeeded
          }
        },
        onPanResponderTerminate: (evt, gestureState) => {
          pans[sq].setValue({ x: 0, y: 0 });
          // Another component has become the responder, so this gesture
          // should be cancelled
        },
        onShouldBlockNativeResponder: (evt, gestureState) => {
          // Returns whether this component should block native components from becoming the JS
          // responder. Returns true by default. Is currently only supported on android.
          return true;
        },
      });
    });
    return panResponders;
  }, [state.frozen]);

  const isMobile = useIsMobile();
  const moveLogRef = useRef(null);
  useLayoutEffect(() => {
    if (moveLogRef.current) {
      moveLogRef.current.scrollLeft = moveLogRef.current.scrollWidth;
    }
  }, [state.moveLogPgn]);

  const { width: windowWidth } = useWindowDimensions();
  let x = (
    <>
      <View
        style={s(
          c.pb("100%"),
          c.height(0),
          c.width("100%"),
          styles,
          shadow && c.cardShadow,
          {
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            KhtmlUserSelect: "none",
            MozUserSelect: "none",
            MsUserSelect: "none",
            UserSelect: "none",
          }
        )}
      >
        <View
          style={s(
            {
              width: "100%",
              height: "100%",
              position: "absolute",
              overflow: "hidden",
              // shadowColor: "black",
              // shadowOpacity: 0.4,
              // shadowRadius: 10,
            },
            c.brt(2),
            !state.showMoveLog && c.brb(2),
            state.hideColors && c.border(hiddenColorsBorder)
          )}
          ref={chessboardContainerRef}
          onLayout={({ nativeEvent: { layout } }) => {
            chessboardLayout.current = layout;
          }}
        >
          <FadeInOut
            maxOpacity={1.0}
            style={s(c.absoluteFull, c.noPointerEvents, c.zIndex(10))}
            open={state.showPlans}
          >
            {state.plans.map((metaPlan, i) => {
              let { plan } = metaPlan;
              let from = getSquareOffset(plan.fromSquare, state.flipped);
              let to = getSquareOffset(plan.toSquare, state.flipped);
              let dx = Math.abs(from.x - to.x);
              let dy = Math.abs(from.y - to.y);
              let length =
                Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) - (1 / 8) * 0.1;
              let thickness = 10;
              var angle = Math.atan2(to.y - from.y, to.x - from.x);
              var angleDeg = (angle * 180) / Math.PI;
              let color = metaPlan.mine ? c.arrowColors[55] : c.grays[35];
              let gradientColor = c.grays[100];
              let focused = false;
              let opacity = 80;
              if (!metaPlan.mine) {
                opacity = 50;
              }
              if (state.focusedPlans.includes(metaPlan.id)) {
                focused = true;
                color = c.arrowColors[75];
                opacity = 100;
                gradientColor = c.purples[30];
              }
              let duration = "1.0s";
              let speed = 0.2;
              let toSquareCenterX = to.x + 1 / 8 / 2;
              let toSquareCenterY = to.y + 1 / 8 / 2;
              let fromSquareCenterX = (from.x + 1 / 8 / 2) * 100;
              let fromSquareCenterY = (from.y + 1 / 8 / 2) * 100;
              let x1 = from.x + 1 / 8 / 2;
              let x2 = from.x + 1 / 8 / 2 + length * Math.cos(angle);
              let y1 = from.y + 1 / 8 / 2;
              let y2 = from.y + 1 / 8 / 2 + length * Math.sin(angle);
              let xDiff = x2 - x1;
              let yDiff = y2 - y1;
              let red = c.reds[50];
              let blue = c.blues[50];

              return (
                <React.Fragment key={i}>
                  <View
                    style={s(
                      c.absoluteFull,
                      c.noPointerEvents,
                      c.zIndex(focused ? 101 : 100),
                      c.opacity(opacity)
                    )}
                    nativeID={`plan-line-${i}`}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 1 1">
                      <linearGradient
                        id={`plan-line-gradient-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stop-color={color}></stop>
                        <stop offset="25%" stop-color={gradientColor}></stop>
                        <stop offset="50%" stop-color={color}></stop>
                        <stop offset="75%" stop-color={gradientColor}></stop>
                        <stop offset="100%" stop-color={color} />
                        <animate
                          attributeName="y2"
                          values={`${y2};${y2 + yDiff}`}
                          dur={duration}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y1"
                          values={`${y1 - yDiff};${y1}`}
                          dur={duration}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="x2"
                          values={`${x2};${x2 + xDiff}`}
                          dur={duration}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="x1"
                          values={`${x1 - xDiff};${x1}`}
                          dur={duration}
                          repeatCount="indefinite"
                        />
                      </linearGradient>
                      <line
                        // stroke={`url(#${`plan-line-gradient-${i}`})`}
                        stroke={color}
                        strokeLinecap="round"
                        strokeWidth={1.4 / 100}
                        x1={from.x + 1 / 8 / 2}
                        y1={from.y + 1 / 8 / 2}
                        x2={from.x + 1 / 8 / 2 + length * Math.cos(angle)}
                        y2={from.y + 1 / 8 / 2 + length * Math.sin(angle)}
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={(1 / 8) * 0.04}
                        fill={color}
                        stroke={color}
                        transform={`rotate(${
                          angleDeg - 90
                        } ${toSquareCenterX} ${toSquareCenterY})`}
                        d={`M ${toSquareCenterX - 2 / 100},${
                          toSquareCenterY - 2.8 / 100
                        } ${toSquareCenterX},${toSquareCenterY - 0.004} ${
                          toSquareCenterX + 2 / 100
                        },${toSquareCenterY - 2.8 / 100} Z`}
                      />
                      {/*<circle
                        cx={to.x + 1 / 8 / 2}
                        cy={to.y + 1 / 8 / 2}
                        r={(1 / 8) * 0.12}
                        fill={gradientColor}
                        // fill={`url(#${`plan-line-gradient-${i}`})`}
                      />*/}
                    </svg>
                  </View>
                </React.Fragment>
              );
            })}
          </FadeInOut>
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
          {Object.keys(SQUARES).map((square) => {
            let pos = state.previewPosition ?? position;
            let piece: Piece = null;
            if (pos) {
              piece = pos.get(square);
            }

            let posStyles = s(
              c.top(`${getSquareOffset(square, state.flipped).y * 100}%`),
              c.left(`${getSquareOffset(square, state.flipped).x * 100}%`)
            );
            let animated = false;
            if (state.animatedMove?.to && square == state.animatedMove?.to) {
              animated = true;
              posStyles = animatedXYToPercentage(state.pieceMoveAnim);
            } else {
            }
            if (
              state.previewMove &&
              (square == state.previewedMove?.from ||
                (state.previewedMove?.to && square == state.previewedMove?.to))
            ) {
              animated = true;
              posStyles = animatedXYToPercentage(state.previewPieceMoveAnim);
            }
            let priority = state.activeFromSquare === square;
            let containerViewStyles = s(
              c.absolute,
              posStyles,
              c.zIndex(priority ? 11 : 2),
              c.size("12.5%")
            );
            let pieceView = null;
            if (piece) {
              let pieceViewInner = (
                <View style={s(c.fullWidth, c.fullHeight)}>
                  <PieceView piece={piece} />
                </View>
              );
              if (animated) {
                pieceView = (
                  <Animated.View
                    style={s(containerViewStyles)}
                    key={`animated-${square}`}
                    pointerEvents="none"
                  >
                    {pieceViewInner}
                  </Animated.View>
                );
              } else {
                pieceView = (
                  <Animated.View
                    key={`piece-${square}`}
                    pointerEvents="none"
                    style={s(containerViewStyles, {
                      transform: [
                        { translateX: pans[square].x },
                        { translateY: pans[square].y },
                      ],
                    })}
                  >
                    {pieceViewInner}
                  </Animated.View>
                );
              }
            }
            if (
              state.previewedMove?.to === square &&
              state.previewedMove?.color !== piece?.color
            ) {
              pieceView = null;
            }
            let moveIndicatorView = null;
            let availableMove = availableMoves.find((m) => m.to == square);
            if (
              availableMove ||
              state.activeFromSquare === square ||
              state.draggedOverSquare == square
            ) {
              let isFromSquare = state.activeFromSquare === square;
              let isDraggedOverSquare = state.draggedOverSquare == square;
              let isJustIndicator = !isDraggedOverSquare && !isFromSquare;
              moveIndicatorView = (
                <Animated.View
                  style={s(
                    c.fullWidth,
                    c.absolute,
                    posStyles,
                    c.zIndex(2),
                    c.center,
                    c.size("12.5%")
                  )}
                  pointerEvents="none"
                  key={`indicator-${square}`}
                >
                  <View
                    style={s(
                      isJustIndicator ? c.size("30%") : c.size("100%"),
                      isJustIndicator ? c.opacity(50) : c.opacity(40),
                      isJustIndicator
                        ? c.bg(c.primaries[0])
                        : c.bg(c.primaries[40]),
                      isJustIndicator && c.round,
                      c.absolute,
                      c.zIndex(4)
                    )}
                  />
                </Animated.View>
              );
            }

            return (
              <React.Fragment key={square}>
                {pieceView}
                {moveIndicatorView}
              </React.Fragment>
            );
          })}
          <View style={s(c.column, c.fullWidth, c.fullHeight)}>
            {times(8)((i) => {
              return (
                <View
                  key={i}
                  style={s(c.fullWidth, c.row, c.grow, c.flexible, c.relative)}
                >
                  {times(8)((j) => {
                    let colors = state.highContrast
                      ? [c.grays[75], c.grays[65]]
                      : [c.colors.lightTile, c.colors.darkTile];
                    let [color, inverseColor] =
                      (i + j) % 2 == 0 ? colors : [colors[1], colors[0]];
                    if (state.hideColors) {
                      color = c.grays[30];
                    }
                    let tileLetter = state.flipped
                      ? COLUMNS[7 - j]
                      : COLUMNS[j];

                    // Piece view / indicator view
                    let tileNumber = state.flipped ? ROWS[i] : ROWS[7 - i];
                    let square = `${tileLetter}${tileNumber}` as Square;

                    const isBottomEdge = i == 7;
                    const isRightEdge = j == 7;
                    return (
                      <View
                        key={j}
                        style={s(
                          c.keyedProp("touchAction")("none"),
                          tileStyles,
                          c.bg(color),
                          c.center,
                          !state.frozen && c.clickable,
                          c.flexible,
                          state.hideColors &&
                            s(
                              !isBottomEdge &&
                                c.borderBottom(hiddenColorsBorder),
                              !isRightEdge && c.borderRight(hiddenColorsBorder)
                            )
                        )}
                        {...panResponders[square].panHandlers}
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
                        {isBottomEdge && !state.hideCoordinates && (
                          <CMText
                            style={s(
                              c.fg(
                                state.hideColors ? c.grays[80] : inverseColor
                              ),
                              c.weightBold,
                              c.absolute,
                              c.fontSize(isMobile ? 8 : 10),
                              c.left(isMobile ? 2 : 1),
                              c.bottom(isMobile ? 0 : -1),
                              c.opacity(80)
                            )}
                          >
                            {tileLetter}
                          </CMText>
                        )}
                        {isRightEdge && !state.hideCoordinates && (
                          <CMText
                            style={s(
                              c.fg(
                                state.hideColors ? c.grays[80] : inverseColor
                              ),
                              c.weightBold,
                              c.absolute,
                              c.fontSize(isMobile ? 8 : 10),
                              c.right(isMobile ? 2 : 1),
                              c.opacity(80),
                              c.top(isMobile ? 0 : 0)
                            )}
                          >
                            {tileNumber}
                          </CMText>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>
      {state.showMoveLog && state.moveLogPgn && (
        <>
          <View
            ref={moveLogRef}
            style={s(
              c.fullWidth,
              c.bg(c.grays[15]),
              c.pt(14),
              c.pb(8),
              c.mt(-6),
              c.px(4),
              c.br(2),
              c.zIndex(-1),
              c.scrollX
            )}
          >
            <CMText
              style={s(
                c.fg(c.colors.textSecondary),
                c.weightBold,
                c.keyedProp("textOverflow")("ellipsis"),
                c.whitespace("nowrap")
              )}
            >
              {state.moveLogPgn}
            </CMText>
          </View>
        </>
      )}
    </>
  );
  // console.timeEnd("chessboard");
  return x;
};
