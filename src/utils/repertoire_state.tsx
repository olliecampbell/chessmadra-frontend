import client from "~/utils/client";
import {
  PlayerTemplate,
  RepertoireTemplate,
  PositionReport,
  EcoCode,
  PawnStructureDetails,
  LineReport,
} from "~/utils/models";
import {
  dropRight,
  isEmpty,
  keyBy,
  last,
  some,
  forEach,
  filter,
  flatten,
  values,
  capitalize,
} from "lodash-es";
import {
  BySide,
  getAllRepertoireMoves,
  lineToPgn,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
} from "./repertoire";
import { START_EPD } from "./chess";
import { AppState, quick } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import {
  BrowsingMode,
  BrowsingState,
  getInitialBrowsingState,
  makeDefaultSidebarState,
  modeToUI,
} from "./browsing_state";
import { getPawnOnlyEpd, reversePawnEpd } from "./pawn_structures";
import { getInitialReviewState, ReviewState } from "./review_state";
const NUM_MOVES_DEBUG_PAWN_STRUCTURES = 10;
import { isDevelopment } from "./env";
import { shouldDebugEpd } from "./debug";
import { Responsive } from "./useResponsive";
import { Logo } from "~/components/icons/Logo";
import { clsx } from "./classes";
import { MAX_MOVES_FREE_TIER } from "./payment";
import dedent from "dedent-js";
import {
  ImportSuccessOnboarding,
  TrimRepertoireOnboarding,
} from "~/components/SidebarOnboarding";

const TEST_LINE = isDevelopment
  ? //pgnToLine("1.e4 d5 2.exd5")
    []
  : [];
console.log("TEST_LINE", TEST_LINE);
const TEST_MODE: BrowsingMode | null = isDevelopment ? null : null;
// const TEST_LINE = null;

export interface LichessOauthData {
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  codeChallenge: string;
}

export interface RepertoireState {
  numMyMoves: BySide<number>;
  onboarding: {
    isOnboarding: boolean;
    side?: Side;
  };
  animateSidebarState?: (dir: "left" | "right") => void;
  lineReports: Record<string, LineReport>;
  numMovesFromEpd: BySide<Record<string, number>>;
  numMovesDueFromEpd: BySide<Record<string, number>>;
  earliestReviewDueFromEpd: BySide<Record<string, string>>;
  expectedNumMovesFromEpd: BySide<Record<string, number>>;
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire | undefined;
  numResponsesAboveThreshold?: BySide<number>;
  numResponses?: BySide<number>;
  positionReports: BySide<Record<string, PositionReport>>;
  failedToFetchSharedRepertoire?: boolean;
  repertoireGrades: BySide<RepertoireGrade | null>;
  repertoireShareId?: string;
  fetchSharedRepertoire: (id: string) => void;
  fetchRepertoire: (initial?: boolean) => void;
  // startLichessOauthFlow: () => void;
  fetchEcoCodes: () => void;
  fetchSupplementary: () => Promise<void>;
  initializeRepertoire: (_: {
    lichessUsername?: string;
    whitePgn?: string;
    blackPgn?: string;
    state?: RepertoireState;
    responsive: Responsive;
  }) => void;
  initState: () => void;
  // TODO: move review state stuff to its own module
  usePlayerTemplate: (id: string, responsive: Responsive) => void;
  backToOverview: () => void;
  uploadMoveAnnotation: (_: { epd: string; san: string; text: string }) => void;
  startBrowsing: (
    side: Side,
    mode: BrowsingMode,
    options?: { pgnToPlay?: string; import?: boolean; keepPosition?: boolean }
  ) => void;
  showImportView?: boolean;
  startImporting: (side: Side) => void;
  updateRepertoireStructures: () => void;
  epdIncidences: BySide<Record<string, number>>;
  epdNodes: BySide<Record<string, boolean>>;
  onMove: () => void;
  getMyResponsesLength: (side?: Side) => number;
  getNumResponsesBelowThreshold: (
    threshold: number,
    side: Side | null
  ) => number;
  getLineCount: (side?: Side) => number;
  getIsRepertoireEmpty: (side?: Side) => boolean;
  analyzeLineOnLichess: (line: string[], side?: Side) => void;
  analyzeMoveOnLichess: (fen: string, move: string, turn: Side) => void;
  backOne: () => void;
  backToStartPosition: () => void;
  deleteRepertoire: (side: Side) => void;
  deleteMove: (response: RepertoireMove) => Promise<void>;
  trimRepertoire: (threshold: number, sides: Side[]) => Promise<void>;
  exportPgn: (side: Side) => void;
  addTemplates: () => void;
  onRepertoireUpdate: () => void;
  editingSide?: Side;
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  hasCompletedRepertoireInitialization?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  playerTemplates?: PlayerTemplate[];
  selectedTemplates: Record<string, string>;
  conflictingId?: string;
  // The first position where the user does not have a response for
  divergencePosition?: string;
  divergenceIndex?: number;
  ecoCodes: EcoCode[];
  pawnStructures: PawnStructureDetails[];
  ecoCodeLookup: Record<string, EcoCode>;
  pawnStructureLookup: Record<string, PawnStructureDetails>;
  browsingState: BrowsingState;
  reviewState: ReviewState;
  deleteMoveState: {
    modalOpen: boolean;
    response?: RepertoireMove;
    isDeletingMove: boolean;
  };
  updateShareLink: () => void;
  //
  overviewState: {
    isShowingShareModal: boolean;
  };

