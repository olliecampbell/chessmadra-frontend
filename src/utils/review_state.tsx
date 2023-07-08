import { Move, Square } from "@lubert/chess.ts/dist/types";
import {
  isEmpty,
  last,
  map,
  isNil,
  find,
  first,
  shuffle,
  values,
  some,
  filter,
  sortBy,
  take,
  cloneDeep,
  sum,
  noop,
} from "lodash-es";
import {
  lineToPgn,
  pgnToLine,
  RepertoireMove,
  SanPlus,
  Side,
  SIDES,
} from "./repertoire";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { RepertoireState } from "./repertoire_state";
import { trackEvent } from "~/utils/trackEvent";
import client from "~/utils/client";
import { START_EPD } from "./chess";
import { logProxy } from "./state";
import {
  ChessboardInterface,
  createChessboardInterface,
} from "./chessboard_interface";
import { PracticeComplete } from "~/components/PracticeComplete";
import { QuizMove } from "./queues";
import { isMoveDifficult } from "./srs";
import { COMMON_MOVES_CUTOFF } from "./review";

export interface ReviewPositionResults {
  side: Side;
  correct: boolean;
  epd: string;
  sanPlus: string;
}

type ReviewMoveKey = string;
type Epd = string;

export interface ReviewState {
  moveLog: string[];
  buildQueue: (options: ReviewOptions) => QuizMove[];
  stopReviewing: () => void;
  chessboard: ChessboardInterface;
  // getQueueLength: (side?: Side) => number;
  showNext?: boolean;
  allReviewPositionMoves: Record<
    Epd,
    Record<
      SanPlus,
      {
        sanPlus: string;
        epd: string;
        failed: boolean;
        side: Side;
        reviewed: boolean;
      }
    >
  >;
  failedReviewPositionMoves: Record<string, RepertoireMove>;
  reviewStats: ReviewStats;
  activeQueue: QuizMove[];
  activeOptions: ReviewOptions | null;
  currentMove?: QuizMove;
  reviewSide?: Side;
  completedReviewPositionMoves: Record<string, RepertoireMove>;
  reviewLine: (line: string[], side: Side) => void;
  giveUp: () => void;
  setupNextMove: (delay?: number) => void;
  startReview: (options: ReviewOptions) => void;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;
  updateQueue: (options: ReviewOptions) => void;
}

type Stack = [ReviewState, RepertoireState, AppState];
const EMPTY_QUEUES = { white: [], black: [] };
type ReviewStats = {
  due: number;
  correct: number;
  incorrect: number;
};

type ReviewFilter = "difficult-due" | "all" | "common" | "due";

interface ReviewOptions {
  side: Side | null;
  startPosition?: string;
  startLine?: string[];
  cram?: boolean;
  filter?: ReviewFilter;
  customQueue?: QuizMove[];
}

const FRESH_REVIEW_STATS = {
  due: 0,
  correct: 0,
  incorrect: 0,
} as ReviewStats;

