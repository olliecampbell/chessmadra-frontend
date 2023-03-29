import { Chess, PieceSymbol, SQUARES } from "@lubert/chess.ts";
import { getStatic } from "~/utils/assets";
import { s, c } from "~/utils/styles";
import { Piece, Square } from "@lubert/chess.ts/dist/types";
import { ChessColor, COLUMNS, ROWS } from "~/types/Chess";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { getSquareOffset } from "../../utils/chess";
import { ChessboardState } from "~/utils/chessboard_state";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "../CMText";
import { forEach, isEmpty, isEqual, isNil, take } from "lodash-es";
import { FadeInOut } from "../FadeInOut";
import {
  getAppState,
  quick,
  useAdminState,
  useUserState,
} from "~/utils/app_state";
import { BoardTheme, BOARD_THEMES_BY_ID, PieceSetId } from "~/utils/theming";
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  splitProps,
} from "solid-js";
import { Motion } from "@motionone/solid";
import { times } from "~/utils/times";
import { createElementBounds, NullableBounds } from "@solid-primitives/bounds";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { destructure } from "@solid-primitives/destructure";
import { logProxy } from "~/utils/state";

const animatedXYToPercentage = (x) => {
  return {};
  // todo: solid
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

const getSvgName = (piece: PieceSymbol, color: ChessColor) => {
  return `${color}${piece.toUpperCase()}`;
};
//
export const PieceView: Component<{
  piece: Piece;
  pieceSet: PieceSetId;
}> = (props) => {
  return (
    <img
      style={s(c.fullWidth, c.fullHeight)}
      src={getStatic(
        `/pieces/${props.pieceSet}/${getSvgName(
          props.piece.type,
          props.piece.color
        )}.svg`
      )}
    />
  );
};
//
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
interface XY {
  x: number;
  y: number;
}
//
export const ChessboardView = (props: {
  state: ChessboardState;
  shadow?: boolean;
  disableDrag?: boolean;
  onSquarePress?: any;
  styles?: any;
  ref: (_: HTMLElement) => void;
}) => {
  console.log("rendering this again?");
  const availableMoves = () => props.state.availableMoves;
  createEffect(() => {
    console.log("availableMoves", logProxy(availableMoves()));
  });
  const position = () => props.state._animatePosition ?? props.state.position;
  const userState = getAppState().userState;
  const user = () => userState.user;
  const theme: Accessor<BoardTheme> = () =>
    BOARD_THEMES_BY_ID[user()?.theme] ?? BOARD_THEMES_BY_ID["lichess-brown"];
  const colors = () => [theme().light.color, theme().dark.color];
  const flipped = createMemo(() => !!props.state.flipped);
  const [drag, setDrag] = createSignal({
    square: null,
    x: 0,
    y: 0,
    transform: { x: 0, y: 0 },
  } as {
    square: Square | null;
    x: number;
    y: number;
    transform: {
      x: number;
      y: number;
    };
  });

  const getSquareFromLayoutAndGesture = (
    chessboardLayout,
    gesture: XY
  ): [Square, number, number] => {
    const columnPercent = gesture.x / chessboardLayout.width;
    const rowPercent = gesture.y / chessboardLayout.height;
    let row = Math.min(7, Math.max(0, Math.floor(rowPercent * 8)));
    let column = Math.min(7, Math.max(0, Math.floor(columnPercent * 8)));
    if (flipped()) {
      column = 7 - column;
      row = 7 - row;
    }
    // @ts-ignore
    return [
      `${COLUMNS[column]}${ROWS[7 - row]}`,
      (column + 0.5) * (chessboardLayout.width / 8),
      (row + 0.5) * (chessboardLayout.height / 8),
    ];
  };

  const moveIndicatorAnim = () => props.state.moveIndicatorAnim;
  const moveIndicatorOpacityAnim = () => props.state.moveIndicatorOpacityAnim;
  const indicatorColor = () => props.state.indicatorColor;

  const hiddenColorsBorder = `1px solid ${c.grays[70]}`;
  // const pan: Accessor<{ square: Square | null } & XY> = createSignal({
  //   square: null,
  // });
  const [tapTimeout, setTapTimeout] = createSignal(null as number | null);
  const [isTap, setIsTap] = createSignal(null as boolean | null);
  const [chessboardContainerRef, setChessboardContainerRef] =
    createSignal(null);
  const chessboardLayout = createElementBounds(chessboardContainerRef);
  createEffect(() => {
    console.log("chessboardLayout", chessboardLayout);
  });
  const [didImmediatelyTap, setDidImmediatelyTap] = createSignal(false);
  const getTapOffset = (e: MouseEvent | TouchEvent, parent: NullableBounds) => {
    // @ts-ignore
    const touch = e.targetTouches?.[0];
    if (touch) {
      return {
        x: touch.clientX - parent.left,
        y: touch.clientY - parent.top,
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY,
      };
    }
  };
  const frozen = () => props.state.frozen;
  const onMouseDown = (evt: MouseEvent) => {
    if (frozen()) return;
    const tap = getTapOffset(evt, chessboardLayout);
    const [square, centerX, centerY] = getSquareFromLayoutAndGesture(
      chessboardLayout,
      tap
    );
    console.log({ tap });
    setDrag((drag) => {
      drag.square = square;
      drag.x = tap.x;
      drag.y = tap.y;
      drag.transform = {
        x: tap.x - centerX,
        y: tap.y - centerY,
      };
      return drag;
    });

    if (square !== props.state.activeFromSquare) {
      props.state.onSquarePress(square, false);
    }

    setIsTap(true);
    setTapTimeout(
      window.setTimeout(() => {
        setIsTap(false);
      }, 100)
    );
  };
  const onMouseOut = (evt: MouseEvent) => {
    setDrag({
      square: null,
      x: 0,
      y: 0,
      transform: { x: 0, y: 0 },
    });
    props.state.quick((s) => {
      s.draggedOverSquare = undefined;
      s.activeFromSquare = undefined;
    });
  };
  const onMouseMove = (evt: MouseEvent) => {
    if (frozen()) return;
    // if (evt.target != chessboardContainerRef()) return;

    // console.log("onMouseMove", evt);
    // if (evt.offsetX < 50) {
    //   debugger;
    // }
    if (!drag().square) {
      return;
    }
    let newDrag = {
      square: drag().square,
      x: 0,
      y: 0,
      transform: { x: 0, y: 0 },
    };
    let tap = getTapOffset(evt, chessboardLayout);
    const [newSquare] = getSquareFromLayoutAndGesture(chessboardLayout, tap);
    if (newSquare !== props.state.draggedOverSquare) {
      // console.log("newSquare", newSquare, props.state.draggedOverSquare);
      let isOverMovableSquare = props.state.availableMoves.find(
        (m) => m.to == newSquare
      );
      // newDrag.square = newSquare;
      // console.log("isOverMovableSquare", isOverMovableSquare);
      props.state.quick((s) => {
        if (isOverMovableSquare) {
          s.draggedOverSquare = newSquare;
        } else {
          s.draggedOverSquare = undefined;
        }
      });
    }
    forEach(["x", "y"] as ("x" | "y")[], (key) => {
      let prev = drag()[key];

      const curr = tap[key];
      let delta = curr - prev;
      newDrag[key] = curr;
      newDrag.transform[key] = drag().transform[key] + delta;
    });
    setDrag(newDrag);
  };
  const onMouseUp = (evt: MouseEvent) => {
    if (frozen()) return;
    const [newSquare] = getSquareFromLayoutAndGesture(chessboardLayout, drag());
    console.log("onMouseUp", newSquare, evt);

    if (isTap()) {
      // props.state.onSquarePress(drag().square, false);
      // if (stateRef.current.activeFromSquare) {
      // }
    } else {
      props.state.onSquarePress(newSquare, true);
    }
    setDrag({
      square: null,
      x: 0,
      y: 0,
      transform: { x: 0, y: 0 },
    });
  };

  const isMobile = useIsMobile();
  const themeStyles = (light: boolean) =>
    light ? theme().light.styles : theme().dark.styles;
  const x = (
    <>
      <div
        ref={props.ref}
        style={s(
          c.pb("100%"),
          c.relative,
          c.height(0),
          c.width("100%"),
          props.styles,
          props.shadow && c.cardShadow,
          {
            "webkit-touch-callout": "none",
            "webkit-user-select": "none",
            "khtml-user-select": "none",
            "moz-user-select": "none",
            "ms-user-select": "none",
            "user-select": "none",
          }
        )}
      >
        <div
          style={s(
            {
              width: "100%",
              height: "100%",
              position: "absolute",
              // shadowColor: "black",
              // shadowOpacity: 0.4,
              // shadowRadius: 10,
            },
            c.brt(2),
            props.state.hideColors && c.border(hiddenColorsBorder)
          )}
          ref={setChessboardContainerRef}
          onMouseMove={onMouseMove}
          onTouchMove={onMouseMove}
          onMouseOut={onMouseOut}
          onTouchEnd={onMouseUp}
          onTouchCancel={onMouseOut}
          onTouchStart={onMouseDown}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <FadeInOut
            maxOpacity={1.0}
            style={s(c.absoluteFull, c.noPointerEvents, c.zIndex(10))}
            open={() => props.state.showPlans}
          >
            <For each={props.state.plans}>
              {(metaPlan, i) => {
                const { plan } = metaPlan;
                const from = getSquareOffset(plan.fromSquare, flipped());
                const to = getSquareOffset(plan.toSquare, flipped());
                const dx = Math.abs(from.x - to.x);
                const dy = Math.abs(from.y - to.y);
                const length =
                  Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) - (1 / 8) * 0.1;
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const angleDeg = (angle * 180) / Math.PI;
                let color = metaPlan.mine ? c.arrowColors[55] : c.grays[35];
                let gradientColor = c.grays[100];
                let focused = false;
                let opacity = 80;
                if (!metaPlan.mine) {
                  opacity = 50;
                }
                if (props.state.focusedPlans?.includes(metaPlan.id)) {
                  focused = true;
                  color = c.purples[65];
                  opacity = 100;
                  gradientColor = c.purples[30];
                }
                const duration = "1.0s";
                const toSquareCenterX = to.x + 1 / 8 / 2;
                const toSquareCenterY = to.y + 1 / 8 / 2;
                const x1 = from.x + 1 / 8 / 2;
                const x2 = from.x + 1 / 8 / 2 + length * Math.cos(angle);
                const y1 = from.y + 1 / 8 / 2;
                const y2 = from.y + 1 / 8 / 2 + length * Math.sin(angle);
                const xDiff = x2 - x1;
                const yDiff = y2 - y1;

                return (
                  <div
                    style={s(
                      c.absoluteFull,
                      c.noPointerEvents,
                      c.zIndex(focused ? 101 : 100),
                      c.opacity(opacity)
                    )}
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
                        stroke-width={1.4 / 100}
                        stroke-linecap="round"
                        x1={from.x + 1 / 8 / 2}
                        y1={from.y + 1 / 8 / 2}
                        x2={from.x + 1 / 8 / 2 + length * Math.cos(angle)}
                        y2={from.y + 1 / 8 / 2 + length * Math.sin(angle)}
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={(1 / 8) * 0.04}
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
                  </div>
                );
              }}
            </For>
          </FadeInOut>
          <Motion
            style={s(
              c.size("calc(1/8 * 100%)"),
              c.noPointerEvents,
              c.zIndex(5),
              c.absolute,
              c.center,
              c.opacity(moveIndicatorOpacityAnim),
              moveIndicatorAnim && animatedXYToPercentage(moveIndicatorAnim)
            )}
          >
            <div
              style={s(
                c.size("50%"),
                c.round,
                c.bg(indicatorColor),
                c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
              )}
            ></div>
          </Motion>
          <Motion // Special animatable View
            style={s(
              c.absolute,
              c.fullWidth,
              c.fullHeight,
              c.zIndex(3),
              // c.bg("black"),
              // c.shadow(0, 0, 6, 6, state.ringColor),
              c.shadow(0, 0, 0, 4, props.state.ringColor),
              c.opacity(props.state.ringIndicatorAnim),
              c.noPointerEvents
            )}
          ></Motion>
          <For each={Object.keys(SQUARES)}>
            {(square) => {
              let debug = "b5";
              const pos = () => props.state.previewPosition ?? position();
              const piece = createMemo(() => pos().get(square));
              createEffect(() => {
                if (square === debug) {
                  console.log("piece", piece(), pos().ascii());
                }
              });

              const dragging = createMemo(() => {
                return drag().square === square;
              });
              const animatedProps = () => {
                let posStyles = s(
                  c.top(`${getSquareOffset(square, flipped()).y * 100}%`),
                  c.left(`${getSquareOffset(square, flipped()).x * 100}%`)
                );
                let animated = false;
                if (dragging()) {
                  // console.log(drag());
                  // todo: could be more efficient with deep equals
                  posStyles = s(
                    posStyles,
                    c.transform(
                      `translate(${drag().transform.x}px, ${
                        drag().transform.y
                      }px)`
                    )
                  );
                }

                return { animated, posStyles };
              };
              const { animated, posStyles } = destructure(animatedProps);
              const hiddenBecauseTake = createMemo(
                () =>
                  props.state.previewedMove?.to === square &&
                  props.state.previewedMove?.color !== piece()?.color
              );

              const priority = () => props.state.activeFromSquare === square;
              const containerViewStyles = () =>
                s(
                  c.absolute,
                  posStyles(),
                  c.zIndex(priority() ? 11 : 2),
                  c.size("12.5%"),
                  c.noPointerEvents
                );
              return (
                <>
                  <Show when={piece() && !hiddenBecauseTake()}>
                    <div style={s(containerViewStyles(), c.noPointerEvents)}>
                      <div style={s(c.fullWidth, c.fullHeight)}>
                        <PieceView
                          piece={piece()}
                          pieceSet={user()?.pieceSet ?? "cburnett"}
                        />
                      </div>
                    </div>
                  </Show>
                </>
              );
            }}
          </For>
          <div
            style={s(c.column, c.fullWidth, c.fullHeight, c.noPointerEvents)}
          >
            {times(8)((i) => {
              return (
                <div
                  style={s(c.fullWidth, c.row, c.grow, c.flexible, c.relative)}
                >
                  {times(8)((j) => {
                    const light = (i + j) % 2 == 0;
                    const [color, inverseColor] = light
                      ? colors()
                      : [colors()[1], colors()[0]];
                    // if (state.hideColors) {
                    //   color = c.grays[30];
                    // }
                    const tileLetter = () =>
                      flipped() ? COLUMNS[7 - j] : COLUMNS[j];

                    // Piece view / indicator view
                    const tileNumber = () =>
                      flipped() ? ROWS[i] : ROWS[7 - i];
                    const square = createMemo(
                      () => `${tileLetter()}${tileNumber()}` as Square
                    );

                    let availableMove = createMemo(() => {
                      return availableMoves().find((m) => m.to == square());
                    });
                    const showIndicator = createMemo(
                      () =>
                        availableMove() ||
                        props.state.activeFromSquare === square() ||
                        props.state.draggedOverSquare === square()
                    );
                    let isFromSquare = () =>
                      props.state.activeFromSquare === square();
                    let isDraggedOverSquare = () =>
                      props.state.draggedOverSquare == square();
                    let isJustIndicator = () =>
                      !isDraggedOverSquare() && !isFromSquare();

                    const isBottomEdge = i == 7;
                    const isRightEdge = j == 7;
                    return (
                      <div
                        style={s(
                          c.keyedProp("touchAction")("none"),
                          c.bg(color),
                          themeStyles(light),
                          c.center,
                          !frozen() && c.clickable,
                          c.flexible,
                          c.relative
                          // state.hideColors &&
                          //   s(
                          //     !isBottomEdge &&
                          //       c.borderBottom(hiddenColorsBorder),
                          //     !isRightEdge && c.borderRight(hiddenColorsBorder)
                          //   )
                        )}
                      >
                        <Show when={showIndicator()}>
                          <div
                            id={`indicator-${square()}`}
                            style={s(
                              c.noPointerEvents,
                              c.fullWidth,
                              c.zIndex(6),
                              c.center,
                              c.absoluteFull
                            )}
                          >
                            <div
                              style={s(
                                isJustIndicator()
                                  ? c.size("30%")
                                  : c.size("100%"),
                                isJustIndicator()
                                  ? c.bg(theme().highlightDark)
                                  : c.bg(theme().highlight),
                                isJustIndicator() && c.round,
                                c.absolute,
                                c.zIndex(4)
                              )}
                            />
                          </div>
                        </Show>
                        <Motion
                          animate={{
                            opacity: props.state.squareHighlightAnims[square],
                          }}
                          style={s(
                            c.displayNone,
                            c.bg(theme().highlight),
                            c.absolute,
                            c.size("100%"),
                            c.zIndex(4)
                          )}
                        ></Motion>
                        {isBottomEdge && !props.state.hideCoordinates && (
                          <CMText
                            style={s(
                              c.fg(
                                props.state.hideColors
                                  ? c.grays[80]
                                  : inverseColor
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
                        {isRightEdge && !props.state.hideCoordinates && (
                          <CMText
                            style={s(
                              c.fg(
                                props.state.hideColors
                                  ? c.grays[80]
                                  : inverseColor
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
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
  // console.timeEnd("chessboard");
  return x;
};