  repertoireSettingsModalSide?: Side;
  // Nav bar stuff
  getBreadCrumbs: (mobile: boolean) => NavBreadcrumb[];

  fetchDebugGames: () => void;
  // fetchDebugPawnStructureForPosition: () => void;
  selectDebugGame: (i: number) => void;
  pastFreeTier: (side: Side) => boolean;
}

export interface NavBreadcrumb {
  text: string;
  unclickable?: boolean;
  onPress?: () => void;
}

export interface AddNewLineChoice {
  title: string;
  line: string;
  active?: boolean;
  incidence?: number;
}

export enum AddedLineStage {
  Initial,
  AddAnother,
}

export interface FetchRepertoireResponse {
  repertoire: Repertoire;
  grades: BySide<RepertoireGrade>;
  shareId: string;
}

interface GetSharedRepertoireResponse {
  repertoire: Repertoire;
}

export const DEFAULT_ELO_RANGE = [1300, 1500] as [number, number];

type Stack = [RepertoireState, AppState];
const selector = (s: AppState): Stack => [s.repertoireState, s];

export const getInitialRepertoireState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn(selector(s)));
  };
  const setOnly = <T,>(fn: (stack: RepertoireState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn(selector(s)));
  };
  const initialState = {
    ...createQuick<RepertoireState>(setOnly),
    expectedNumMoves: { white: 0, black: 0 },
    numMyMoves: { white: 0, black: 0 },
    numMovesFromEpd: { white: {}, black: {} },
    numMovesDueFromEpd: { white: {}, black: {} },
    earliestReviewDueFromEpd: { white: {}, black: {} },
    expectedNumMovesFromEpd: { white: {}, black: {} },
    // All epds that are covered or arrived at (epd + epd after)
    epdNodes: { white: {}, black: {} },
    epdIncidences: { white: {}, black: {} },
    deleteMoveState: {
      modalOpen: false,
      isDeletingMove: false,
    },
    ecoCodes: [],
    addedLineState: null,
    numResponsesAboveThreshold: undefined,
    pawnStructures: [],
    isUpdatingEloRange: false,
    repertoire: undefined,
    browsingState: getInitialBrowsingState(_set, _get),
    reviewState: getInitialReviewState(_set, _get),
    overviewState: {
      isShowingShareModal: false,
    },
    repertoireGrades: { white: null, black: null },
    ecoCodeLookup: {},
    pawnStructureLookup: {},
    pendingResponses: {},
    positionReports: { white: {}, black: {} },
    lineReports: {},
    onboarding: {
      isOnboarding: false,
    },
    currentLine: [],
    // hasCompletedRepertoireInitialization: failOnTrue(true),
    initState: () =>
      set(([s]) => {
        s.repertoire = undefined;
        s.fetchRepertoire(true);
        s.fetchSupplementary();
      }, "initState"),
    usePlayerTemplate: (id: string, responsive: Responsive) =>
      set(async ([s]) => {
        const { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/openings/use_player_template",
          {
            id,
          }
        );
        set(([s]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.browsingState.finishSidebarOnboarding(responsive);
        });
      }, "usePlayerTemplate"),
    addTemplates: () =>
      set(async ([s]) => {
        const { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/openings/add_templates",
          {
            templates: Object.values(s.selectedTemplates),
          }
        );
        set(([s]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.backToOverview();
          s.hasCompletedRepertoireInitialization = true;
        });
      }, "addTemplates"),
    initializeRepertoire: ({
      lichessUsername,
      blackPgn,
      whitePgn,
      responsive,
    }) =>
      set(async ([s]) => {
        let lichessGames = [];
        const chessComGames = [];
        if (lichessUsername) {
          const max = 200;
          const { data }: { data: string } = await client.get(
            `https://lichess.org/api/games/user/${encodeURIComponent(
              lichessUsername
            )}?max=${max}&perfType=ultrabullet,bullet,blitz,rapid,classical,correspondence`,
            {
              headers: { Accept: "application/x-ndjson" },
            }
          );
          lichessGames = data
            .split("\n")
            .filter((s) => s.length > 2)
            .map((s) => JSON.parse(s));
        }
        const { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/initialize_repertoire",
          {
            lichessGames,
            lichessUsername,
            chessComGames,
            whitePgn,
            blackPgn,
          }
        );
        set(([s, gs]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          const minimumToTrim = 10;
          const side: Side = blackPgn ? "black" : "white";
          const numBelowThreshold = s.getNumResponsesBelowThreshold(
            gs.userState.getCurrentThreshold(),
            null
          );
          if (side && numBelowThreshold > minimumToTrim) {
            s.browsingState.pushView(TrimRepertoireOnboarding);
          } else {
            s.browsingState.pushView(ImportSuccessOnboarding);
          }
        }, "initializeRepertoire");
      }),
    getBreadCrumbs: (mobile: boolean) =>
      get(([s]) => {
        const homeBreadcrumb = {
          text: (
            <div
              class={clsx(
                "square-5 col pr-10px -m-2 box-content items-center justify-center p-2"
              )}
            >
              <Logo />
            </div>
          ),
          onPress: () => {
            set(([s, appState]) => {
              s.backToOverview();
            });
          },
        };

        const breadcrumbs: NavBreadcrumb[] = [homeBreadcrumb];
        const mode = s.browsingState.sidebarState.mode;
        const side = s.browsingState.sidebarState.activeSide;
        if (side) {
          breadcrumbs.push({
            text: capitalize(side),
            onPress: () => {
              quick((s) => {
                s.repertoireState.startBrowsing(side, "overview");
              });
            },
          });
        }
        const unclickableModes: BrowsingMode[] = ["review"];
        if (mode && mode !== "overview" && mode !== "home") {
          const unclickable = unclickableModes.includes(mode);
          breadcrumbs.push({
            text: capitalize(modeToUI(mode)),
            unclickable,
            onPress: unclickable
              ? undefined
              : () => {
                  quick((s) => {
                    s.repertoireState.startBrowsing(side, mode);
                    s.repertoireState.browsingState.chessboard.resetPosition();
                  });
                },
          });
        }
        return breadcrumbs;
      }),
    updateShareLink: () =>
      set(([s]) => {
        client.post(`/api/v1/openings/update-share-link`).then(({ data }) => {
          set(([s]) => {
            s.repertoireShareId = data.id;
          });
        });
      }),
    analyzeMoveOnLichess: (fen: string, move: string, turn: Side) =>
      set(([s]) => {
        const bodyFormData = new FormData();
        bodyFormData.append(
          "pgn",
          `
          [Variant "From Position"]
          [FEN "${fen}"]

          ${turn === "white" ? "1." : "1..."} ${move}
        `
        );
        const windowReference = window.open("about:blank", "_blank");
        client
          .post(`https://lichess.org/api/import`, bodyFormData)
          .then(({ data }) => {
            const url = data["url"];
            windowReference.location = `${url}/${turn}#999`;
          });
      }),
    analyzeLineOnLichess: (line: string[], _side?: Side) =>
      set(([s]) => {
        if (isEmpty(line)) {
          // TODO: figure out a way to open up analysis from black side
          window.open(`https://lichess.org/analysis`, "_blank");
          return;
        }
        const side = _side ?? sideOfLastmove(line);
        window.open(
          `https://lichess.org/analysis/pgn/${line.join("_")}?color=${side}`,
          "_blank"
        );
      }),
    onMove: () =>
      set(([s]) => {
        // if (s.debugPawnStructuresState) {
        //   // s.fetchDebugPawnStructureForPosition();
        // }
      }, "onMove"),
    updateRepertoireStructures: () =>
      set(([s, gs]) => {
        if (!s.repertoire) {
          return;
        }
        const threshold = gs.userState.getCurrentThreshold();
        mapSides(s.repertoire, (repertoireSide: RepertoireSide, side: Side) => {
          const seenEpds: Set<string> = new Set();
          const numMovesByEpd = {};
          const recurse = (
            epd: string,
            seenEpds: Set<string>,
            lastMove: RepertoireMove
          ) => {
            if (shouldDebugEpd(epd)) {
              console.log(
                "[updateRepertoireStructures], this is bting debugged",
                epd
              );
            }
            if (seenEpds.has(epd)) {
              return { numMoves: 0, additionalExpectedNumMoves: 0 };
            }
            const incidence = lastMove?.incidence ?? 1;
            let totalNumMovesFromHere = 0;
            const newSeenEpds = new Set(seenEpds);
            newSeenEpds.add(epd);
            const allMoves = filter(
              repertoireSide.positionResponses[epd] ?? [],
              (m) => m.needed
            );
            const [mainMove, ...others] = allMoves;
            let additionalExpectedNumMoves = 0;
            if (mainMove?.mine && !isEmpty(others)) {
              others.forEach((m) => {
                const additional = getExpectedNumMovesBetween(
                  m.incidence,
                  threshold,
                  side,
                  m.epd === START_EPD &&
                    (m.sanPlus === "d4" ||
                      m.sanPlus === "c4" ||
                      m.sanPlus == "Nf3")
                );
                additionalExpectedNumMoves += additional;
              });
            }
            let numMovesExpected = getExpectedNumMovesBetween(
              incidence,
              threshold,
              side,
              epd === START_EPD &&
                some(
                  allMoves,
                  (m) =>
                    m.sanPlus === "d4" ||
                    m.sanPlus === "c4" ||
                    m.sanPlus == "Nf3"
                )
            );
            let childAdditionalMovesExpected = 0;
            allMoves.forEach((m) => {
              if (shouldDebugEpd(epd)) {
                console.log("MOVES", m);
              }
              const { numMoves, additionalExpectedNumMoves } = recurse(
                m.epdAfter,
                newSeenEpds,
                m
              );
              numMovesExpected += additionalExpectedNumMoves;
              childAdditionalMovesExpected += additionalExpectedNumMoves;
              totalNumMovesFromHere += numMoves;
            });
            numMovesByEpd[epd] = totalNumMovesFromHere;
            s.expectedNumMovesFromEpd[side][epd] = numMovesExpected;
            s.numMovesFromEpd[side][epd] = totalNumMovesFromHere;
            return {
              numMoves: totalNumMovesFromHere + (incidence > threshold ? 1 : 0),
              additionalExpectedNumMoves:
                additionalExpectedNumMoves + childAdditionalMovesExpected,
            };
          };
          recurse(START_EPD, seenEpds, null);
        });
        mapSides(s.repertoire, (repertoireSide: RepertoireSide, side: Side) => {
          const seenEpds: Set<string> = new Set();
          const recurse = (
            epd: string,
            seenEpds: Set<string>,
            lastMove: RepertoireMove
          ) => {
            if (shouldDebugEpd(epd)) {
              console.log(
                "[updateRepertoireStructures], this is bting debugged",
                epd
              );
            }
            if (seenEpds.has(epd)) {
              return { dueMoves: new Set<string>(), earliestDueDate: null };
            }
            const newSeenEpds = new Set(seenEpds);
            newSeenEpds.add(epd);
            let earliestDueDate: string | null = null;
            const allMoves = repertoireSide.positionResponses[epd] ?? [];
            let dueMovesFromHere = new Set<string>();
            allMoves.forEach((m) => {
              if (shouldDebugEpd(epd)) {
                console.log("MOVES", m);
              }
              const { dueMoves, earliestDueDate: recursedEarliestDueDate } =
                recurse(m.epdAfter, newSeenEpds, m);
              if (
                (earliestDueDate === null && recursedEarliestDueDate) ||
                recursedEarliestDueDate < earliestDueDate
              ) {
                earliestDueDate = recursedEarliestDueDate;
              }
              dueMovesFromHere = new Set([...dueMovesFromHere, ...dueMoves]);
            });
            s.numMovesDueFromEpd[side][epd] = dueMovesFromHere.size;
            s.earliestReviewDueFromEpd[side][epd] = earliestDueDate;
            if (shouldDebugEpd(epd)) {
              console.log("earliestDueDate", earliestDueDate);
            }
            const due = lastMove?.srs?.needsReview;
            if (due) {
              dueMovesFromHere.add(`${lastMove.epd}-${lastMove.sanPlus}`);
            }
            return {
              dueMoves: dueMovesFromHere,
              earliestDueDate: earliestDueDate ?? lastMove?.srs?.dueAt,
            };
          };
          recurse(START_EPD, seenEpds, null);
        });
        s.myResponsesLookup = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            return flatten(
              Object.values(repertoireSide.positionResponses)
            ).filter((m: RepertoireMove) => m.mine);
          }
        );
        s.epdNodes = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            const nodeEpds = {};
            const allEpds = flatten(
              Object.values(repertoireSide.positionResponses)
            ).flatMap((m) => [m.epd, m.epdAfter]);
            allEpds.forEach((epd) => {
              nodeEpds[epd] = true;
            });
            return nodeEpds;
          }
        );
        s.numResponses = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            return flatten(Object.values(repertoireSide.positionResponses))
              .length;
          }
        );
        s.numMyMoves = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            return filter(
              flatten(Object.values(repertoireSide.positionResponses)),
              (m) => m.mine
            ).length;
          }
        );
        s.numResponsesAboveThreshold = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            return flatten(
              Object.values(repertoireSide.positionResponses)
            ).filter((m) => m.needed).length;
          }
        );
      }, "updateRepertoireStructures"),

    trimRepertoire: (threshold: number, sides: Side[]) =>
      set(([s]) => {
        return client
          .post("/api/v1/openings/trim", {
            threshold,
            sides,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              if (s.browsingState.sidebarState.mode !== "review") {
                s.browsingState.onPositionUpdate();
              }
            });
          })
          .finally(() => {});
      }, "deleteMoveConfirmed"),
    deleteMove: (response: RepertoireMove) =>
      set(([s]) => {
        s.deleteMoveState.isDeletingMove = true;
        return client
          .post("/api/v1/openings/delete_move", {
            response: response,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              if (s.browsingState.sidebarState.mode !== "review") {
                s.browsingState.onPositionUpdate();
              }
            });
          })
          .finally(() => {
            set(([s]) => {
              s.deleteMoveState.isDeletingMove = false;
              s.deleteMoveState.response = null;
              s.deleteMoveState.modalOpen = false;
            });
          });
      }, "deleteMoveConfirmed"),
    deleteRepertoire: (side: Side) =>
      set(([s]) => {
        client
          .post("/api/v1/openings/delete", {
            sides: [side],
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
            });
          });
      }, "deleteRepertoire"),
    exportPgns: () => set(([s]) => {}),
    exportPgn: (side: Side) =>
      set(([s]) => {
        let pgn = dedent`
        [Event "${side} Repertoire"]
        [Site "chessbook.com"]
        [Date ""]
        [Round "N/A"]
        [White "N/A"]
        [Black "N/A"]
        [Result "*"]
        `;
        pgn += "\n\n";

        const seenEpds = new Set();
        const recurse = (epd, line, seenEpds) => {
          const [mainMove, ...others] =
            s.repertoire[side].positionResponses[epd] ?? [];
          const newSeenEpds = new Set(seenEpds);
          newSeenEpds.add(epd);
          if (!mainMove) {
            return;
          }
          const mainLine = [...line, mainMove.sanPlus];
          pgn = pgn + getLastMoveWithNumber(lineToPgn(mainLine)) + " ";
          forEach(others, (variationMove) => {
            if (seenEpds.has(variationMove.epdAfter)) {
              return;
            }
            const variationLine = [...line, variationMove.sanPlus];
            seenEpds.add(variationMove.epdAfter);
            pgn += "(";
            if (sideOfLastmove(variationLine) === "black") {
              const n = Math.floor(variationLine.length / 2);

              pgn +=
                `${n}... ` +
                getLastMoveWithNumber(lineToPgn(variationLine)).trim() +
                " ";
            } else {
              pgn += getLastMoveWithNumber(lineToPgn(variationLine)) + " ";
            }

            recurse(variationMove.epdAfter, variationLine, seenEpds);
            pgn = pgn.trim();
            pgn += ") ";
          });
          if (seenEpds.has(mainMove.epdAfter)) {
            return;
          }
          if (
            !isEmpty(others) &&
            sideOfLastmove(lineToPgn(mainLine)) === "white"
          ) {
            pgn += `${getMoveNumber(lineToPgn(mainLine))}... `;
          }

          seenEpds.add(mainMove.epdAfter);
          recurse(mainMove.epdAfter, mainLine, seenEpds);
        };
        recurse(START_EPD, [], seenEpds);
        pgn = pgn.trim() + " *";
        console.log("pgn", pgn);

        const downloadLink = document.createElement("a");

        const csvFile = new Blob([pgn], { type: "text" });

        const url = window.URL.createObjectURL(csvFile);
        downloadLink.download = `${side}.pgn`;
        downloadLink.href = url;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
      }, "exportPgn"),

    getPawnStructure: (epd: string) =>
      get(([s]) => {
        const pawnEpd = getPawnOnlyEpd(epd);
        let pawnStructure = s.pawnStructureLookup[pawnEpd];
        if (pawnStructure) {
          return { reversed: false, pawnStructure };
        }
        const reversed = reversePawnEpd(pawnEpd);
        pawnStructure = s.pawnStructureLookup[reversed];
        if (pawnStructure) {
          return { reversed: true, pawnStructure };
        }
        return {};
      }),
    uploadMoveAnnotation: ({
      epd,
      san,
      text,
    }: {
      epd: string;
      san: string;
      text: string;
    }) =>
      get(([s]) => {
        client
          .post("/api/v1/openings/move_annotation", {
            text: text,
            epd: epd,
            san,
          })
          .then(({ data }: { data: any }) => {
            set(([s]) => {
              s.positionReports[s.browsingState.sidebarState.activeSide][
                epd
              ]?.suggestedMoves?.forEach((sm) => {
                if (sm.sanPlus === san) {
                  sm.annotation = text;
                }
              });
              s.browsingState.onPositionUpdate();
            });
          });
      }),
    backToOverview: () =>
      set(([s, gs]) => {
        s.startBrowsing(null, "home");
        gs.navigationState.push("/");
        if (s.browsingState.sidebarState.mode == "review") {
          s.reviewState.stopReviewing();
        }
        s.showImportView = false;
        s.browsingState.clearViews();
        s.backToStartPosition();
        s.browsingState.sidebarState.activeSide = null;
        s.divergencePosition = null;
        s.divergenceIndex = null;
        s.browsingState.sidebarState = makeDefaultSidebarState();
      }),
    startImporting: (side: Side) =>
      set(([s]) => {
        s.startBrowsing(side, "build", { import: true });
        s.browsingState.chessboard.resetPosition();
      }, "startImporting"),
    startBrowsing: (side: Side, mode: BrowsingMode, options) =>
      set(([s, gs]) => {
        s.browsingState.sidebarState.view = null;

        if (
          (mode === "overview" || mode === "home") &&
          !options?.keepPosition
        ) {
          s.browsingState.chessboard.resetPosition();
        }
        s.browsingState.sidebarState.showPlansState = {
          visible: false,
          coverageReached: false,
          hasShown: false,
        };
        // TODO: should just reset to a default state here, instead of doing it one by one
        s.browsingState.sidebarState.mode = mode;
        s.browsingState.sidebarState.activeSide = side;
        s.browsingState.sidebarState.addedLineState.visible = false;
        s.browsingState.sidebarState.isPastCoverageGoal = false;
        s.browsingState.onPositionUpdate();
        s.browsingState.chessboard.set((c) => {
          c.flipped = s.browsingState.sidebarState.activeSide === "black";
        });
        if (options?.import) {
          // just don't show the chessboard
        } else if (mode === "browse" || mode === "build") {
          if (options?.pgnToPlay) {
            s.browsingState.chessboard.playPgn(options.pgnToPlay, {
              animated: true,
            });
          }
        }
        // if (mode === "home") {
        //   gs.navigationState.push(`/`);
        // } else {
        //   gs.navigationState.push(`/openings/${side}/${mode}`);
        // }
      }, "startBrowsing"),
    onRepertoireUpdate: () =>
      set(([s]) => {
        s.updateRepertoireStructures();
        s.browsingState.fetchNeededPositionReports();
        s.browsingState.updateRepertoireProgress();
        s.browsingState.updateTableResponses();
      }),
    fetchSupplementary: () =>
      set(([s]) => {
        return client.get("/api/v1/openings/supplementary").then(
          ({
            data,
          }: {
            data: {
              ecoCodes: EcoCode[];
              pawnStructures: PawnStructureDetails[];
            };
          }) => {
            set(([s]) => {
              s.ecoCodes = data.ecoCodes;
              s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
              s.pawnStructures = data.pawnStructures;
              s.pawnStructureLookup = {};
              s.browsingState.onPositionUpdate();
              forEach(s.pawnStructures, (e) => {
                forEach(e.pawnEpds, (pawnEpd) => {
                  s.pawnStructureLookup[pawnEpd] = e;
                });
              });
            });
          }
        );
      }),
    fetchEcoCodes: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/eco_codes")
          .then(({ data }: { data: EcoCode[] }) => {
            set(([s]) => {
              s.ecoCodes = data;
              s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
            });
          });
      }),
    fetchDebugGames: () =>
      set(([s]) => {
        // s.debugPawnStructuresState = {
        //   games: [],
        //   loadingGames: true,
        //   byPosition: {},
        //   mode: "games",
        //   i: 0,
        // };
        // client
        //   .post("/api/v1/debug/master_games", {
        //     move_number: NUM_MOVES_DEBUG_PAWN_STRUCTURES,
        //   })
        //   .then(({ data }: { data: any }) => {
        //     set(([s]) => {
        //       s.debugPawnStructuresState.i = 0;
        //       s.debugPawnStructuresState.loadingGames = false;
        //       s.debugPawnStructuresState.games = sortBy(data.games, (g) => {
        //         return !some(g.pawnStructures, (s) => s.passed);
        //       });
        //       if (s.debugPawnStructuresState.mode === "games") {
        //         s.selectDebugGame(0);
        //       }
        //     });
        //   });
      }),
    selectDebugGame: (i: number) =>
      set(([s]) => {
        // const { game, pawnStructures } = s.debugPawnStructuresState.games[i];
        // s.debugPawnStructuresState.i = i;
        // s.debugPawnStructuresState.game = game;
        // s.debugPawnStructuresState.moves = NUM_MOVES_DEBUG_PAWN_STRUCTURES;
        // s.debugPawnStructuresState.pawnStructures = sortBy(
        //   pawnStructures,
        //   (p) => {
        //     return !p.passed;
        //   }
        // );
        // s.debugPawnStructuresState.r
        // s.chessboardState.playPgn(
        //   lineToPgn(take(game.moves, NUM_MOVES_DEBUG_PAWN_STRUCTURES))
        // );
      }),
    fetchSharedRepertoire: (id: string) =>
      set(([s]) => {
        Promise.all([
          s.fetchSupplementary(),

          client
            .get(`/api/v1/openings/shared/${id}`)
            .then(({ data }: { data: GetSharedRepertoireResponse }) => {
              set(([s]) => {
                s.repertoire = data.repertoire;
                s.onRepertoireUpdate();
              });
            })
            .catch(() => {
              set(([s]) => {
                s.failedToFetchSharedRepertoire = true;
              });
            }),
        ]).then(() => {
          set(([s, appState]) => {
            // window.location.search = "";
            s.startBrowsing("white", "build");
          });
        });
      }),
    // startLichessOauthFlow: () =>
    //   set(([s]) => {
    //     let pkce = pkceChallenge();
    //     let redirectUri = window.location.origin + "/oauth/lichess/callback";
    //     let lichessOauthData = {
    //       codeVerifier: pkce.code_verifier,
    //       redirectUri: redirectUri,
    //       clientId: "chess-madra",
    //       codeChallenge: pkce.code_challenge,
    //     } as LichessOauthData;
    //     let url = `https://lichess.org/oauth/authorize?response_type=code&client_id=chess-madra&redirect_uri=${encodeURIComponent(
    //       redirectUri
    //     )}&scope=email:read&state=&code_challenge=${
    //       pkce.code_challenge
    //     }&code_challenge_method=S256`;
    //     window.sessionStorage.setItem(
    //       "lichess-oauth-data",
    //       JSON.stringify(lichessOauthData)
    //     );
    //     window.location.href = url;
    //   }),
    fetchRepertoire: (initial?: boolean) =>
      set(([s, appState]) => {
        const user = appState.userState.user;
        client
          .get("/api/v1/openings")
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              console.log("setting repertoire for user");
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.repertoireShareId = data.shareId;
              s.hasCompletedRepertoireInitialization = true;
              s.onRepertoireUpdate();
              if (!s.getIsRepertoireEmpty()) {
                appState.userState.pastLandingPage = true;
              }
              if (TEST_MODE) {
                s.startBrowsing("white", TEST_MODE);
              } else if (!isEmpty(TEST_LINE)) {
                window.setTimeout(() => {
                  s.startBrowsing("white", "build", {
                    pgnToPlay: lineToPgn(TEST_LINE),
                  });
                }, 100);
              }
            });
          });
      }),
    pastFreeTier: (side: Side) =>
      get(([s]) => {
        if (!s.repertoire) {
          return false;
        }
        const numMoves = s.numResponses?.[side] ?? 0;
        return numMoves > MAX_MOVES_FREE_TIER;
      }),
    getLineCount: (side?: Side) =>
      get(([s]) => {
        if (!s.repertoire) {
          return 0;
        }
        const seenEpds = new Set();
        let lineCount = 0;
        const recurse = (epd) => {
          if (seenEpds.has(epd)) {
            return;
          }
          seenEpds.add(epd);
          const moves = s.repertoire[side].positionResponses[epd] ?? [];
          if (isEmpty(moves)) {
            return;
          }
          if (lineCount === 0) {
            lineCount = 1;
          }
          const additionalLines =
            filter(moves, (m) => !seenEpds.has(m.epdAfter)).length - 1;
          lineCount += Math.max(0, additionalLines);
          forEach(moves, (variationMove) => {
            // TODO solid
            // recurse(variationMove.epdAfter);
          });
        };
        recurse(START_EPD);
        return lineCount;
      }),
    getNumResponsesBelowThreshold: (threshold: number, side: Side) =>
      get(([s]) => {
        return filter(getAllRepertoireMoves(s.repertoire), (m) => {
          const belowThreshold =
            m.incidence && m.incidence < threshold && m.mine;
          if (side) {
            return belowThreshold && m.side === side;
          } else {
            return belowThreshold;
          }
        }).length;
      }),
    getMyResponsesLength: (side?: Side) =>
      get(([s]) => {
        if (!s.repertoire) {
          return 0;
        }
        if (side) {
          return values(s.repertoire[side].positionResponses)
            .flatMap((v) => v)
            .filter((v) => v.mine).length;
        } else {
          return getAllRepertoireMoves(s.repertoire).length;
        }
      }),
    getIsRepertoireEmpty: (side?: Side) =>
      get(([s]) => {
        if (side) {
          return isEmpty(s.repertoire[side].positionResponses);
        }
        return isEmpty(getAllRepertoireMoves(s.repertoire));
      }),
    backOne: () =>
      set(([s]) => {
        if (s.browsingState.sidebarState.mode === "build") {
          s.browsingState.sidebarState.addedLineState.visible = false;
          s.browsingState.chessboard.backOne();
          return;
        }
      }),
    backToStartPosition: () =>
      set(([s]) => {
        if (s.browsingState.sidebarState.mode !== "review") {
          s.browsingState.chessboard.resetPosition();
          return;
        }
      }),
    selectedTemplates: {},
  } as RepertoireState;

  return initialState;
};

