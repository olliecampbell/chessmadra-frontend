import { Move } from "@lubert/chess.ts/dist/types";
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
} from "lodash-es";
import {
  lineToPgn,
  pgnToLine,
  RepertoireMove,
  Side,
  SIDES,
} from "./repertoire";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { RepertoireState } from "./repertoire_state";
import { trackEvent } from "~/utils/trackEvent";
import client from "~/utils/client";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { START_EPD } from "./chess";
import { logProxy } from "./state";
import {
  ChessboardInterface,
  ChessboardViewState,
  createChessboardInterface,
} from "./chessboard_interface";

export interface QuizMove {
  moves: RepertoireMove[];
  line: string;
  side: Side;
}

export interface ReviewPositionResults {
  side: Side;
  correct: boolean;
  epd: string;
  sanPlus: string;
}

export interface ReviewState {
  buildQueue: (options: ReviewOptions) => QuizMove[];
  stopReviewing: () => void;
  chessboard: ChessboardInterface;
  // getQueueLength: (side?: Side) => number;
  showNext?: boolean;
  failedReviewPositionMoves?: Record<string, RepertoireMove>;
  activeQueue: QuizMove[];
  currentMove?: QuizMove;
  reviewSide?: Side;
  completedReviewPositionMoves?: Record<string, RepertoireMove>;
  reviewLine: (line: string[], side: Side) => void;
  giveUp: () => void;
  setupNextMove: () => void;
  startReview: (_side: Side | null, options: ReviewOptions) => void;
  reviewWithQueue: (queue: QuizMove[]) => void;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;
  updateQueue: (options: ReviewOptions) => void;
}

type Stack = [ReviewState, RepertoireState, AppState];
const EMPTY_QUEUES = { white: [], black: [] };

interface ReviewOptions {
  side?: Side;
  startPosition?: string;
  startLine?: string[];
  cram?: boolean;
  customQueue?: QuizMove[];
}

