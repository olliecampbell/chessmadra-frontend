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
  noop,
  includes,
  countBy,
  forEach,
  dropRight,
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
import { countQueue, Quiz, QuizGroup } from "./queues";
import { isMoveDifficult } from "./srs";
import { COMMON_MOVES_CUTOFF } from "./review";
import { getMaxPlansForQuizzing, parsePlansToQuizMoves } from "./plans";
import { Chess } from "@lubert/chess.ts";
import { getAllPossibleMoves } from "./move_generation";
import { LichessMistake } from "./models";
import { getLineAnimation } from "./get_line_animation";
import {
  PieceAnimation,
  pieceAnimationToPlaybackSpeed,
} from "./frontend_settings";
import { PlaybackSpeed } from "~/types/VisualizationState";

export interface ReviewPositionResults {
  side: Side;
  correct: boolean;
  epd: string;
  sanPlus: string;
}

type ReviewMoveKey = string;
type Epd = string;

export interface ReviewState {
  markGameMistakeReviewed(lichessMistake: LichessMistake): void;
  buildQueueFromMistakes(lichessMistakes: LichessMistake[]): QuizGroup[];
  setupPlans: () => void;
  moveLog: string[];
  buildQueue: (options: ReviewOptions) => QuizGroup[];
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
  activeQueue: QuizGroup[];
  activeOptions: ReviewOptions | null;
  planIndex: number;
  currentQuizGroup?: QuizGroup;
  reviewSide?: Side;
  completedReviewPositionMoves: Record<string, RepertoireMove>;
  reviewLine: (line: string[], side: Side) => void;
  giveUp: () => void;
  setupNextMove: () => void;
  startReview: (options: ReviewOptions) => void;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;
  updateQueue: (options: ReviewOptions) => void;
}

type Stack = [ReviewState, RepertoireState, AppState];
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
  customQueue?: QuizGroup[];
  lichessMistakes?: LichessMistake[];
  includePlans?: boolean;
}

const FRESH_REVIEW_STATS = {
  due: 0,
  correct: 0,
  incorrect: 0,
} as ReviewStats;