export const getInitialReviewState = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _set: StateSetter<AppState, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) =>
      fn([s.repertoireState.reviewState, s.repertoireState, s])
    );
  };
  // const setOnly = <T,>(fn: (stack: ReviewState) => T, id?: string): T => {
  //   return _set((s) => fn(s.repertoireState.reviewState));
  // };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) =>
      fn([s.repertoireState.reviewState, s.repertoireState, s])
    );
  };
  const initialState = {
    moveLog: [],
    completedReviewPositionMoves: {},
    failedReviewPositionMoves: {},
    allReviewPositionMoves: {},
    // @ts-ignore
    chessboard: undefined as ChessboardInterface,
    reviewStats: cloneDeep(FRESH_REVIEW_STATS),
    showNext: false,
    // queues: EMPTY_QUEUES,
    activeQueue: [] as QuizMove[],
    activeOptions: null,
    markMovesReviewed: (results: ReviewPositionResults[]) => {
      trackEvent(`reviewing.reviewed_move`);
      set(([s, rs]) => {
        results.forEach((r, i) => {
          // @ts-ignore
          rs.repertoire[r.side].positionResponses[r.epd]?.forEach(
            (m: RepertoireMove) => {
              if (m.sanPlus === r.sanPlus && m.srs) {
                m.srs.needsReview = !r.correct;
              }
            }
          );
        });
      });
      client
        .post("/api/v1/openings/moves_reviewed", { results })
        .then(({ data: updatedSrss }) => {
          set(([s, rs]) => {
            results.forEach((r, i) => {
              // @ts-ignore
              rs.repertoire[r.side].positionResponses[r.epd].forEach(
                (m: RepertoireMove) => {
                  if (m.sanPlus === r.sanPlus) {
                    m.srs = updatedSrss[i];
                  }
                }
              );
            });
            // todo: this could be optimized in the future to only re-compute some stuff
            // rs.updateRepertoireStructures();
            // if (rs.browsingState.sidebarState.mode !== "review")
            //   rs.updateRepertoireStructures();
          });
        });
    },
    startReview: (options: ReviewOptions) =>
      set(([s, rs, gs]) => {
        s.reviewStats = cloneDeep(FRESH_REVIEW_STATS);
        rs.browsingState.moveSidebarState("right");
        rs.browsingState.sidebarState.mode = "review";
        // @ts-ignore
        rs.browsingState.sidebarState.activeSide = options.side;
        s.activeOptions = options ?? null;
        if (options.customQueue) {
          s.activeQueue = options.customQueue;
        } else {
          console.log("generating queue");
          s.updateQueue(options);
        }
        s.allReviewPositionMoves = {};
        s.activeQueue.forEach((m) => {
          m.moves.forEach((m) => {
            if (!s.allReviewPositionMoves[m.epd]) {
              s.allReviewPositionMoves[m.epd] = {};
            }
            s.allReviewPositionMoves[m.epd][m.sanPlus] = {
              epd: m.epd,
              sanPlus: m.sanPlus,
              side: m.side,
              failed: false,
              reviewed: false,
            };
          });
        });
        s.setupNextMove();
      }),
    setupNextMove: (delay) =>
      set(([s, rs]) => {
        s.chessboard.setFrozen(false);
        s.showNext = false;
        if (s.currentMove) {
          const failedMoves = values(s.failedReviewPositionMoves);
          if (!isEmpty(failedMoves)) {
            // let side = failedMoves[0].side;
            s.activeQueue.push({
              moves: failedMoves,
              line: s.currentMove.line,
              side: s.currentMove.side,
            });
          }
          s.markMovesReviewed(
            s.currentMove.moves.map((m) => {
              const failed = s.failedReviewPositionMoves[m.sanPlus];
              return {
                side: m.side,
                epd: m.epd,
                sanPlus: m.sanPlus,
                correct: !failed,
              };
            })
          );
        }
        s.currentMove = s.activeQueue.shift();
        if (!s.currentMove) {
          rs.updateRepertoireStructures();
          rs.browsingState.pushView(PracticeComplete);
          trackEvent(`review.review_complete`);
          return;
        }
        const currentMove = s.currentMove as QuizMove;
        const setup = () => {
          set(([s]) => {
            s.reviewSide = currentMove.side;
            s.failedReviewPositionMoves = {};
            s.completedReviewPositionMoves = {};
            s.chessboard.setPerspective(currentMove.moves[0].side);
            s.chessboard.resetPosition();
            s.chessboard.playPgn(currentMove.line);
            const lastOpponentMove = last(
              s.chessboard.get((s) => s.position).history({ verbose: true })
            );
            s.chessboard.backOne({ clear: true, skipAnimation: true });

            if (lastOpponentMove) {
              // TODO: figure out why the setTimeout is needed here, bug is
              // that practicing doesn't play the first move on the board if
              // there's no delay. I imagine it's because the piece refs aren't
              // there yet? Only the first move that breaks
              window.setTimeout(() => {
                set(([s]) => {
                  s.chessboard.makeMove(lastOpponentMove, { animate: true });
                });
              }, 0);
            }
          });
        };

        s.reviewStats.due = sum(map(s.activeQueue, (m) => m.moves.length));
        if (delay) {
          setTimeout(() => {
            setup();
          }, delay);
        } else {
          setup();
        }
      }, "setupNextMove"),

    giveUp: () =>
      set(([s]) => {
        const move = s.getNextReviewPositionMove();
        const moveObj = s.chessboard
          .get((s) => s.position)
          .validateMoves([move.sanPlus])?.[0];
        if (!moveObj) {
          // todo : this should queue up instead of silently doing nothing
          console.error("Invalid move", logProxy(move));
          return;
        }
        s.chessboard.setFrozen(true);
        s.getRemainingReviewPositionMoves().forEach((move) => {
          if (!s.failedReviewPositionMoves[move.sanPlus]) {
            s.reviewStats.incorrect++;
          }
          s.failedReviewPositionMoves[move.sanPlus] = move;
          s.allReviewPositionMoves[move.epd][move.sanPlus].failed = true;
          s.allReviewPositionMoves[move.epd][move.sanPlus].reviewed = true;
        });
        s.completedReviewPositionMoves[move.sanPlus] = move;
        s.showNext = true;
        s.chessboard.makeMove(moveObj, { animate: true });
      }, "giveUp"),
    stopReviewing: () =>
      set(([s, rs]) => {
        rs.updateRepertoireStructures();

        // @ts-ignore
        s.reviewSide = null;
        if (s.currentMove) {
          s.activeQueue = [];
        }
        s.currentMove = undefined;
      }),
    buildQueue: (options: ReviewOptions) =>
      get(([s, rs]) => {
        if (isNil(rs.repertoire)) {
          return null;
        }
        let queue: QuizMove[] = [];
        shuffle(SIDES).forEach((side) => {
          const seen_epds = new Set();
          if (options.side && options.side !== side) {
            return;
          }
          const recurse = (epd: string, line: string[]) => {
            // @ts-ignore
            const responses = rs.repertoire[side].positionResponses[epd];
            if (responses?.[0]?.mine) {
              const needsToReviewAny = some(
                responses,
                // @ts-ignore
                (r) => r.srs.needsReview
              );
              const shouldAdd =
                (options.filter === "difficult-due" &&
                  some(responses, (r) => isMoveDifficult(r)) &&
                  needsToReviewAny) ||
                (options.filter == "common" && needsToReviewAny) ||
                (options.filter == "due" && needsToReviewAny) ||
                options.filter === "all";
              if (shouldAdd) {
                queue.push({
                  moves: responses,
                  line: lineToPgn(line),
                  side,
                } as QuizMove);
              }
            }

            map(shuffle(responses), (m) => {
              if (!seen_epds.has(m.epdAfter)) {
                seen_epds.add(m.epdAfter);
                recurse(m.epdAfter, [...line, m.sanPlus]);
              }
            });
          };
          recurse(options.startPosition ?? START_EPD, options.startLine ?? []);
        });
        if (options.filter === "common") {
          const byIncidence = sortBy(
            map(queue, (m) => m.moves[0].incidence ?? 0),
            (v) => -v
          );
          const commonCutoff =
            byIncidence[COMMON_MOVES_CUTOFF] ?? first(byIncidence);
          const commonQueue = take(
            // @ts-ignore
            filter(queue, (m) => m.moves[0].incidence >= commonCutoff),
            COMMON_MOVES_CUTOFF
          );
          queue = commonQueue;
        }
        return queue;
      }),
    updateQueue: (options: ReviewOptions) =>
      set(([s, rs]) => {
        s.activeQueue = s.buildQueue(options);
        s.reviewStats = {
          due: sum(map(s.activeQueue, (m) => m.moves.length)),
          incorrect: 0,
          correct: 0,
        };
      }),
    reviewLine: (line: string[], side: Side) =>
      set(([s, rs]) => {
        rs.backToOverview();
        // @ts-ignore
        const queue = [];
        let epd = START_EPD;
        // @ts-ignore
        const lineSoFar = [];
        line.map((move) => {
          // @ts-ignore
          const responses = rs.repertoire[side].positionResponses[epd];
          const response = find(
            // @ts-ignore
            rs.repertoire[side].positionResponses[epd],
            (m) => m.sanPlus === move
          );
          // @ts-ignore
          epd = response?.epdAfter;
          if (response && response.mine) {
            queue.push({
              moves: responses,
              // @ts-ignore
              line: lineToPgn(lineSoFar),
            });
          } else {
            console.log("Couldn't find a move for ", epd);
          }
          lineSoFar.push(move);
        });

        // @ts-ignore
        s.startReview({ side: side, customQueue: queue });
      }, "reviewLine"),
    getNextReviewPositionMove: () =>
      get(([s]) => {
        return first(s.getRemainingReviewPositionMoves());
      }),
    getRemainingReviewPositionMoves: () =>
      get(([s]) => {
        return filter(s.currentMove?.moves, (m) => {
          return isNil(s.completedReviewPositionMoves[m.sanPlus]);
        });
      }),
  } as ReviewState;

  initialState.chessboard = createChessboardInterface()[1];
  initialState.chessboard.set((c) => {
    // c.frozen = true;
    c.delegate = {
      askForPromotionPiece: (requestedMove: Move) => {
        return get(([s]) => {
          const currentMove = s.currentMove?.moves[0];
          if (!currentMove) {
            return null;
          }
          const moveObjects = s.chessboard
            .get((s) => s.position)
            .validateMoves([currentMove?.sanPlus]);
          if (!moveObjects) {
            return null;
          }
          const moveObject = moveObjects[0];
          if (requestedMove.promotion) {
            return moveObject.promotion ?? null;
          }
          return null;
        });
      },
      onPositionUpdated: () => {
        set(([s]) => {
          s.moveLog = s.chessboard.get((s) => s.moveLog);
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      madeMove: noop,
      shouldMakeMove: (move: Move) =>
        set(([s]) => {
          const matchingResponse = find(
            s.currentMove!.moves,
            (m) => move.san == m.sanPlus
          );
          if (matchingResponse) {
            s.reviewStats.correct++;
            console.log("correct", s.reviewStats.correct);
            s.completedReviewPositionMoves[matchingResponse.sanPlus] =
              matchingResponse;
            const willUndoBecauseMultiple = !isEmpty(
              s.getRemainingReviewPositionMoves()
            );
            s.chessboard.showMoveFeedback(
              {
                square: move.to as Square,
                type: "correct",
              },
              () => {
                set(([s]) => {
                  if (willUndoBecauseMultiple) {
                    s.chessboard.backOne({ clear: true });
                    console.log("undo because multiple");
                  }

                  s.currentMove?.moves.forEach((move) => {
                    s.allReviewPositionMoves[move.epd][move.sanPlus].reviewed =
                      true;
                  });
                  const nextMove = s.activeQueue[1];
                  console.log(s.activeQueue);
                  // todo: make this actually work
                  const continuesCurrentLine =
                    nextMove?.line ==
                    lineToPgn([...pgnToLine(s.currentMove!.line), move.san]);
                  // console.log(
                  //   "continuesCurrentLine",
                  //   continuesCurrentLine,
                  //   nextMove?.line,
                  //   lineToPgn([...pgnToLine(s.currentMove.line), move.san])
                  // );

                  // @ts-ignore
                  if (s.currentMove?.moves.length > 1) {
                    s.showNext = true;
                  } else {
                    if (isEmpty(s.failedReviewPositionMoves)) {
                      s.setupNextMove();
                    } else {
                      s.showNext = true;
                    }
                  }
                });
              }
            );
            return true;
          } else {
            s.chessboard.showMoveFeedback(
              {
                square: move.to as Square,
                type: "incorrect",
              },
              () => {
                s.chessboard.backOne({ clear: true });
                if (isEmpty(s.failedReviewPositionMoves)) {
                  s.reviewStats.incorrect++;
                }
                // TODO: reduce repetition
                s.getRemainingReviewPositionMoves().forEach((move) => {
                  s.failedReviewPositionMoves[move.sanPlus] = move;
                  s.allReviewPositionMoves[move.epd][move.sanPlus].failed =
                    true;
                  s.allReviewPositionMoves[move.epd][move.sanPlus].reviewed =
                    true;
                });
              }
            );
            return true;
          }
        }),
    };
  });
  return initialState;
};
