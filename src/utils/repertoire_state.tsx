import { Move } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import {
  PlayerTemplate,
  RepertoireTemplate,
  PositionReport,
  EcoCode,
  PawnStructureDetails,
} from "app/models";
import { RepertoireMiss } from "./repertoire";
import {
  cloneDeep,
  dropRight,
  isEmpty,
  keyBy,
  last,
  take,
  some,
  map,
  forEach,
  filter,
  shuffle,
  flatten,
  first,
  find,
  values,
  isNil,
  zip,
  sortBy,
  findLast,
  capitalize,
} from "lodash-es";
import {
  BySide,
  getAllRepertoireMoves,
  lineToPgn,
  otherSide,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
  SIDES,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { START_EPD } from "./chess";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { BrowsingState, getInitialBrowsingState } from "./browsing_state";
import { getPawnOnlyEpd, reversePawnEpd } from "./pawn_structures";
import { getPlayRate } from "./results_distribution";
import { trackEvent } from "app/hooks/useTrackEvent";
import { getInitialReviewState, ReviewState } from "./review_state";
let NUM_MOVES_DEBUG_PAWN_STRUCTURES = 10;

export enum AddLineFromOption {
  Initial = "Start Position",
  Current = "Current Position",
  BiggestMiss = "Biggest Gap in Repertoire",
  BiggestMissOpening = "Biggest Gap in Opening",
}

export interface RepertoireState {
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire;
  repertoireNumMoves: BySide<
    Record<
      // TODO) change this to Side
      string,
      { withTranspositions: number; withoutTranspositions: number }
    >
  >;
  positionReports: Record<string, PositionReport>;
  failedToFetchSharedRepertoire?: boolean;
  repertoireGrades: BySide<RepertoireGrade>;
  repertoireShareId?: string;
  fetchSharedRepertoire: (id: string) => void;
  fetchRepertoire: () => void;
  fetchEcoCodes: () => void;
  fetchSupplementary: () => Promise<void>;
  fetchRepertoireTemplates: () => void;
  fetchPlayerTemplates: () => void;
  initializeRepertoire: (_: {
    lichessUsername?: string;
    whitePgn?: string;
    blackPgn?: string;
    state?: RepertoireState;
  }) => void;
  initState: () => void;
  // TODO: move review state stuff to its own module
  usePlayerTemplate: (id: string) => void;
  backToOverview: () => void;
  uploadMoveAnnotation: ({
    epd,
    san,
    text,
  }: {
    epd: string;
    san: string;
    text: string;
  }) => void;
  startBrowsing: (side: Side, skipNavigation?: boolean) => void;
  showImportView?: boolean;
  startImporting: () => void;
  updateRepertoireStructures: () => void;
  onMove: () => void;
  getMyResponsesLength: (side?: Side) => number;
  getIsRepertoireEmpty: () => boolean;
  analyzeLineOnLichess: (line: string[]) => void;
  backOne: () => void;
  backToStartPosition: () => void;
  deleteRepertoire: (side: Side) => void;
  deleteMoveConfirmed: () => void;
  exportPgn: (side: Side) => void;
  addTemplates: () => void;
  onRepertoireUpdate: () => void;
  isEditing?: boolean;
  isBrowsing?: boolean;
  isReviewing?: boolean;
  editingSide?: Side;
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  pendingMoves?: RepertoireMove[];
  hasCompletedRepertoireInitialization?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  playerTemplates?: PlayerTemplate[];
  selectedTemplates: Record<string, string>;
  conflictingId?: string;
  // The first position where the user does not have a response for
  divergencePosition?: string;
  divergenceIndex?: number;
  inProgressUsingPlayerTemplate?: boolean;
  ecoCodes: EcoCode[];
  pawnStructures: PawnStructureDetails[];
  ecoCodeLookup: Record<string, EcoCode>;
  pawnStructureLookup: Record<string, PawnStructureDetails>;
  browsingState: BrowsingState;
  reviewState: ReviewState;
  epdIncidences: BySide<Record<string, number>>;
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
  breadcrumbs: NavBreadcrumb[];
  setBreadcrumbs: (breadcrumbs: NavBreadcrumb[]) => void;

  // Debug pawn structure stuff
  debugPawnStructuresState: any & {};
  fetchDebugGames: () => void;
  // fetchDebugPawnStructureForPosition: () => void;
  selectDebugGame: (i: number) => void;
}

export interface NavBreadcrumb {
  text: string;
  onPress?: () => void;
}

export interface AddNewLineChoice {
  title: string;
  line: string;
  active?: boolean;
  incidence?: number;
}

export enum EditingTab {
  Position = "Position",
  Responses = "Responses",
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
  const homeBreadcrumb = {
    text: "Home",
    onPress: () => {
      set(([s, appState]) => {
        appState.navigationState.push("/directory", { removeParams: true });
      });
    },
  };

  const overviewBreadcrumb = {
    text: "Openings",
  };
  const clickableOverviewBreadcrumb = {
    text: "Openings",
    onPress: () => {
      set(([s, appState]) => {
        appState.navigationState.push("/", { removeParams: true });
        s.backToOverview();
      });
    },
  };
  let initialState = {
    ...createQuick<RepertoireState>(setOnly),
    chessboardState: null,
    deleteMoveState: {
      modalOpen: false,
      isDeletingMove: false,
    },
    ecoCodes: [],
    debugPawnStructuresState: null,
    addedLineState: null,
    isAddingPendingLine: false,
    repertoireNumMoves: null,
    pawnStructures: [],
    isUpdatingEloRange: false,
    repertoire: undefined,
    browsingState: getInitialBrowsingState(_set, _get),
    reviewState: getInitialReviewState(_set, _get),
    overviewState: {
      isShowingShareModal: false,
    },
    breadcrumbs: [homeBreadcrumb, overviewBreadcrumb],
    setBreadcrumbs: (breadcrumbs: NavBreadcrumb[]) =>
      set(([s]) => {
        let atRoot = isEmpty(breadcrumbs);
        if (atRoot) {
          s.breadcrumbs = [homeBreadcrumb, overviewBreadcrumb];
        } else {
          s.breadcrumbs = [clickableOverviewBreadcrumb, ...breadcrumbs];
        }
      }),
    repertoireGrades: { white: null, black: null },
    epdIncidences: { white: {}, black: {} },
    ecoCodeLookup: {},
    pawnStructureLookup: {},
    inProgressUsingPlayerTemplate: false,
    pendingResponses: {},
    positionReports: {},
    currentLine: [],
    // hasCompletedRepertoireInitialization: failOnTrue(true),
    initState: () =>
      set(([s]) => {
        s.fetchRepertoire();
        s.fetchSupplementary();
      }, "initState"),
    usePlayerTemplate: (id: string) =>
      set(async ([s]) => {
        s.inProgressUsingPlayerTemplate = true;
        let { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/openings/use_player_template",
          {
            id,
          }
        );
        set(([s]) => {
          s.inProgressUsingPlayerTemplate = false;
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.backToOverview();
          s.hasCompletedRepertoireInitialization = true;
        });
      }, "usePlayerTemplate"),
    addTemplates: () =>
      set(async ([s]) => {
        let { data }: { data: FetchRepertoireResponse } = await client.post(
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
    initializeRepertoire: ({ lichessUsername, blackPgn, whitePgn }) =>
      set(async ([s]) => {
        let lichessGames = [];
        let chessComGames = [];
        if (lichessUsername) {
          let max = 200;
          let { data }: { data: string } = await client.get(
            `https://lichess.org/api/games/user/${encodeURIComponent(
              lichessUsername
            )}?max=${max}`,
            {
              headers: { Accept: "application/x-ndjson" },
            }
          );
          lichessGames = data
            .split("\n")
            .filter((s) => s.length > 2)
            .map((s) => JSON.parse(s));
        }
        let { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/initialize_repertoire",
          {
            lichessGames,
            lichessUsername,
            chessComGames,
            whitePgn,
            blackPgn,
          }
        );
        set(([s]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.hasCompletedRepertoireInitialization = true;
          s.backToOverview();
        }, "initializeRepertoire");
      }),
    updateShareLink: () =>
      set(([s]) => {
        client.post(`/api/v1/openings/update-share-link`).then(({ data }) => {
          set(([s]) => {
            s.repertoireShareId = data.id;
          });
        });
      }),
    analyzeLineOnLichess: (line: string[]) =>
      set(([s]) => {
        var bodyFormData = new FormData();
        bodyFormData.append("pgn", lineToPgn(line));
        if (isEmpty(line)) {
          // TODO: figure out a way to open up analysis from black side
          window.open(`https://lichess.org/analysis`, "_blank");
          return;
        }
        var windowReference = window.open("about:blank", "_blank");
        let side = s.browsingState.activeSide;
        client
          .post(`https://lichess.org/api/import`, bodyFormData)
          .then(({ data }) => {
            let url = data["url"];
            windowReference.location = `${url}/${side}#999`;
          });
      }),
    onMove: () =>
      set(([s]) => {
        if (s.debugPawnStructuresState) {
          // s.fetchDebugPawnStructureForPosition();
        }
      }, "onMove"),
    updateRepertoireStructures: () =>
      set(([s]) => {
        console.log({ grades: s.repertoireGrades });
        s.epdIncidences = mapSides(
          s.repertoireGrades,
          (repertoireSide: RepertoireGrade) => {
            // .forEach((miss: RepertoireMiss) => {
            //   incidences[miss.epd] = miss.incidence;
            // });
            // console.log({ incidences });
            return repertoireSide.epdIncidences;
          }
        );
        s.myResponsesLookup = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            return flatten(
              Object.values(repertoireSide.positionResponses)
            ).filter((m: RepertoireMove) => m.mine);
          }
        );
        s.repertoireNumMoves = mapSides(
          s.repertoire,
          (repertoireSide: RepertoireSide) => {
            let epdToNumMoves = {};
            let seen_epds = new Set();
            const recurse = (epd, line, mine) => {
              let sum = 0;
              let sumTranspositions = 0;
              map(repertoireSide.positionResponses[epd], (m) => {
                let inc = m.mine ? 1 : 0;
                if (!seen_epds.has(m.epdAfter)) {
                  seen_epds.add(m.epdAfter);
                  let x = recurse(m.epdAfter, [...line, m.sanPlus], m.mine);
                  sum += x.withoutTranspositions + inc;
                  sumTranspositions +=
                    x.withTranspositions - x.withoutTranspositions;
                } else {
                  if (epdToNumMoves[m.epdAfter]) {
                    sumTranspositions +=
                      epdToNumMoves[m.epdAfter].withTranspositions + inc;
                  }
                }
              });
              epdToNumMoves[epd] = {
                withTranspositions: sum + sumTranspositions,
                withoutTranspositions: sum,
              };
              return {
                withTranspositions: sum + sumTranspositions,
                withoutTranspositions: sum,
              };
            };
            recurse(START_EPD, [], false);
            return epdToNumMoves;
          }
        );
      }, "updateRepertoireStructures"),

    deleteMoveConfirmed: () =>
      set(([s]) => {
        let response = s.deleteMoveState.response;
        s.deleteMoveState.isDeletingMove = true;
        client
          .post("/api/v1/openings/delete_move", {
            response: response,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              if (s.isBrowsing) {
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
        let pgn = "";

        let seen_epds = new Set();
        let recurse = (epd, line) => {
          let [mainMove, ...others] =
            s.repertoire[side].positionResponses[epd] ?? [];
          if (!mainMove) {
            return;
          }
          let mainLine = [...line, mainMove.sanPlus];
          pgn = pgn + getLastMoveWithNumber(lineToPgn(mainLine)) + " ";
          forEach(others, (variationMove) => {
            if (seen_epds.has(variationMove.epdAfter)) {
              return;
            }
            let variationLine = [...line, variationMove.sanPlus];
            seen_epds.add(variationMove.epdAfter);
            pgn += "(";
            if (sideOfLastmove(variationLine) === "black") {
              let n = Math.floor(variationLine.length / 2);

              pgn +=
                `${n}... ` +
                getLastMoveWithNumber(lineToPgn(variationLine)).trim() +
                " ";
            } else {
              pgn += getLastMoveWithNumber(lineToPgn(variationLine)) + " ";
            }

            recurse(variationMove.epdAfter, variationLine);
            pgn = pgn.trim();
            pgn += ") ";
          });
          if (
            !isEmpty(others) &&
            sideOfLastmove(lineToPgn(mainLine)) === "white"
          ) {
            pgn += `${getMoveNumber(lineToPgn(mainLine))}... `;
          }

          if (seen_epds.has(mainMove.epdAfter)) {
            return;
          }
          seen_epds.add(mainMove.epdAfter);
          recurse(mainMove.epdAfter, mainLine);
        };
        recurse(START_EPD, []);
        pgn = pgn.trim();

        let downloadLink = document.createElement("a");

        let csvFile = new Blob([pgn], { type: "text" });

        let url = window.URL.createObjectURL(csvFile);
        downloadLink.download = `${side}.pgn`;
        downloadLink.href = url;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
      }, "exportPgn"),

    getPawnStructure: (epd: string) =>
      get(([s]) => {
        let pawnEpd = getPawnOnlyEpd(epd);
        let pawnStructure = s.pawnStructureLookup[pawnEpd];
        if (pawnStructure) {
          return { reversed: false, pawnStructure };
        }
        let reversed = reversePawnEpd(pawnEpd);
        console.log({ reversed });
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
              s.positionReports[epd]?.suggestedMoves?.forEach((sm) => {
                if (sm.sanPlus === san) {
                  sm.annotation = text;
                }
              });
            });
          });
      }),
    backToOverview: () =>
      set(([s, gs]) => {
        gs.navigationState.push("/");
        if (s.isReviewing) {
          s.reviewState.stopReviewing();
        }
        s.setBreadcrumbs([]);
        s.showImportView = false;
        s.browsingState.readOnly = false;
        s.backToStartPosition();
        s.browsingState.activeSide = null;
        s.isEditing = false;
        s.isBrowsing = false;
        s.divergencePosition = null;
        s.divergenceIndex = null;
        s.browsingState.hasPendingLineToAdd = false;
        s.browsingState.pendingResponses = {};
        s.browsingState.addedLineState = null;
      }),
    startImporting: () =>
      set(([s]) => {
        s.showImportView = true;
      }, "startImporting"),
    startBrowsing: (side: Side, skipNavigation: boolean) =>
      set(([s, gs]) => {
        console.log("Starting to browse", side);
        console.log({ skipNavigation });
        console.trace();
        if (!skipNavigation) {
          gs.navigationState.push(`/openings/${side}/browse`);
        }
        let breadcrumbs = [
          {
            text: `${capitalize(side)}`,
          },
        ];
        if (s.browsingState.readOnly) {
          breadcrumbs.unshift({
            text: "Shared repertoire",
          });
        }

        s.setBreadcrumbs(breadcrumbs);
        s.isBrowsing = true;
        s.isEditing = false;
        s.browsingState.activeSide = side;
        s.browsingState.onPositionUpdate();
        s.browsingState.chessboardState.flipped =
          s.browsingState.activeSide === "black";

        if (s.browsingState.activeSide === "white") {
          let startResponses =
            s.repertoire?.[s.browsingState.activeSide]?.positionResponses[
              START_EPD
            ];
          if (startResponses?.length === 1) {
            s.browsingState.chessboardState.makeMove(startResponses[0].sanPlus);
          }
        }
      }, "startBrowsing"),
    // startEditing: (side: Side) =>
    //   set(([s, gs]) => {
    //     gs.navigationState.push(`/openings/${side}/edit`);
    //     s.setBreadcrumbs([
    //       {
    //         text: `${capitalize(side)}`,
    //         onPress: () => {
    //           set(([s]) => {
    //             s.startBrowsing(side);
    //           });
    //         },
    //       },
    //       {
    //         text: `Add new line`,
    //         onPress: null,
    //       },
    //     ]);
    //     s.browsingState.activeSide = side;
    //     s.isBrowsing = false;
    //     s.isEditing = true;
    //     // s.isAddingPendingLine = failOnAny(true);
    //     s.browsingState.editingState = {
    //       ...s.browsingState.editingState,
    //       selectedTab: EditingTab.Responses,
    //       etcModalOpen: false,
    //     };
    //   }),
    onRepertoireUpdate: () =>
      set(([s]) => {
        s.updateRepertoireStructures();
      }),
    fetchRepertoireTemplates: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/template_repertoires")
          .then(({ data }: { data: RepertoireTemplate[] }) => {
            set(([s]) => {
              s.repertoireTemplates = data;
            });
          });
      }),
    fetchPlayerTemplates: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/player_templates")
          .then(({ data }: { data: PlayerTemplate[] }) => {
            set(([s]) => {
              s.playerTemplates = data;
            });
          });
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
        s.debugPawnStructuresState = {
          games: [],
          loadingGames: true,
          byPosition: {},
          mode: "games",
          i: 0,
        };
        client
          .post("/api/v1/debug/master_games", {
            move_number: NUM_MOVES_DEBUG_PAWN_STRUCTURES,
          })
          .then(({ data }: { data: any }) => {
            set(([s]) => {
              s.debugPawnStructuresState.i = 0;
              s.debugPawnStructuresState.loadingGames = false;
              s.debugPawnStructuresState.games = sortBy(data.games, (g) => {
                return !some(g.pawnStructures, (s) => s.passed);
              });
              if (s.debugPawnStructuresState.mode === "games") {
                s.selectDebugGame(0);
              }
            });
          });
      }),
    selectDebugGame: (i: number) =>
      set(([s]) => {
        let { game, pawnStructures } = s.debugPawnStructuresState.games[i];
        s.debugPawnStructuresState.i = i;
        s.debugPawnStructuresState.game = game;
        s.debugPawnStructuresState.moves = NUM_MOVES_DEBUG_PAWN_STRUCTURES;
        s.debugPawnStructuresState.pawnStructures = sortBy(
          pawnStructures,
          (p) => {
            return !p.passed;
          }
        );
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
            s.browsingState.readOnly = true;
            // window.location.search = "";
            s.startBrowsing("white", true);
          });
        });
      }),
    fetchRepertoire: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings")
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.repertoireShareId = data.shareId;
              if (getAllRepertoireMoves(s.repertoire).length > 0) {
                s.hasCompletedRepertoireInitialization = true;
              } else {
                if (!s.hasCompletedRepertoireInitialization) {
                  s.showImportView = true;
                }
              }
              s.onRepertoireUpdate();
              // s.blah();
              // s.startBrowsing("white");
              // s.browsingState.chessboardState.playPgn("1.e4 c5 2.d4 cxd4");
            });
          });
      }),
    getMyResponsesLength: (side?: Side) =>
      get(([s]) => {
        if (side) {
          return values(s.repertoire[side].positionResponses)
            .flatMap((v) => v)
            .filter((v) => v.mine).length;
        } else {
          return getAllRepertoireMoves(s.repertoire).length;
        }
      }),
    getIsRepertoireEmpty: () =>
      get(([s]) => {
        return isEmpty(getAllRepertoireMoves(s.repertoire));
      }),
    backOne: () =>
      set(([s]) => {
        if (s.isBrowsing) {
          s.browsingState.chessboardState.backOne();
          return;
        }
      }),
    backToStartPosition: () =>
      set(([s]) => {
        if (s.isBrowsing) {
          s.browsingState.chessboardState.resetPosition();
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
  let [n, m] = last(id.split(" ")).split(".");
  if (!m) {
    return n;
  }
  return `${n}. ${m}`;
}

function mapSides<T, Y>(bySide: BySide<T>, fn: (x: T) => Y): BySide<Y> {
  return {
    white: fn(bySide["white"]),
    black: fn(bySide["black"]),
  };
}
function getMoveNumber(id: string) {
  return Math.floor(id.split(" ").length / 2 + 1);
}
