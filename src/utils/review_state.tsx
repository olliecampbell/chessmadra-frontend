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
import { lineToPgn, RepertoireMove, Side } from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { RepertoireState } from "./repertoire_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import client from "app/client";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { START_EPD } from "./chess";

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
  chessboardState?: ChessboardState;
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
  startReview: (_side: Side, options: ReviewOptions) => void;
  reviewWithQueue: (queue: QuizMove[]) => void;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;
  updateQueue: (options: ReviewOptions) => void;
}

type Stack = [ReviewState, RepertoireState, AppState];
const EMPTY_QUEUES = { white: [], black: [] };

interface ReviewOptions {
  side: Side;
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
  let initialState = {
    chessboardState: null,
    showNext: false,
    // queues: EMPTY_QUEUES,
    activeQueue: null,
    markMovesReviewed: (results: ReviewPositionResults[]) =>
      set(([s, rs]) => {
        trackEvent(`reviewing.reviewed_move`);
        results.forEach((r) => {
          rs.repertoire[r.side].positionResponses[r.epd].forEach(
            (m: RepertoireMove) => {
              if (m.sanPlus === r.sanPlus) {
                if (r.correct) {
                  m.srs.needsReview = false;
                }
              }
            }
          );
        });
        client
          .post("/api/v1/openings/moves_reviewed", { results })
          .then(({ data }) => {});
      }),
    startReview: (side: Side, options: ReviewOptions) =>
      set(([s, rs, gs]) => {
        if (options.customQueue) {
          s.activeQueue = options.customQueue;
        } else {
          s.updateQueue(options);
          console.log("s.activeQueue", s.activeQueue);
        }
        gs.navigationState.push("/openings/review");
        rs.setBreadcrumbs([
          {
            text: `Review`,
            onPress: null,
          },
        ]);
        rs.isReviewing = true;
        s.reviewSide = side;
        s.chessboardState.showMoveLog = true;
        s.setupNextMove();
      }),
    setupNextMove: () =>
      set(([s, rs]) => {
        s.chessboardState.frozen = false;
        s.showNext = false;
        if (s.currentMove) {
          let failedMoves = values(s.failedReviewPositionMoves);
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
              let failed = s.failedReviewPositionMoves[m.sanPlus];
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
          return;
        }
        s.reviewSide = s.currentMove.side;
        s.failedReviewPositionMoves = {};
        s.completedReviewPositionMoves = {};
        s.chessboardState.flipped = s.currentMove.moves[0].side === "black";
        s.chessboardState.resetPosition();
        s.chessboardState.playPgn(s.currentMove.line);
        let lastOpponentMove = last(
          s.chessboardState.position.history({ verbose: true })
        );
        s.chessboardState.backOne();

        if (lastOpponentMove) {
          window.setTimeout(() => {
            set(([s]) => {
              s.chessboardState.animatePieceMove(
                lastOpponentMove,
                PlaybackSpeed.Normal,
                (completed) => {}
              );
            });
          }, 300);
        }
      }, "setupNextMove"),

    giveUp: () =>
      set(([s]) => {
        let move = s.getNextReviewPositionMove();
        let moveObj = s.chessboardState.position.validateMoves([
          move.sanPlus,
        ])?.[0];
        s.chessboardState.frozen = true;
        s.completedReviewPositionMoves[move.sanPlus] = move;
        s.getRemainingReviewPositionMoves().forEach((move) => {
          s.failedReviewPositionMoves[move.sanPlus] = move;
        });
        s.showNext = true;
        s.chessboardState.animatePieceMove(
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
        rs.isReviewing = false;
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
        let seen_epds = new Set();
        let queue: QuizMove[] = [];
        const recurse = (epd, line) => {
          let responses = rs.repertoire[options.side].positionResponses[epd];
          if (responses?.[0]?.mine) {
            let needsToReviewAny =
              some(responses, (r) => r.srs.needsReview) || options.cram;
            if (needsToReviewAny) {
              queue.push({
                moves: responses,
                line: lineToPgn(line),
                side: options.side,
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
        seen_epds = new Set();
        return queue;
      }),
    updateQueue: (options: ReviewOptions) =>
      set(([s, rs]) => {
        s.activeQueue = s.buildQueue(options);
      }),
    reviewLine: (line: string[], side: Side) =>
      set(([s, rs]) => {
        rs.backToOverview();
        let queue = [];
        let epd = START_EPD;
        let lineSoFar = [];
        line.map((move) => {
          let response = find(
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

  const setChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState.reviewState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _get((s) => fn(s.repertoireState.reviewState.chessboardState));
  };
  initialState.chessboardState = createChessState(
    setChess,
    getChess,
    (c: ChessboardState) => {
      // c.frozen = true;
      c.delegate = {
        completedMoveAnimation: () => {},
        onPositionUpdated: () => {
          set(([s]) => {});
        },
        madeMove: () => {},

        shouldMakeMove: (move: Move) =>
          set(([s]) => {
            let matchingResponse = find(
              s.currentMove.moves,
              (m) => move.san == m.sanPlus
            );
            if (matchingResponse) {
              s.chessboardState.flashRing(true);

              s.completedReviewPositionMoves[matchingResponse.sanPlus] =
                matchingResponse;
              // TODO: this is really dirty
              const willUndo = !isEmpty(s.getRemainingReviewPositionMoves());
              window.setTimeout(
                () => {
                  set(([s]) => {
                    if (isEmpty(s.getRemainingReviewPositionMoves())) {
                      if (s.currentMove?.moves.length > 1) {
                        s.showNext = true;
                      } else {
                        console.log("Should setup next?");
                        if (isEmpty(s.failedReviewPositionMoves)) {
                          console.log("Yup?");
                          s.setupNextMove();
                        } else {
                          s.showNext = true;
                        }
                      }
                    } else {
                      s.chessboardState.backOne();
                    }
                  });
                },
                willUndo ? 500 : 100
              );
              return true;
            } else {
              s.chessboardState.flashRing(false);
              // TODO: reduce repetition
              s.getRemainingReviewPositionMoves().forEach((move) => {
                s.failedReviewPositionMoves[move.sanPlus] = move;
              });
              return false;
            }
          }),
      };
    }
  );
  return initialState;
};
