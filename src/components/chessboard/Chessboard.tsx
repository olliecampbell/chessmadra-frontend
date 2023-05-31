import { Chess, PieceSymbol, SQUARES } from "@lubert/chess.ts";
import { getStatic } from "~/utils/assets";
import { s, c } from "~/utils/styles";
import { Move, Piece, Square } from "@lubert/chess.ts/dist/types";
import { ChessColor, COLUMNS, ROWS } from "~/types/Chess";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { getSquareOffset, START_EPD } from "../../utils/chess";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "../CMText";
import {
  cloneDeep,
  find,
  first,
  forEach,
  isEmpty,
  isEqual,
  isNil,
  last,
  range,
} from "lodash-es";
import { FadeInOut } from "../FadeInOut";
import { getAppState, quick } from "~/utils/app_state";
import {
  BoardTheme,
  BOARD_THEMES_BY_ID,
  CombinedTheme,
  combinedThemes,
  COMBINED_THEMES_BY_ID,
  PieceSetId,
} from "~/utils/theming";
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import { Motion } from "@motionone/solid";
import { times } from "~/utils/times";
import { createElementBounds, NullableBounds } from "@solid-primitives/bounds";
import { destructure } from "@solid-primitives/destructure";
import { createStore, produce, Store, unwrap } from "solid-js/store";
import {
  ChessboardInterface,
  ChessboardViewState,
} from "~/utils/chessboard_interface";
import anime from "animejs";
import { createChessProxy } from "~/utils/chess_proxy";
import { pgnToLine, toSide } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";