export const getInitialReviewState = (
  // rome-ignore lint: ignore
  _set: StateSetter<AppState, any>,
  // rome-ignore lint: ignore
  _get: StateGetter<AppState, any>,
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) =>
      fn([s.repertoireState.reviewState, s.repertoireState, s]),
    );
  };
  // const setOnly = <T,>(fn: (stack: ReviewState) => T, id?: string): T => {
  //   return _set((s) => fn(s.repertoireState.reviewState));
  // };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) =>
      fn([s.repertoireState.reviewState, s.repertoireState, s]),
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
    activeQueue: [] as QuizGroup[],
    activeOptions: null,
    planIndex: 0,
    markMovesReviewed: (results: ReviewPositionResults[]) => {
      trackEvent("reviewing.reviewed_move");
      set(([s, rs]) => {
        results.forEach((r, i) => {
          // @ts-ignore
          rs.repertoire[r.side].positionResponses[r.epd]?.forEach(
            (m: RepertoireMove) => {
              if (m.sanPlus === r.sanPlus && m.srs) {
                m.srs.needsReview = !r.correct;
              }
            },
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
                },
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
        if (options.lichessMistakes) {
          s.activeQueue = s.buildQueueFromMistakes(options.lichessMistakes);
        } else if (options.customQueue) {
          s.activeQueue = options.customQueue;
        } else {
          s.updateQueue(options);
        }
        s.allReviewPositionMoves = {};
        s.activeQueue.forEach((m) => {
          Quiz.getMoves(m)?.forEach((m) => {
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
    setupPlans: () =>
      set(([s, rs]) => {
        const remaningPlans = Quiz.getRemainingPlans(
          s.currentQuizGroup!,
          s.planIndex,
        );
        const plan = first(remaningPlans);
        const completedPlans = Quiz.getCompletedPlans(
          s.currentQuizGroup!,
          s.planIndex,
        );
        s.chessboard.set((c) => {
          c.hideLastMoveHighlight = true;
        });
        if (!plan) {
          s.showNext = true;
          s.chessboard.set((c) => {
            c.showPlans = true;
            c.plans = (
              Quiz.getCompletedPlans(s.currentQuizGroup!, s.planIndex) ?? []
            ).map((p) => p.metaPlan);
          });
          return;
        }
        let squares = getAllPossibleMoves({
          square: plan.fromSquare,
          side: s.currentQuizGroup!.side,
          piece: plan.piece,
        });
        if (plan.options) {
          squares = plan.options;
        }
        s.chessboard.setTapOptions(squares);
        s.chessboard.setMode("tap");
        s.chessboard.highlightSquare(plan?.fromSquare ?? null);
      }),
    markGameMistakeReviewed: (lichessMistake: LichessMistake) => {
      set(([s, rs]) => {
        rs.lichessMistakes?.shift();
        client.post("/api/v1/game_mistake_reviewed", {
          gameId: lichessMistake.gameId,
          epd: lichessMistake.epd,
          createdAt: lichessMistake.timestamp,
        });
      });
    },
    setupNextMove: () =>
      set(([s, rs, gs]) => {
        s.chessboard.setFrozen(false);
        s.showNext = false;
        s.planIndex = 0;
        if (s.currentQuizGroup) {
          const failedMoves = values(s.failedReviewPositionMoves);
          if (!isEmpty(failedMoves) && !s.activeOptions?.lichessMistakes) {
            s.activeQueue.push({
              moves: failedMoves,
              line: s.currentQuizGroup.line,
              side: s.currentQuizGroup.side,
              epd: s.currentQuizGroup.epd,
            });
          }
          const moves = Quiz.getMoves(s.currentQuizGroup);
          const lichessMistake = s.currentQuizGroup.lichessMistake;
          if (lichessMistake) {
            s.markGameMistakeReviewed(lichessMistake);
          } else if (moves) {
            s.markMovesReviewed(
              moves.map((m) => {
                const failed = s.failedReviewPositionMoves[m.sanPlus];
                return {
                  side: m.side,
                  epd: m.epd,
                  sanPlus: m.sanPlus,
                  correct: !failed,
                };
              }),
            );
          }
          const plans = Quiz.getPlans(s.currentQuizGroup);
        }
        s.chessboard.setTapOptions([]);
        s.currentQuizGroup = s.activeQueue.shift();
        if (!s.currentQuizGroup) {
          rs.updateRepertoireStructures();
          rs.browsingState.pushView(PracticeComplete);
          trackEvent("review.review_complete");
          return;
        }
        const currentQuizGroup = s.currentQuizGroup as QuizGroup;
        s.reviewStats.due = countQueue(s.activeQueue);
        s.reviewSide = currentQuizGroup.side;
        s.failedReviewPositionMoves = {};
        s.completedReviewPositionMoves = {};
        s.chessboard.setPerspective(currentQuizGroup.side);
        s.chessboard.setMode("normal");
        s.chessboard.highlightSquare(null);
        s.chessboard.set((c) => {
          c.plans = [];
        });

        const plans = Quiz.getPlans(currentQuizGroup);
        if (plans) {
          s.setupPlans();
        } else {
          s.chessboard.set((c) => {
            c.showPlans = false;
            c.hideLastMoveHighlight = false;
          });
          const pieceAnimationSetting = gs.userState.getFrontendSetting(
            "pieceAnimation",
          ).value as PieceAnimation;
          s.chessboard.playLine(pgnToLine(currentQuizGroup.line), {
            animated: true,
          });
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
        s.chessboard.setTapOptions([]);

        // @ts-ignore
        s.reviewSide = null;
        if (s.currentQuizGroup) {
          s.activeQueue = [];
        }
        s.currentQuizGroup = undefined;
      }),
    buildQueue: (options: ReviewOptions) =>
      get(([_s, rs, gs]) => {
        if (gs.userState.flagEnabled("quiz_plans")) {
          options.includePlans = true;
        }
        if (isNil(rs.repertoire)) {
          return null;
        }
        let queue: QuizGroup[] = [];
        shuffle(SIDES).forEach((side) => {
          const seen_epds = new Set();
          if (options.side && options.side !== side) {
            return;
          }
          const recurse = (epd: string, line: string[]) => {
            const responses = rs.repertoire![side].positionResponses[epd];
            if (responses?.[0]?.mine) {
              const needsToReviewAny = some(
                responses,
                // @ts-ignore
                (r) => r.srs.needsReview,
              );
              const shouldAdd =
                (options.filter === "difficult-due" &&
                  some(responses, (r) => isMoveDifficult(r)) &&
                  needsToReviewAny) ||
                (options.filter === "common" && needsToReviewAny) ||
                (options.filter === "due" && needsToReviewAny) ||
                options.filter === "all";
              if (shouldAdd) {
                // todo: should re-enable
                queue.push({
                  moves: responses,
                  line: lineToPgn(line),
                  side,
                } as QuizGroup);
                if (options.includePlans) {
                  responses.forEach((r) => {
                    const plans = rs.repertoire![side].plans[r.epdAfter];
                    if (!plans) {
                      return;
                    }
                    const fen = `${r.epdAfter} 0 1`;
                    const position = new Chess(fen);
                    const quizPlans = parsePlansToQuizMoves(
                      plans,
                      side,
                      position,
                    );
                    queue.push({
                      plans: [...quizPlans],
                      remainingPlans: quizPlans,
                      completedPlans: [],
                      line: lineToPgn([...line, r.sanPlus]),
                      side,
                      epd,
                    } as QuizGroup);
                  });
                }
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
            map(queue, (m) => Quiz.getMoves(m)?.[0].incidence ?? 0),
            (v) => -v,
          );
          const commonCutoff =
            byIncidence[COMMON_MOVES_CUTOFF] ?? first(byIncidence);
          const commonQueue = take(
            filter(queue, (m) => {
              const moves = Quiz.getMoves(m);
              if (!moves) {
                return false;
              }
              return (moves[0].incidence ?? 0) >= commonCutoff;
            }),
            COMMON_MOVES_CUTOFF,
          );
          const epds = map(commonQueue, (q) => q.epd);
          if (options.includePlans) {
            const commonWithPlans = filter(queue, (m) => epds.includes(m.epd));
            queue = commonWithPlans;
          } else {
            queue = commonQueue;
          }
        }
        const countOfPlans = countBy(queue, (q: QuizGroup) =>
          Quiz.isPlansQuiz(q),
        ).true;
        const maxPlans = getMaxPlansForQuizzing();
        if (countOfPlans > maxPlans) {
          const ratio = maxPlans / countOfPlans;
          queue = filter(queue, (q) => {
            if (Quiz.isPlansQuiz(q)) {
              return Math.random() < ratio;
            }
            return true;
          });
        }
        return queue;
      }),
    buildQueueFromMistakes: (mistakes: LichessMistake[]) =>
      set(([s, rs]) => {
        const queue: QuizGroup[] = [];
        forEach(mistakes, (m) => {
          const responses = rs.repertoire![m.side].positionResponses[m.epd];
          queue.push({
            moves: responses,
            lichessMistake: m,
            line: m.line,
            side: m.side,
          } as QuizGroup);
        });
        return queue;
      }),
    updateQueue: (options: ReviewOptions) =>
      set(([s, rs]) => {
        s.activeQueue = s.buildQueue(options);
        s.reviewStats = {
          due: countQueue(s.activeQueue),
          incorrect: 0,
          correct: 0,
        };
      }),
    reviewLine: (line: string[], side: Side) =>
      set(([s, rs]) => {
        rs.backToOverview();
        // @ts-ignore
        const queue: QuizGroup[] = [];
        let epd = START_EPD;
        const lineSoFar: string[] = [];
        line.map((move) => {
          const responses = rs.repertoire![side].positionResponses[epd];
          const response = find(
            rs.repertoire![side].positionResponses[epd],
            (m) => m.sanPlus === move,
          );
          if (!response) {
            return;
          }
          epd = response.epdAfter;
          if (response.mine) {
            queue.push({
              moves: responses,
              line: lineToPgn(lineSoFar),
              epd,
              side,
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
        return filter(Quiz.getMoves(s.currentQuizGroup!), (m) => {
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
          const currentMove = Quiz.getMoves(s.currentQuizGroup!)?.[0];
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
      tappedSquare: (square) =>
        set(([s]) => {
          const remaningPlans = Quiz.getRemainingPlans(
            s.currentQuizGroup!,
            s.planIndex,
          );
          if (!remaningPlans) {
            return;
          }
          const plan = remaningPlans[0];
          const correct = includes(plan.toSquares, square);
          if (correct) {
            s.chessboard.setTapOptions([]);
          }
          s.chessboard.showMoveFeedback(
            {
              square,
              result: correct ? "correct" : "incorrect",
              size: correct ? "large" : "small",
            },
            () => {
              set(([s]) => {
                if (correct) {
                  s.planIndex++;
                  s.setupPlans();
                }
              });
            },
          );
        }),
      shouldMakeMove: (move: Move) =>
        set(([s]) => {
          const matchingResponse = find(
            Quiz.getMoves(s.currentQuizGroup!),
            (m) => move.san === m.sanPlus,
          );
          if (matchingResponse) {
            s.reviewStats.correct++;
            s.completedReviewPositionMoves[matchingResponse.sanPlus] =
              matchingResponse;
            const willUndoBecauseMultiple = !isEmpty(
              s.getRemainingReviewPositionMoves(),
            );
            s.chessboard.showMoveFeedback(
              {
                square: move.to as Square,
                result: "correct",
              },
              () => {
                set(([s]) => {
                  if (willUndoBecauseMultiple) {
                    s.chessboard.backOne({ clear: true });
                    console.log("undo because multiple");
                  }

                  Quiz.getMoves(s.currentQuizGroup!)?.forEach((move) => {
                    s.allReviewPositionMoves[move.epd][
                      move.sanPlus
                    ].reviewed = true;
                  });
                  const nextMove = s.activeQueue[1];
                  // todo: make this actually work
                  const continuesCurrentLine =
                    nextMove?.line ===
                    lineToPgn([
                      ...pgnToLine(s.currentQuizGroup!.line),
                      move.san,
                    ]);
                  // console.log(
                  //   "continuesCurrentLine",
                  //   continuesCurrentLine,
                  //   nextMove?.line,
                  //   lineToPgn([...pgnToLine(s.currentMove.line), move.san])
                  // );

                  // @ts-ignore
                  if (s.currentQuizGroup?.moves.length > 1) {
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
            );
            return true;
          } else {
            s.chessboard.showMoveFeedback(
              {
                square: move.to as Square,
                result: "incorrect",
              },
              () => {
                s.chessboard.backOne({ clear: true });
                if (isEmpty(s.failedReviewPositionMoves)) {
                  s.reviewStats.incorrect++;
                }
                // TODO: reduce repetition
                s.getRemainingReviewPositionMoves().forEach((move) => {
                  s.failedReviewPositionMoves[move.sanPlus] = move;
                  s.allReviewPositionMoves[move.epd][
                    move.sanPlus
                  ].failed = true;
                  s.allReviewPositionMoves[move.epd][
                    move.sanPlus
                  ].reviewed = true;
                });
              },
            );
            return true;
          }
        }),
    };
  });
  return initialState;
};