export const getInitialReviewState = (
  _set: StateSetter<AppState, any>,
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
    showNext: false,
    // queues: EMPTY_QUEUES,
    activeQueue: null,
    markMovesReviewed: (results: ReviewPositionResults[]) => {
      trackEvent(`reviewing.reviewed_move`);
      set(([s, rs]) => {
        results.forEach((r, i) => {
          rs.repertoire[r.side].positionResponses[r.epd].forEach(
            (m: RepertoireMove) => {
              if (m.sanPlus === r.sanPlus) {
                m.needed = r.correct;
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
              rs.repertoire[r.side].positionResponses[r.epd].forEach(
                (m: RepertoireMove) => {
                  if (m.sanPlus === r.sanPlus) {
                    m.srs = updatedSrss[i];
                  }
                }
              );
            });
            if (rs.browsingState.sidebarState.mode !== "review")
              rs.updateRepertoireStructures();
          });
        });
    },
    startReview: (side: Side, options: ReviewOptions) =>
      set(([s, rs, gs]) => {
        rs.browsingState.moveSidebarState("right");
        rs.browsingState.sidebarState.mode = "review";
        rs.browsingState.sidebarState.activeSide = side;
        if (options.customQueue) {
          s.activeQueue = options.customQueue;
        } else {
          s.updateQueue(options);
        }
        console.log(s.activeQueue);
        // gs.navigationState.push(`/openings/${side}/review`);
        s.reviewSide = side;
        rs.animateChessboardShown(true);
        s.setupNextMove();
      }),
    setupNextMove: () =>
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
          rs.backToOverview();
          trackEvent(`review.review_complete`);
          return;
        }
        s.reviewSide = s.currentMove.side;
        s.failedReviewPositionMoves = {};
        s.completedReviewPositionMoves = {};
        s.chessboard.setPerspective(s.currentMove.moves[0].side);
        s.chessboard.resetPosition();
        s.chessboard.playPgn(s.currentMove.line);
        const lastOpponentMove = last(
          s.chessboard.get((s) => s.position).history({ verbose: true })
        );
        s.chessboard.backOne();

        if (lastOpponentMove) {
          window.setTimeout(() => {
            set(([s]) => {
              s.chessboard.makeMove(lastOpponentMove);
            });
          }, 300);
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
        s.completedReviewPositionMoves[move.sanPlus] = move;
        s.getRemainingReviewPositionMoves().forEach((move) => {
          s.failedReviewPositionMoves[move.sanPlus] = move;
        });
        s.showNext = true;
        s.chessboard.animatePieceMove(
          moveObj,
          PlaybackSpeed.Normal,
          (completed) => {
            set(([s]) => {
              s.showNext = true;
            });
          }
        );
      }, "giveUp"),
    stopReviewing: () =>
      set(([s, rs]) => {
        rs.updateRepertoireStructures();
        rs.browsingState.sidebarState.mode = null;

        s.reviewSide = null;
        if (s.currentMove) {
          s.activeQueue = null;
        }
        s.currentMove = null;
      }),
    buildQueue: (options: ReviewOptions) =>
      get(([s, rs]) => {
        if (isNil(rs.repertoire)) {
          return null;
        }
        const queue: QuizMove[] = [];
        SIDES.forEach((side) => {
          const seen_epds = new Set();
          if (options.side && options.side !== side) {
            return;
          }
          const recurse = (epd, line) => {
            const responses = rs.repertoire[side].positionResponses[epd];
            if (responses?.[0]?.mine) {
              const needsToReviewAny =
                some(responses, (r) => r.srs.needsReview) || options.cram;
              if (needsToReviewAny) {
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
        return queue;
      }),
    updateQueue: (options: ReviewOptions) =>
      set(([s, rs]) => {
        s.activeQueue = s.buildQueue(options);
      }),
    reviewLine: (line: string[], side: Side) =>
      set(([s, rs]) => {
        rs.backToOverview();
        const queue = [];
        let epd = START_EPD;
        const lineSoFar = [];
        line.map((move) => {
          const response = find(
            rs.repertoire[side].positionResponses[epd],
            (m) => m.sanPlus === move
          );
          epd = response?.epdAfter;
          if (response && response.mine && response.epd !== START_EPD) {
            queue.push({
              moves: [response],
              line: lineToPgn(lineSoFar),
            });
          } else {
            console.log("Couldn't find a move for ", epd);
          }
          lineSoFar.push(move);
        });

        s.startReview(side, { side: side, customQueue: queue });
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
      completedMoveAnimation: () => {},
      onPositionUpdated: () => {
        set(([s]) => {});
      },
      madeMove: () => {},

      shouldMakeMove: (move: Move) =>
        set(([s]) => {
          console.log("should make move?");
          const matchingResponse = find(
            s.currentMove.moves,
            (m) => move.san == m.sanPlus
          );
          if (matchingResponse) {
            s.chessboard.flashRing(true);

            s.completedReviewPositionMoves[matchingResponse.sanPlus] =
              matchingResponse;
            // TODO: this is really dirty
            const willUndoBecauseMultiple = !isEmpty(
              s.getRemainingReviewPositionMoves()
            );
            if (willUndoBecauseMultiple) {
              window.setTimeout(() => {
                set(([s]) => {
                  s.chessboard.backOne();
                });
              }, 500);
              return true;
            }
            const nextMove = s.activeQueue[1];
            console.log(s.activeQueue);
            // todo: make this actually work
            const continuesCurrentLine =
              nextMove?.line ==
              lineToPgn([...pgnToLine(s.currentMove.line), move.san]);
            // console.log(
            //   "continuesCurrentLine",
            //   continuesCurrentLine,
            //   nextMove?.line,
            //   lineToPgn([...pgnToLine(s.currentMove.line), move.san])
            // );
            window.setTimeout(
              () => {
                set(([s]) => {
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
              },
              continuesCurrentLine ? 200 : 200
            );
            return true;
          } else {
            s.chessboard.flashRing(false);
            // TODO: reduce repetition
            s.getRemainingReviewPositionMoves().forEach((move) => {
              s.failedReviewPositionMoves[move.sanPlus] = move;
            });
            return false;
          }
        }),
    };
  });
  return initialState;
};