export const EMPTY_DRAG = {
  square: null,
  enoughToDrag: false,
  x: 0,
  y: 0,
  transform: { x: 0, y: 0 },
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
let hasAnimateStarted = false;
export function ChessboardView(props: {
  chessboardInterface: ChessboardInterface;
  shadow?: boolean;
  disableDrag?: boolean;
  onSquarePress?: any;
  styles?: any;
  ref?: (_: HTMLElement) => void;
}) {
  const chessboardStore = createMemo(() =>
    props.chessboardInterface.get((s) => s)
  );
  let preview = true;
  // testing preview move
  const availableMoves = () => chessboardStore().availableMoves;

  const pos = () =>
    chessboardStore()._animatePosition ?? chessboardStore().position;
  hasAnimateStarted = false;

  // onMount(() => {
  //   setTimeout(() => {
  //     hasAnimateStarted = true;
  //     props.state.playPgn("1.e4 e5 2.f4 exf4", {
  //       animateLine: pgnToLine("1.e4 e5 2.f4 exf4"),
  //       animated: true,
  //       fromEpd: START_EPD,
  //     });
  //   }, 1000);
  // });
  // const interval = setInterval(() => {
  //   if (preview) {
  //     props.state.playPgn("1.e4 e5 2.f4 exf4", {
  //       animateLine: pgnToLine("1.e4 e5 2.f4 exf4"),
  //       animated: true,
  //       fromEpd: START_EPD,
  //     });
  //   } else {
  //     props.state.resetPosition();
  //   }
  //   preview = !preview;
  // }, 6000);
  // onCleanup(() => {
  //   clearInterval(interval);
  // });
  const drag = () => chessboardStore().drag;
  // const position = () => props.state._animatePosition ?? props.state.position;
  const userState = getAppState().userState;
  const user = () => userState.user;
  const combinedTheme: Accessor<CombinedTheme> = createMemo(
    () =>
      find(combinedThemes, (theme) => theme.boardTheme == user()?.theme) ||
      COMBINED_THEMES_BY_ID["default"]
  );
  createEffect(() => {
    console.log("user theme", user()?.theme);
    console.log("combined theme", combinedTheme());
  });
  const theme: Accessor<BoardTheme> = () =>
    BOARD_THEMES_BY_ID[combinedTheme().boardTheme];
  const pieceSet: Accessor<BoardTheme> = () => combinedTheme().pieceSet;
  const colors = () => [theme().light.color, theme().dark.color];
  const flipped = createMemo(() => !!chessboardStore().flipped);
  const boardImage = () => theme().boardImage;
  const getSquareFromLayoutAndGesture = (
    chessboardLayout,
    gesture: XY
  ): [Square, number, number] => {
    const columnPercent = gesture.x / chessboardLayout.width;
    const rowPercent = gesture.y / chessboardLayout.height;
    let row = Math.min(7, Math.max(0, Math.floor(rowPercent * 8)));
    let column = Math.min(7, Math.max(0, Math.floor(columnPercent * 8)));
    let square = `${COLUMNS[column]}${ROWS[7 - row]}`;
    if (flipped()) {
      square = `${COLUMNS[7 - column]}${ROWS[row]}`;
    }
    // @ts-ignore
    return [
      square,
      (column + 0.5) * (chessboardLayout.width / 8),
      (row + 0.5) * (chessboardLayout.height / 8),
    ];
  };
  const refs: ChessboardViewState["refs"] = { ringRef: null, pieceRefs: {} };
  createEffect(() => {
    props.chessboardInterface.set((s) => {
      s.refs = refs;
    });
  });

  const hiddenColorsBorder = `1px solid ${c.grays[70]}`;
  // const pan: Accessor<{ square: Square | null } & XY> = createSignal({
  //   square: null,
  // });
  const [tapAction, setTapAction] = createSignal(null as (() => void) | null);
  let tapSelectedSquare = false;
  const [chessboardContainerRef, setChessboardContainerRef] =
    createSignal(null);
  const chessboardLayout = createElementBounds(chessboardContainerRef, {
    trackMutation: false,
  });
  const [didImmediatelyTap, setDidImmediatelyTap] = createSignal(false);
  const position = () =>
    chessboardStore().futurePosition ?? chessboardStore().position;
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
  const frozen = () => chessboardStore().frozen;
  const onMouseDown = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;
    if (!!("ontouchstart" in window) && evt.type == "mousedown") return;
    console.log("mouse down", evt);

    const tap = getTapOffset(evt, chessboardLayout);
    const [square, centerX, centerY] = getSquareFromLayoutAndGesture(
      chessboardLayout,
      tap
    );
    const piece = position().get(square);
    console.log("----", drag().square, square, piece);
    let availableMove = find(
      chessboardStore().availableMoves,
      (m) => m.to == square
    );
    if (availableMove) {
      console.log("there was an available move", availableMove);
      props.chessboardInterface.requestToMakeMove(availableMove as Move, {
        animate: true,
      });
      setTapAction(() => () => {
        console.log("doing nothing because made move on mouse down");
      });
    } else if (chessboardStore().activeFromSquare == square || !piece) {
      console.log(
        "should clear if tap, active square is",
        chessboardStore().activeFromSquare
      );
      setTapAction(() => () => {
        console.log("clear pending because this was the active from square");
        props.chessboardInterface.clearPending();
      });
    } else {
      setTapAction(() => () => {
        console.log("this tap does nothing");
      });
    }
    window.setTimeout(() => {
      setTapAction(null);
    }, 200);
    const turn = props.chessboardInterface.getTurn();
    if (!piece?.color || toSide(piece.color) !== turn) {
      return;
    }
    props.chessboardInterface.set((store) => {
      const drag = store.drag;
      console.log("evt", evt);
      drag.touch = "TouchEvent" in window && evt instanceof TouchEvent;
      console.log("is touch?" + drag.touch);
      drag.square = square;
      drag.enoughToDrag = false;
      drag.x = tap.x;
      drag.y = tap.y;
      drag.transform = {
        x: tap.x - centerX,
        y: tap.y - centerY,
      };
      store.activeFromSquare = square;
      store.availableMoves = position().moves({
        square: square,
        verbose: true,
      });
      if (store.availableMoves.length > 0) {
        tapSelectedSquare = true;
      } else {
        tapSelectedSquare = false;
      }
    });
  };
  createEffect(() => {
    // console.log("availableMoves", logProxy(availableMoves()));
  });
  // interaction/mouse stuff
  const onMouseOut = (evt: MouseEvent | TouchEvent) => {
    props.chessboardInterface.set((store) => {
      store.drag = cloneDeep(EMPTY_DRAG);
      store.draggedOverSquare = undefined;
    });
  };
  const onMouseMove = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;
    evt.preventDefault();
    // console.log("mouse move", evt);
    // if (evt.target != chessboardContainerRef()) return;

    if (!drag().square) {
      return;
    }
    props.chessboardInterface.set((s) => {
      let newDrag = {
        square: drag().square,
        enoughToDrag: drag().enoughToDrag,
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
      if (!newDrag.enoughToDrag) {
        const distance = Math.sqrt(
          Math.pow(newDrag.transform.x, 2) + Math.pow(newDrag.transform.y, 2)
        );
        newDrag.enoughToDrag = distance > 5;
      }
      s.drag = newDrag;
    });
  };
  const onMouseUp = (evt: MouseEvent | TouchEvent) => {
    if (frozen()) return;

    evt.preventDefault();
    const [newSquare] = getSquareFromLayoutAndGesture(chessboardLayout, drag());
    if (newSquare === drag().square && tapAction()) {
      tapAction()?.();
    } else {
      let availableMove = find(
        chessboardStore().availableMoves,
        (m) => m.to == newSquare
      );
      if (availableMove) {
        props.chessboardInterface.requestToMakeMove(availableMove as Move);
      } else {
        props.chessboardInterface.clearPending();
      }
    }
    props.chessboardInterface.set((s) => {
      s.drag = cloneDeep(EMPTY_DRAG);
    });
  };

  const isMobile = useIsMobile();
  const themeStyles = (light: boolean) =>
    light ? theme().light.styles : theme().dark.styles;
  const x = (
    <>
      <div
        ref={props.ref}
        class={clsx(`relative h-0 w-full touch-none select-none pb-[100%]`)}
        style={s(
          c.pb("100%"),
          c.relative,
          c.height(0),
          c.width("100%"),
          props.styles,
          props.shadow && c.cardShadow,
          {
            "-webkit-touch-callout": "none",
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
            c.brt(2)
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
            open={() => !!chessboardStore().showPlans}
          >
            <For each={chessboardStore().plans}>
              {(metaPlan, i) => {
                const { plan } = metaPlan;
                const {
                  focused,
                  opacity,
                  length,
                  color,
                  from,
                  to,
                  xDiff,
                  yDiff,
                  duration,
                  toSquareCenterX,
                  toSquareCenterY,
                  angle,
                  angleDeg,
                } = destructure(() => {
                  const from = getSquareOffset(plan.fromSquare, flipped());
                  const to = getSquareOffset(plan.toSquare, flipped());
                  const dx = Math.abs(from.x - to.x);
                  const dy = Math.abs(from.y - to.y);
                  const length =
                    Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) -
                    (1 / 8) * 0.1;
                  const angle = Math.atan2(to.y - from.y, to.x - from.x);
                  const angleDeg = (angle * 180) / Math.PI;
                  let color = metaPlan.mine ? c.arrowColors[55] : c.grays[35];
                  let gradientColor = c.grays[100];
                  let focused = false;
                  let opacity = 80;
                  if (!metaPlan.mine) {
                    opacity = 50;
                  }
                  if (chessboardStore().focusedPlans?.includes(metaPlan.id)) {
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
                  return {
                    focused,
                    opacity,
                    from,
                    to,
                    color,
                    x1,
                    y1,
                    x2,
                    y2,
                    xDiff,
                    yDiff,
                    duration,
                    length,
                    toSquareCenterX,
                    toSquareCenterY,
                    angle,
                    angleDeg,
                  };
                });

                return (
                  <div
                    style={s(
                      c.absoluteFull,
                      c.noPointerEvents,
                      c.zIndex(focused() ? 101 : 100),
                      c.opacity(opacity())
                    )}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 1 1">
                      <line
                        // stroke={`url(#${`plan-line-gradient-${i}`})`}
                        stroke={color()}
                        stroke-width={1.4 / 100}
                        stroke-linecap="round"
                        x1={from().x + 1 / 8 / 2}
                        y1={from().y + 1 / 8 / 2}
                        x2={from().x + 1 / 8 / 2 + length() * Math.cos(angle())}
                        y2={from().y + 1 / 8 / 2 + length() * Math.sin(angle())}
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={(1 / 8) * 0.04}
                        fill={color()}
                        stroke={color()}
                        transform={`rotate(${
                          angleDeg() - 90
                        } ${toSquareCenterX()} ${toSquareCenterY()})`}
                        d={`M ${toSquareCenterX() - 2 / 100},${
                          toSquareCenterY() - 2.8 / 100
                        } ${toSquareCenterX()},${toSquareCenterY() - 0.004} ${
                          toSquareCenterX() + 2 / 100
                        },${toSquareCenterY() - 2.8 / 100} Z`}
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
          <div
            style={s(
              c.size("calc(1/8 * 100%)"),
              c.noPointerEvents,
              c.zIndex(5),
              c.absolute,
              c.center,
              c.opacity(0)
            )}
            ref={(x) => {
              refs.visualizationDotRef = x;
            }}
          >
            <div
              class={clsx(
                chessboardStore().visualizedMove?.color === "w"
                  ? "bg-gray-98"
                  : "bg-gray-4",
                "opacity-70"
              )}
              style={s(
                c.size("50%"),
                c.round,
                c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
              )}
            ></div>
          </div>
          <div
            id={"ring-indicator"}
            ref={(x) => {
              refs.ringRef = x;
            }}
            class={clsx("opacity-0 shadow-white")}
            style={s(
              c.absolute,
              c.fullWidth,
              c.shadow(0, 0, 0, 4, "var(--shadow-color)"),
              c.fullHeight,
              c.zIndex(3),
              c.keyedProp("--shadow-color")(chessboardStore().ringColor),
              c.noPointerEvents
            )}
          ></div>
          <For each={Object.keys(SQUARES)}>
            {(square) => {
              let debug = "e2";
              // createEffect(() => {
              //   if (square === debug) {
              //     console.log("piece", piece(), pos().ascii());
              //   }
              // });

              const dragging = createMemo(() => {
                return drag().square === square;
              });
              const piece = createMemo(() => {
                if (dragging()) {
                  // this is terrible that these mean different things, pos vs position
                  return position().get(square);
                } else {
                  return pos().get(square);
                }
              });
              const animatedProps = () => {
                // track
                pos();
                let posStyles = s(
                  c.top(`${getSquareOffset(square, flipped()).y * 100}%`),
                  c.left(`${getSquareOffset(square, flipped()).x * 100}%`)
                );
                let animated = false;
                if (dragging() && drag().enoughToDrag) {
                  posStyles = s(posStyles, {
                    translate: `${drag().transform.x}px ${
                      drag().transform.y
                    }px`,
                    scale: drag().touch && "2.0",
                    transition: "scale 0.2s",
                  });
                }

                return { animated, posStyles };
              };
              const { animated, posStyles } = destructure(animatedProps);
              const hiddenBecauseTake = createMemo(
                () =>
                  chessboardStore().previewedMove?.to === square &&
                  chessboardStore().previewedMove?.color !== piece()?.color
              );

              const priority = () =>
                chessboardStore().activeFromSquare === square ||
                chessboardStore().drag.square === square ||
                chessboardStore().animatingMoveSquare === square;
              const containerViewStyles = () => {
                pos();
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
                      props.chessboardInterface.set((s) => {
                        refs.pieceRefs[square] = v;
                      });
                    }}
                  >
                    <div style={s(c.fullWidth, c.fullHeight)}>
                      <Show when={piece() && !hiddenBecauseTake()}>
                        <PieceView piece={piece()} pieceSet={pieceSet()} />
                      </Show>
                    </div>
                  </div>
                </>
              );
            }}
          </For>
          <Show when={boardImage()}>
            <img
              src={boardImage()}
              class={clsx("absolute left-0 top-0 z-0 h-full w-full")}
            />
          </Show>
          <div
            style={s(c.column, c.fullWidth, c.fullHeight, c.noPointerEvents)}
            class={clsx("")}
          >
            <For each={range(8)}>
              {(i) => (
                <div
                  style={s(c.fullWidth, c.row, c.grow, c.flexible, c.relative)}
                >
                  <For each={range(8)}>
                    {(j) => {
                      const debugSquare = "e4";
                      const light = (i + j) % 2 == 0;
                      const [color, inverseColor] = destructure(() =>
                        light ? colors() : [colors()[1], colors()[0]]
                      );
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
                      type HighlightType = readonly [
                        "indicator" | "full" | null,
                        "last" | "next" | null
                      ];
                      const isDraggedOverSquare = createMemo(
                        () => chessboardStore().draggedOverSquare == square()
                      );
                      let availableMove = createMemo(
                        () =>
                          availableMoves().find((m) => m.to == square()) !==
                          undefined
                      );
                      const highlight = createMemo(() => {
                        if (isDraggedOverSquare()) {
                          return { type: "full", color: "next" };
                        }
                        let hasPiece = position().get(square()) != null;
                        if (availableMove()) {
                          if (hasPiece) {
                            return { type: "indicator", color: "next" };
                          }
                          return { type: "indicator", color: "next" };
                        }
                        const isLastMoveSquare =
                          props.chessboardInterface.getLastMove()?.to ==
                            square() ||
                          props.chessboardInterface.getLastMove()?.from ==
                            square();
                        if (isLastMoveSquare) {
                          return { type: "full", color: "last" };
                        }
                        const isPreviewSquare =
                          chessboardStore().previewedMove?.to === square() ||
                          chessboardStore().previewedMove?.from === square();
                        if (isPreviewSquare) {
                          return { type: "full", color: "next" };
                        }

                        return { type: null, color: null };
                      });
                      const isBottomEdge = i == 7;
                      const isRightEdge = j == 7;

                      return (
                        <div
                          style={s(
                            c.keyedProp("touch-action")("none"),
                            !boardImage() && c.bg(color()),
                            themeStyles(light),
                            c.center,
                            !frozen() && c.clickable,
                            c.flexible,
                            c.relative
                          )}
                        >
                          <div
                            class="absolute inset-0 grid place-items-center rounded-full"
                            style={s(
                              c.zIndex(
                                highlight().type === "indicator" ? 11 : 1
                              )
                            )}
                          >
                            <div
                              class={`h-1/3 w-1/3 rounded-full transition-opacity duration-300 ${
                                highlight().type === "indicator"
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                              id={`indicator-${square()}`}
                              style={s(
                                c.bg(theme().highlightNextMove),
                                c.absolute,
                                c.zIndex(6)
                              )}
                            />
                          </div>
                          <div
                            class={`absolute bottom-0 left-0 right-0 top-0 h-full w-full transition-opacity ${
                              highlight().type === "full"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                            id={`highlight-${square()}`}
                            style={s(
                              c.bg(
                                highlight().color === "last"
                                  ? theme().highlightLastMove
                                  : theme().highlightNextMove
                              ),
                              c.absolute,
                              c.zIndex(1)
                            )}
                          />
                          {isBottomEdge &&
                            !chessboardStore().hideCoordinates && (
                              <CMText
                                style={s(
                                  c.fg(inverseColor()),
                                  c.weightSemiBold,
                                  c.absolute,
                                  c.fontSize(isMobile ? 8 : 8),
                                  c.left(isMobile ? 1 : 1),
                                  c.bottom(isMobile ? 1 : 0),
                                  c.opacity(80)
                                )}
                              >
                                {tileLetter}
                              </CMText>
                            )}
                          {isRightEdge &&
                            !chessboardStore().hideCoordinates && (
                              <CMText
                                style={s(
                                  c.fg(inverseColor()),
                                  c.weightBold,
                                  c.absolute,
                                  c.fontSize(8),
                                  c.right(2),
                                  c.opacity(80),
                                  c.top(0)
                                )}
                              >
                                {tileNumber}
                              </CMText>
                            )}
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </>
  );
  // console.timeEnd("chessboard");
  return x;
}
