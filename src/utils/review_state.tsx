import { Move } from "@lubert/chess.ts/dist/types";
import { EcoCode } from "app/models";
import {
  isEmpty,
  last,
  map,
  isNil,
  sortBy,
  groupBy,
  find,
  nth,
  zip,
  first,
  shuffle,
  values,
  some,
  filter,
  cloneDeep,
} from "lodash-es";
import {
  BySide,
  lineToPgn,
  otherSide,
  pgnToLine,
  RepertoireMove,
  Side,
  SIDES,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { RepertoireState } from "./repertoire_state";
import { getPawnOnlyEpd } from "./pawn_structures";
import { logProxy } from "./state";
import { trackEvent } from "app/hooks/useTrackEvent";
import client from "app/client";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { START_EPD } from "./chess";

export interface QuizMove {
  moves: RepertoireMove[];
  line: string;
}

export interface ReviewPositionResults {
  correct: boolean;
  epd: string;
  sanPlus: string;
}

export interface ReviewState {
  stopReviewing: () => void;
  chessboardState?: ChessboardState;
  getQueueLength: (side?: Side) => number;
  showNext?: boolean;
  failedReviewPositionMoves?: Record<string, RepertoireMove>;
  queues: BySide<QuizMove[]>;
  currentMove?: QuizMove;
  reviewSide?: Side;
  completedReviewPositionMoves?: Record<string, RepertoireMove>;
  reviewLine: (line: string[], side: Side) => void;
  giveUp: () => void;
  setupNextMove: () => void;
  startReview: (side?: Side) => void;
  reviewWithQueue: (queues: BySide<QuizMove[]>) => void;
  isReviewingWithCustomQueue?: boolean;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  isCramming?: boolean;
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;
  updateQueue: (cram: boolean) => void;
}

type Stack = [ReviewState, RepertoireState, AppState];
const EMPTY_QUEUES = { white: [], black: [] };

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
    queues: EMPTY_QUEUES,
    markMovesReviewed: (results: ReviewPositionResults[]) =>
      set(([s, gs]) => {
        trackEvent(`reviewing.reviewed_move`);
        client
          .post("/api/v1/openings/moves_reviewed", { results })
          .then(({ data }) => {});
      }),
    startReview: (_side?: Side) =>
      set(([s, rs, gs]) => {
        gs.navigationState.push("/openings/review");
        rs.setBreadcrumbs([
          {
            text: `Review`,
            onPress: null,
          },
        ]);
        rs.isReviewing = true;
        let side = _side ?? shuffle(SIDES)[0];
        s.reviewSide = side;
        if (!isNil(_side) && s.getQueueLength(side) === 0) {
          s.updateQueue(true);
          s.isCramming = true;
        }
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
            let side = failedMoves[0].side;
            s.queues[side].push({
              moves: failedMoves,
              line: s.currentMove.line,
            });
          }
          s.markMovesReviewed(
            s.currentMove.moves.map((m) => {
              let failed = s.failedReviewPositionMoves[m.sanPlus];
              return {
                epd: m.epd,
                sanPlus: m.sanPlus,
                correct: !failed,
              };
            })
          );
        }
        s.currentMove = s.queues[s.reviewSide].shift();
        if (!s.currentMove) {
          s.reviewSide = otherSide(s.reviewSide);
          s.currentMove = s.queues[s.reviewSide].shift();
          if (!s.currentMove) {
            rs.backToOverview();
            return;
          }
        }
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
    reviewWithQueue: (queues: BySide<QuizMove[]>) =>
      set(([s, rs]) => {
        let side = shuffle(SIDES)[0];
        s.isReviewingWithCustomQueue = true;
        s.queues = queues;
        s.reviewSide = side;
        s.chessboardState.showMoveLog = true;
        rs.isReviewing = true;
        s.setupNextMove();
      }),
    stopReviewing: () =>
      set(([s, rs]) => {
        if (s.isReviewingWithCustomQueue) {
          s.isReviewingWithCustomQueue = false;
          s.updateQueue(false);
        }
        rs.isReviewing = false;
        s.reviewSide = null;
        if (s.currentMove) {
          s.queues[s.currentMove.moves[0].side].unshift(s.currentMove);
        }
        if (s.isCramming) {
          s.updateQueue(false);
        }
        s.isCramming = false;
        s.currentMove = null;
      }),
    updateQueue: (cram: boolean) =>
      set(([s, rs]) => {
        let seen_epds = new Set();
        s.queues = {
          white: [],
          black: [],
        };
        const recurse = (epd, line, side: Side) => {
          let responses = rs.repertoire[side].positionResponses[epd];
          if (responses?.[0]?.mine) {
            let needsToReviewAny =
              some(responses, (r) => r.srs.needsReview) || cram;
            if (needsToReviewAny) {
              s.queues[side].push({ moves: responses, line: lineToPgn(line) });
            }
          }

          map(shuffle(responses), (m) => {
            if (!seen_epds.has(m.epdAfter)) {
              seen_epds.add(m.epdAfter);
              recurse(m.epdAfter, [...line, m.sanPlus], side);
            }
          });
        };
        for (const side of SIDES) {
          recurse(START_EPD, [], side);
          seen_epds = new Set();
        }
      }),
    reviewLine: (line: string[], side: Side) =>
      set(([s, rs]) => {
        rs.backToOverview();
        let queues = cloneDeep(EMPTY_QUEUES);
        let sideQueue = [];
        let epd = START_EPD;
        let lineSoFar = [];
        line.map((move) => {
          let response = find(
            rs.repertoire[side].positionResponses[epd],
            (m) => m.sanPlus === move
          );
          epd = response?.epdAfter;
          if (response && response.mine && response.epd !== START_EPD) {
            sideQueue.push({
              moves: [response],
              line: lineToPgn(lineSoFar),
            });
          } else {
            console.log("Couldn't find a move for ", epd);
          }
          lineSoFar.push(move);
        });
        queues[side] = sideQueue;
        s.reviewWithQueue(queues);
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
    getQueueLength: (side?: Side) =>
      get(([s]) => {
        if (side) {
          return s.queues[side].length;
        } else {
          return s.queues["white"].length + s.queues["black"].length;
        }
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
