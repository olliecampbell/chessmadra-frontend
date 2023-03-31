import { Chess, PieceSymbol, SQUARES } from "@lubert/chess.ts";
import { getStatic } from "~/utils/assets";
import { s, c } from "~/utils/styles";
import { Move, Piece, Square } from "@lubert/chess.ts/dist/types";
import { ChessColor, COLUMNS, ROWS } from "~/types/Chess";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { getSquareOffset } from "../../utils/chess";
import { ChessboardState } from "~/utils/chessboard_state";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "../CMText";
import { first, forEach, isEmpty, isEqual, isNil, map, take } from "lodash-es";
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
  onCleanup,
  onMount,
  Show,
  splitProps,
} from "solid-js";
import { Motion } from "@motionone/solid";
import { times } from "~/utils/times";
import {
  Bounds,
  createElementBounds,
  NullableBounds,
} from "@solid-primitives/bounds";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { destructure } from "@solid-primitives/destructure";
import { logProxy } from "~/utils/state";
import { kill } from "process";
import { createStore, produce, SetStoreFunction, Store } from "solid-js/store";
import {
  ChessboardInterface,
  ChessboardViewState,
} from "~/utils/chessboard_interface";
import anime from "animejs";
import { createChessProxy } from "~/utils/chess_proxy";

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
  let preview = true;
  // testing preview move
  const [chessboardStore, chessboardInterface, setChessboardStore] =
    createChessboardInterface(() => props.state);
  const availableMoves = () => chessboardStore.availableMoves;

  // const interval = setInterval(() => {
  //   if (preview) {
  //     chessboardInterface.previewMove("e4");
  //     setTimeout(() => {
  //       chessboardInterface.previewMove(null);
  //       chessboardInterface.previewMove("d4");
  //     }, 300);
  //   } else {
  //     // clearInterval(interval);
  //   }
  // }, 6000);
  // onCleanup(() => {
  //   clearInterval(interval);
  // });
  onMount(() => {
    props.state.quick((s) => {
      s.chessboardView = chessboardInterface;
    });
  });
  const drag = () => chessboardStore.drag;
  // const position = () => props.state._animatePosition ?? props.state.position;
  const userState = getAppState().userState;
  const user = () => userState.user;
  const theme: Accessor<BoardTheme> = () =>
    BOARD_THEMES_BY_ID[user()?.theme] ?? BOARD_THEMES_BY_ID["lichess-brown"];
  const colors = () => [theme().light.color, theme().dark.color];
  const flipped = createMemo(() => !!props.state.flipped);
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
  const onMouseDown = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;
    const tap = getTapOffset(evt, chessboardLayout);
    const [square, centerX, centerY] = getSquareFromLayoutAndGesture(
      chessboardLayout,
      tap
    );
    console.log("got square", square);
    setChessboardStore((store) => {
      const drag = store.drag;
      drag.square = square;
      drag.x = tap.x;
      drag.y = tap.y;
      drag.transform = {
        x: tap.x - centerX,
        y: tap.y - centerY,
      };
      store.availableMoves = store.position.moves({
        square: square,
        verbose: true,
      });
      chessboardInterface.highlightSquares(
        store.availableMoves.map((m) => m.to as Square)
      );
    });

    setIsTap(true);
    setTapTimeout(
      window.setTimeout(() => {
        setIsTap(false);
      }, 100)
    );
  };
  createEffect(() => {
    console.log("availableMoves", logProxy(availableMoves()));
  });
  const onMouseOut = (evt: MouseEvent | TouchEvent) => {
    setChessboardStore((store) => {
      store.drag = {
        square: null,
        x: 0,
        y: 0,
        transform: { x: 0, y: 0 },
      };
      store.draggedOverSquare = undefined;
      store.activeFromSquare = undefined;
    });
  };
  const onMouseMove = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;
    // if (evt.target != chessboardContainerRef()) return;

    if (!drag().square) {
      return;
    }
    setChessboardStore((s) => {
      let newDrag = {
        square: drag().square,
        x: 0,
        y: 0,
        transform: { x: 0, y: 0 },
      };
      let tap = getTapOffset(evt, chessboardLayout);
      const [newSquare] = getSquareFromLayoutAndGesture(chessboardLayout, tap);
      if (newSquare !== s.draggedOverSquare) {
        let isOverMovableSquare = s.availableMoves.find(
          (m) => m.to == newSquare
        );
        if (isOverMovableSquare) {
          s.draggedOverSquare = newSquare;
        } else {
          s.draggedOverSquare = undefined;
        }
      }
      forEach(["x", "y"] as ("x" | "y")[], (key) => {
        let prev = drag()[key];

        const curr = tap[key];
        let delta = curr - prev;
        newDrag[key] = curr;
        newDrag.transform[key] = drag().transform[key] + delta;
      });
      s.drag = newDrag;
    });
  };
  const onMouseUp = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;
    const [newSquare] = getSquareFromLayoutAndGesture(chessboardLayout, drag());

    if (isTap()) {
      // props.state.onSquarePress(drag().square, false);
      // if (stateRef.current.activeFromSquare) {
      // }
    } else {
      chessboardInterface.onSquarePress(newSquare, true);
    }
    setChessboardStore((s) => {
      s.drag = {
        square: null,
        x: 0,
        y: 0,
        transform: { x: 0, y: 0 },
      };
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
          c.keyedProp("touch-action")("none"),
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
              c.opacity(moveIndicatorOpacityAnim)
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
              let debug = "e2";
              const pos = () => chessboardStore.position;
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
                // track
                pos();
                let posStyles = s(
                  c.top(`${getSquareOffset(square, flipped()).y * 100}%`),
                  c.left(`${getSquareOffset(square, flipped()).x * 100}%`)
                );
                let animated = false;
                if (dragging()) {
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
              const containerViewStyles = () => {
                return s(
                  c.absolute,
                  posStyles(),
                  c.zIndex(priority() ? 11 : 2),
                  c.size("12.5%"),
                  c.noPointerEvents
                );
              };
              return (
                <>
                  <div
                    style={s(containerViewStyles(), c.noPointerEvents)}
                    id={`piece-${square}`}
                    ref={(v) => {
                      setChessboardStore((s) => {
                        console.log("setting piece refs");
                        s.pieceRefs[square] = v;
                      });
                    }}
                  >
                    <div style={s(c.fullWidth, c.fullHeight)}>
                      <Show when={piece() && !hiddenBecauseTake()}>
                        <PieceView
                          piece={piece()}
                          pieceSet={user()?.pieceSet ?? "cburnett"}
                        />
                      </Show>
                    </div>
                  </div>
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
                    const isFromSquare = () =>
                      chessboardStore.activeFromSquare === square();
                    const isDraggedOverSquare = () =>
                      chessboardStore.draggedOverSquare == square();
                    const isJustIndicator = () =>
                      availableMove() &&
                      !isDraggedOverSquare() &&
                      !isFromSquare();
                    const isAvailableMoveIndicator = () =>
                      availableMove() && isJustIndicator();
                    const isPreviewSquare = () =>
                      chessboardStore.previewedMove?.to === square() ||
                      chessboardStore.previewedMove?.from === square();
                    const isLastMoveSquare = createMemo(
                      () =>
                        props.state.getLastMove()?.to == square() ||
                        props.state.getLastMove()?.from == square()
                    );

                    const isBottomEdge = i == 7;
                    const isRightEdge = j == 7;
                    return (
                      <div
                        style={s(
                          c.keyedProp("touch-action")("none"),
                          c.bg(color),
                          themeStyles(light),
                          c.center,
                          !frozen() && c.clickable,
                          c.flexible,
                          c.relative
                        )}
                      >
                        <div
                          class="absolute inset-0 place-items-center rounded-full"
                          style={s(c.zIndex(1))}
                        >
                          <div
                            class={`transition-opacity w-1/3 h-1/3 rounded-full ${
                              isJustIndicator() ? "opacity-100" : "opacity-0"
                            }`}
                            id={`indicator-${square()}`}
                            classList={{
                              hidden: !isJustIndicator(),
                            }}
                            style={s(
                              c.bg(theme().highlightDark),
                              c.absolute,
                              c.zIndex(1)
                            )}
                          />
                        </div>
                        <div
                          class={`transition-opacity absolute top-0 left-0 bottom-0 right-0 w-full h-full ${
                            isFromSquare() ||
                            isDraggedOverSquare() ||
                            isLastMoveSquare() ||
                            isPreviewSquare()
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                          id={`highlight-${square()}`}
                          style={s(
                            c.bg(theme().highlight),
                            c.absolute,
                            c.zIndex(1)
                          )}
                        />
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

const createChessboardInterface = (
  state: Accessor<ChessboardState>
): [
  Store<ChessboardViewState>,
  ChessboardInterface,
  (s: (s: ChessboardViewState) => void) => void
] => {
  const flipped = () => false;
  const frozen = () => false;
  const [chessboardStore, setChessboardStore] =
    createStore<ChessboardViewState>({
      pieceRefs: {},
      position: createChessProxy(new Chess()),
      currentHighlightedSquares: new Set(),
      squareHighlightRefs: {},
      moveIndicatorRef: null,
      availableMoves: [],
      drag: {
        square: null,
        x: 0,
        y: 0,
        transform: { x: 0, y: 0 },
      },
    });
  let pendingState: ChessboardViewState | null = null;
  const set = <T,>(s: (s: ChessboardViewState) => T) => {
    if (pendingState) {
      return s(pendingState);
    } else {
      let res = null;
      setChessboardStore(
        produce((state: ChessboardViewState) => {
          pendingState = state;
          try {
            res = s(state as ChessboardViewState);
          } finally {
            pendingState = null;
          }
        })
      );
      return res;
    }
  };

  const chessboardInterface: ChessboardInterface = {
    makeMove: (m: Move) => {
      set((s) => {
        s.position.move(m);
        console.log(s.position);
        chessboardInterface.clearPending();
        console.log("after setting");
      });
    },
    reversePreviewMove: () => {
      set((s: ChessboardViewState) => {
        if (!s.previewedMove) {
          return;
        }
        s.previewPosition = undefined;
        s.isReversingPreviewMove = true;
        // chessboardInterface.clearHighlightedSquares();
        const [start, end]: { x: number; y: number }[] = [
          getSquareOffset(s.previewedMove.to, flipped()),
          getSquareOffset(s.previewedMove.from, flipped()),
        ];
        const duration = getAnimationTime(start, end);
        const pieceRef = s.pieceRefs[s.previewedMove.from as Square];
        const top = `${end.y * 100}%`;
        const left = `${end.x * 100}%`;
        const timeline = anime.timeline({
          easing: "easeInOutSine",
          duration: duration,
        });
        timeline.add({
          targets: pieceRef,
          top,
          left,
        });
        const supplementaryMove = getSupplementaryMove(s.previewedMove);
        if (supplementaryMove) {
          const end = getSquareOffset(supplementaryMove.to, flipped());
          const top = `${end.y * 100}%`;
          const left = `${end.x * 100}%`;
          const pieceRef = s.pieceRefs[supplementaryMove.from as Square];
          timeline.add({
            targets: pieceRef,
            easing: "easeInOutSine",
            duration: duration,
            top,
            left,
          });
        }
        timeline.play();
        timeline.finished.then(() => {
          set((s) => {
            s.previewedMove = undefined;
            s.isReversingPreviewMove = false;
            chessboardInterface.stepPreviewMove();
          });
        });
        // s.previewPieceMoveAnim.setValue(start);
        // Animated.sequence([
        //   Animated.timing(s.previewPieceMoveAnim, {
        //     toValue: end,
        //     duration,
        //     useNativeDriver: true,
        //     easing: Easing.out(Easing.ease),
        //   }),
        // ]).start(({ finished }) => {
        //   set((s) => {
        //     s.previewedMove = null;
        //     s.isReversingPreviewMove = false;
        //     s.stepPreviewMove();
        //   });
        // });
      });
    },
    stepAnimationQueue: () => {
      set((s: ChessboardViewState) => {
        if (!isEmpty(s.currentHighlightedSquares)) {
          chessboardInterface.clearHighlightedSquares();
        }
        if (isEmpty(s.animationQueue)) {
          s._animatePosition = null;
        }
        if (isNil(s._animatePosition)) {
          return;
        }
        let nextMove = s.animationQueue.shift();
        s.animatePieceMove(nextMove, PlaybackSpeed.Fast, (completed) => {
          if (completed) {
            set((s) => {
              s.stepAnimationQueue();
            });
          }
        });
      });
    },
    stepPreviewMove: () => {
      set((s: ChessboardViewState) => {
        console.log("steppreviewmove");
        if (s.isReversingPreviewMove || s.isAnimatingPreviewMove) {
          console.log("steppreviewmove2");
          return;
        }
        if (
          s.previewedMove &&
          s.nextPreviewMove &&
          !isEqual(s.previewedMove, s.nextPreviewMove)
        ) {
          console.log("steppreviewmove4");
          chessboardInterface.reversePreviewMove();
        }
        if (s.previewedMove && !s.nextPreviewMove) {
          console.log("steppreviewmove5");
          chessboardInterface.reversePreviewMove();
        }
        if (!s.previewedMove && s.nextPreviewMove) {
          console.log("steppreviewmove6");
          chessboardInterface.animatePreviewMove();
        }
      });
    },
    animatePreviewMove: () => {
      set((s: ChessboardViewState) => {
        if (!s.nextPreviewMove) {
          return;
        }
        const move = s.nextPreviewMove;
        s.previewPosition = s.position.clone();
        s.previewPosition.move(s.nextPreviewMove);
        // s.nextPreviewMove = null;
        s.previewedMove = s.nextPreviewMove;
        s.isAnimatingPreviewMove = true;
        s.previewedMove = move;
        // chessboardInterface.clearHighlightedSquares();
        s.availableMoves = [];
        s.activeFromSquare = undefined;
        s.draggedOverSquare = undefined;
        // s.makeMove(move);
        const [start, end]: { x: number; y: number }[] = [
          getSquareOffset(move.from, flipped()),
          getSquareOffset(move.to, flipped()),
        ];
        const duration = getAnimationTime(start, end);
        const pieceRef = s.pieceRefs[move.from as Square];
        const top = `${end.y * 100}%`;
        const left = `${end.x * 100}%`;
        let timeline = anime.timeline({
          easing: "easeInOutSine",
          duration: duration,
        });
        timeline = timeline.add({
          targets: pieceRef,
          top,
          left,
        });
        const supplementaryMove = getSupplementaryMove(move);
        if (supplementaryMove) {
          const end = getSquareOffset(supplementaryMove.to, flipped());
          const top = `${end.y * 100}%`;
          const left = `${end.x * 100}%`;
          timeline.add(
            {
              targets: pieceRef,
              easing: "easeInOutSine",
              duration: duration,
              top,
              left,
            },
            0
          );
        }
        timeline.play();
        timeline.finished.then(() => {
          set((s) => {
            s.isAnimatingPreviewMove = false;
            chessboardInterface.stepPreviewMove();
          });
        });
        chessboardInterface.highlightMoveSquares(move, duration);
      });
    },
    clearPending: () => {
      set((s: ChessboardViewState) => {
        s.availableMoves = [];
        s.drag = {
          square: null,

          x: 0,
          y: 0,
          transform: { x: 0, y: 0 },
        };
        s.previewPosition = undefined;
        s.nextPreviewMove = undefined;
        s.previewedMove = undefined;
      });
    },
    animatePieceMove: (
      move: Move,
      speed: PlaybackSpeed,
      callback: (completed: boolean) => void
    ) => {
      set((s: ChessboardViewState) => {
        chessboardInterface.clearPending();
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        // @ts-ignore
        let [start, end]: Square[] = [move.from, move.to];
        let { x, y } = getSquareOffset(start, flipped());
        callback(true);
        // Animated.sequence([
        //   Animated.timing(s.pieceMoveAnim, {
        //     toValue: getSquareOffset(end, s.flipped),
        //     duration: moveDuration,
        //     useNativeDriver: true,
        //     easing: Easing.inOut(Easing.ease),
        //   }),
        // ]).start(() => {
        //   set((s) => {
        //     s.animatedMove = null;
        //
        //     callback(true);
        //   });
        // });
      });
    },
    onSquarePress: (square: Square, skipAnimation: boolean) => {
      set((s) => {
        const availableMove = s.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          s.availableMoves = [];
          s.activeFromSquare = undefined;
          s.draggedOverSquare = undefined;
          state().makeMove(availableMove);
        }
      });
    },
    availableMovesFrom: (square: Square) => {
      return set((s) => {
        const position = s.position;
        const moves = position?.moves({
          square,
          verbose: true,
        });
        if (
          !isEmpty(s.availableMoves) &&
          first(s.availableMoves).from == square
        ) {
          return [];
        } else if (!frozen()) {
          return moves;
        }
      });
    },
    highlightSquares: (squares: Square[]) => {
      set((s) => {
        const refs = squares.map((sq) => s.squareHighlightRefs[sq as Square]);
        squares.forEach((sq) => {
          s.currentHighlightedSquares.add(sq);
        });
        // anime({
        //   targets: refs,
        //   easing: "easeInOutSine",
        //   duration: 150,
        //   top: top,
        //   opacity: 1.0,
        // });
      });
    },
    highlightMoveSquares: (move: Move) =>
      set((s) => {
        let highlightSquares = getHighlightSquares(move);
        chessboardInterface.highlightSquares(highlightSquares);
      }),
    backOne: () => {
      set((s) => {
        console.log("back one");
        // chessboardInterface.clearPending();
        s.position.undo();
        console.log("new position", s.position.ascii());
      });
    },
    resetPosition: () => {
      set((s) => {
        // s.previewPosition = null;
        // chessboardInterface.clearHighlightedSquares();
        s.animationQueue = [];
      });
    },
    visualizeMove: (move: Move, speed: PlaybackSpeed, callback: () => void) => {
      set((s) => {
        const { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        s.indicatorColor =
          move.color == "b" ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80);
        const backwards = false;
        // @ts-ignore
        const [start, end]: Square[] = backwards
          ? [move.to, move.from]
          : [move.from, move.to];
        s.moveIndicatorAnim.setValue(getSquareOffset(start, s.flipped));
        Animated.sequence([
          Animated.timing(s.moveIndicatorOpacityAnim, {
            toValue: 1.0,
            duration: fadeDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(s.moveIndicatorAnim, {
            toValue: getSquareOffset(end, s.flipped),
            duration: moveDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(s.moveIndicatorOpacityAnim, {
            toValue: 0,
            duration: fadeDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start(callback);
      });
    },
    visualizeMoves: (
      moves: Move[],
      speed: PlaybackSpeed,
      callback: () => void
    ) => {
      set((s) => {
        if (s.isVisualizingMoves) {
          return;
        }
        s.isVisualizingMoves = true;
        let i = 0;
        const delay = getAnimationDurations(speed)[2];
        const animateNextMove = () => {
          set((s) => {
            const move = moves.shift();

            if (move && s.isVisualizingMoves) {
              s.visualizeMove(move, speed, () => {
                window.setTimeout(() => {
                  animateNextMove();
                }, delay);
              });
              i++;
            } else {
              s.isVisualizingMoves = false;
              callback?.();
              // cb?.()
            }
          });
        };
        animateNextMove();
      });
    },
    previewMove: (m: string | null | Move) => {
      set((s) => {
        if (m) {
          const [moveObject] = s.position.validateMoves([m]) ?? [];
          console.log("m", m, s.position.ascii(), moveObject);
          s.nextPreviewMove = moveObject;
          chessboardInterface.stepPreviewMove();
        } else {
          s.nextPreviewMove = undefined;
          chessboardInterface.stepPreviewMove();
        }
      });
    },
    flashRing: (success: boolean) => {
      set((state) => {
        const animDuration = 200;
        state.ringColor = success
          ? c.colors.successColor
          : c.colors.failureLight;
        Animated.sequence([
          Animated.timing(state.ringIndicatorAnim, {
            toValue: 1,
            duration: animDuration,
            useNativeDriver: false,
          }),

          Animated.timing(state.ringIndicatorAnim, {
            toValue: 0,
            duration: animDuration,
            useNativeDriver: false,
          }),
        ]).start((finished) => {
          // TODO: better way to do this
          set((s) => {
            s.ringIndicatorAnim.setValue(0);
          });
        });
      });
    },
    animatePgn: (fen: string, moves: Move[]) => {
      set((s) => {
        s._animatePosition = createChessProxy(new Chess(fen));
        const moves = s._animatePosition.validateMoves(options.animateLine);
        s.animationQueue = moves;
        s.stepAnimationQueue();
      });
    },
  };
  return [chessboardStore, chessboardInterface, set];
};

const getAnimationTime = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  let distance =
    Math.sqrt(
      Math.pow(Math.abs(end.x - start.x), 2) +
        Math.pow(Math.abs(end.y - start.y), 2)
    ) * 8;
  return getAnimationTimeForDistance(distance);
};

export const getAnimationTimeForDistance = (distance: number) => {
  return Math.log(distance + 6) * 80;
};

export const getHighlightSquares = (move: Move): Square[] => {
  if (move.san === "O-O" || move.san === "O-O-O") {
    return [];
  } else {
    return [move.to as Square, move.from as Square];
  }
};

export const getSupplementaryMove = (move: Move): Move => {
  if (move.san === "O-O" || move.san === "O-O-O") {
    return {
      to: "f1",
      from: "h1",
      piece: "r",
      color: "w",
      flags: "",
      san: "",
    };
  } else {
    return null;
  }
};