function removeLastMove(id: string) {
  return dropRight(id.split(" "), 1).join(" ");
}

function getLastMoveWithNumber(id: string) {
  const [n, m] = last(id.split(" ")).split(".");
  if (!m) {
    return n;
  }
  return `${n}. ${m}`;
}

export function mapSides<T, Y>(
  bySide: BySide<T>,
  fn: (x: T, side: Side) => Y
): BySide<Y> {
  return {
    white: fn(bySide["white"], "white"),
    black: fn(bySide["black"], "black"),
  };
}
function getMoveNumber(id: string) {
  return Math.floor(id.split(" ").length / 2 + 1);
}

export const getExpectedNumMovesBetween = (
  current: number,
  destination: number,
  side: Side,
  high_transposition: boolean
): number => {
  let m = 1;
  let distance_pow = 1.11;
  if (high_transposition && side === "white") {
    m = 1.5;
    distance_pow = 1.12;
  } else if (side === "black") {
    m = 1.05;
    distance_pow = 1.15;
  }
  const get_distance = (x, y) => {
    const distance = 1 / y / (1 / x);
    return Math.pow(distance, distance_pow);
  };
  const distance = Math.max(0, get_distance(current, destination));
  return m * distance;
};
// window.getExpectedNumMovesBetween = getExpectedNumMovesBetween;
