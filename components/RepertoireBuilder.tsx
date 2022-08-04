import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  ChessboardView,
  PieceView,
} from "app/components/chessboard/Chessboard";
import {
  cloneDeep,
  map,
  isEmpty,
  isNil,
  takeRight,
  dropRight,
  capitalize,
  drop,
  last,
  keys,
  take,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { keyBy, groupBy } from "lodash";
import { intersperse } from "app/utils/intersperse";
import {
  RepertoireState,
  useRepertoireState,
} from "app/utils/repertoire_state";
import {
  RepertoireGrade,
  RepertoireMove,
  getAllRepertoireMoves,
  RepertoireSide,
  lineToPgn,
  pgnToLine,
  SIDES,
  Side,
  RepertoireMiss,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { Modal } from "./Modal";
import { RepertoireWizard } from "./RepertoireWizard";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { AppStore } from "app/store";
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { failOnAny, failOnTrue } from "app/utils/test_settings";
import { ChessboardState, createChessState } from "app/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { MOCK_RETURNED_GAMES } from "app/mocks/games";
import { LichessGameCell } from "./LichessGameCell";
import { LichessGameCellMini } from "./LichessGameCellMini";
import { CMText } from "./CMText";

let sectionSpacing = (isMobile) => (isMobile ? 8 : 8);
let cardStyles = s(
  c.bg(c.colors.cardBackground),
  c.overflowHidden,
  c.br(2),
  c.relative
);

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireState();
  let { user, authStatus, token } = AppStore.useState((s) => s.auth);
  useEffect(() => {
    state.setUser(user);
  }, [user]);
  useEffect(() => {
    state.initState();
  }, []);

  let countToDelete =
    state.getMovesDependentOnPosition(state.divergencePosition) + 1;
  const {
    open: confirmMoveDeleteModalOpen,
    setOpen: setConfirmMoveDeleteModalOpen,
    modal: confirmMoveDeleteModal,
  } = useModal({
    content: (
      <>
        <View
          style={s(
            c.column,
            c.alignStart,
            c.bg(c.grays[15]),
            c.px(16),
            c.py(16),
            c.br(8)
          )}
        >
          <CMText
            style={s(
              c.fg(c.colors.textPrimary),
              c.flexShrink(1),
              c.fontSize(14),
              c.lineHeight("1.7em")
            )}
          >
            Are you sure you want to delete {pluralize(countToDelete, "move")}{" "}
            starting with {state.moveLog} ?
          </CMText>
          <Spacer height={18} />
          <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
            <Button
              style={s(c.buttons.outlineLight, c.height(36), c.selfEnd)}
              onPress={() => {
                setConfirmMoveDeleteModalOpen(false);
              }}
            >
              <CMText style={s(c.buttons.outlineLight.textStyles)}>
                Cancel
              </CMText>
            </Button>
            <Spacer width={12} grow />
            <Button
              style={s(
                c.buttons.primary,
                c.height(36),
                c.selfEnd,
                c.bg(c.failureShades[50])
              )}
              isLoading={state.isDeletingMove}
              loaderProps={{ color: c.grays[75] }}
              onPress={() => {
                state.deleteCurrentMove(() => {
                  setConfirmMoveDeleteModalOpen(false);
                }, state);
              }}
            >
              <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
            </Button>
          </View>
        </View>
      </>
    ),
    isOpen: false,
  });
  const {
    open: editEtcModalOpen,
    setOpen: setEditEtcModalOpen,
    modal: editEtcModal,
  } = useModal({
    content: (
      <>
        <View
          style={s(
            c.column,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fas fa-arrow-down-to-line"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Export
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Export your {state.activeSide} repertoire to a PGN file. You can
                import this file into a Lichess study, ChessBase, Chessable
                course, etc.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  state.exportPgn(state.activeSide);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Export</CMText>
              </Button>
            </View>
          </View>
        </View>
        <View
          style={s(
            c.column,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-regular fa-trash"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Delete
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Delete your entire {state.activeSide} repertoire. This cannot be
                undone.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(
                  c.buttons.primary,
                  c.bg(c.failureShades[50]),
                  c.height(36),
                  c.selfEnd
                )}
                onPress={() => {
                  state.deleteRepertoire(state.activeSide);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
              </Button>
            </View>
          </View>
        </View>
      </>
    ),
    isOpen: false,
  });
  let grade = state.repertoireGrades[state.activeSide];
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  let inner = null;
  let centered = false;
  let hasNoMovesThisSide = isEmpty(state.myResponsesLookup?.[state.activeSide]);
  if (state.repertoire === undefined) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (state.showImportView) {
    inner = <RepertoireWizard state={state} />;
  } else {
    let innerInner = null;
    let biggestMiss = state.repertoireGrades?.[state.activeSide]?.biggestMiss;
    let biggestMissRow = createBiggestMissRow(state, state.activeSide);
    // let biggestMissRow = null;

    let backToOverviewRow = (
      <View
        style={s(c.row, c.alignCenter, c.clickable, c.mb(12))}
        onClick={() => {
          state.backToOverview();
        }}
      >
        <i
          className="fa-light fa-angle-left"
          style={s(c.fg(c.grays[70]), c.fontSize(16))}
        />
        <Spacer width={8} />
        <CMText style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
          Back to overview
        </CMText>
      </View>
    );
    if (state.isEditing) {
      let backButtonActive = state.position.history().length > 0;
      innerInner = (
        <>
          {backToOverviewRow}
          <View style={s(c.row)}>
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(42),
                c.width(64),
                c.bg(c.grays[80])
              )}
              onPress={() => {
                state.backToStartPosition();
              }}
            >
              <i
                className="fas fa-angles-left"
                style={s(
                  c.fg(backButtonActive ? c.grays[20] : c.grays[20]),
                  c.fontSize(18)
                )}
              />
            </Button>
            <Spacer width={12} />
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(42),
                c.grow,
                c.bg(c.grays[80])
              )}
              onPress={() => {
                state.backOne();
              }}
            >
              <i
                className="fas fa-angle-left"
                style={s(
                  c.fg(backButtonActive ? c.grays[20] : c.grays[20]),
                  c.fontSize(18)
                )}
              />
            </Button>
          </View>
          <Spacer height={12} />
          <View
            style={s(
              c.bg(c.grays[20]),
              c.br(4),
              c.overflowHidden,
              // c.maxHeight(300),
              c.height(isMobile ? 220 : 260),
              c.column
            )}
          >
            {hasNoMovesThisSide && !state.showPendingMoves ? (
              <View
                style={s(c.column, c.selfCenter, c.center, c.grow, c.px(12))}
              >
                <CMText>
                  <i
                    className="fa-light fa-empty-set"
                    style={s(c.fg(c.grays[50]), c.fontSize(24))}
                  />
                </CMText>
                <Spacer height={12} />
                <CMText style={s(c.fg(c.grays[85]))}>
                  You don't have any moves in your repertoire yet! Play a line
                  on the board to add it.
                </CMText>
                <Spacer height={12} />
                <CMText style={s(c.fg(c.grays[85]), c.selfStart)}>
                  {state.activeSide === "black"
                    ? "Maybe start with a response to e4?"
                    : "e4 and d4 are the most popular first moves for white, maybe one of those?"}
                </CMText>
              </View>
            ) : (
              <>
                {state.moveLog && (
                  <View
                    style={s(
                      c.bg(c.grays[15]),
                      c.py(12),
                      c.px(12),
                      c.row,
                      c.alignCenter
                    )}
                  >
                    <CMText
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.weightSemiBold,
                        c.minHeight("1em")
                      )}
                    >
                      {state.moveLog}
                    </CMText>
                    <Spacer grow width={12} />
                    <Button
                      style={s(
                        c.buttons.basic,
                        c.bg("none"),
                        c.border(`1px solid ${c.failureShades[55]}`),
                        c.px(6),
                        c.py(6)
                      )}
                      onPress={() => {
                        setConfirmMoveDeleteModalOpen(true);
                      }}
                    >
                      <i
                        className="fa-regular fa-trash"
                        style={s(c.fg(c.failureShades[55]), c.fontSize(14))}
                      />
                    </Button>
                  </View>
                )}
                <View style={s(c.flexShrink(1), c.grow)}>
                  <View
                    style={s(
                      c.px(12),
                      c.py(8),
                      c.fullHeight,
                      c.fullWidth,

                      c.scrollY
                    )}
                  >
                    <OpeningTree
                      state={state}
                      repertoire={state.repertoire.white}
                      grade={grade}
                    />
                    {!state.showPendingMoves &&
                      isEmpty(
                        state.repertoire[state.activeSide].positionResponses[
                          state.getCurrentEpd(state)
                        ]
                      ) && (
                        <View
                          style={s(
                            c.column,
                            c.selfCenter,
                            c.center,
                            c.grow,
                            c.px(12)
                          )}
                        >
                          <CMText
                            style={s(
                              c.fg(c.grays[75]),
                              c.textAlign("center"),
                              c.weightSemiBold
                            )}
                          >
                            Play a move on the board to add a response
                          </CMText>
                        </View>
                      )}
                  </View>
                </View>
                {!isNil(biggestMiss) &&
                  !state.divergencePosition &&
                  biggestMissRow}
                {state.showPendingMoves && (
                  <>
                    {!isNil(state.numMovesWouldBeDeleted) &&
                      state.numMovesWouldBeDeleted > 0 && (
                        <View
                          style={s(
                            c.mx(6),
                            c.py(4),
                            c.br(2),
                            c.px(6),
                            c.bg(c.yellows[90]),
                            c.row,
                            c.justifyStart,
                            c.alignCenter
                          )}
                        >
                          <i
                            className="fa-regular fa-triangle-exclamation"
                            style={s(c.fontSize(20), c.fg(c.yellows[50]))}
                          ></i>
                          <Spacer width={8} />
                          <CMText
                            style={s(
                              c.fg(c.colors.textInverse),
                              c.fontSize(12)
                            )}
                          >
                            Adding this line will replace{" "}
                            <b>{state.numMovesWouldBeDeleted}</b> responses in
                            your repertoire
                          </CMText>
                        </View>
                      )}
                    <View
                      style={s(
                        c.py(12),
                        c.px(12),
                        c.row,
                        c.justifyEnd,
                        c.alignCenter
                      )}
                    >
                      <Button
                        style={s(c.buttons.primary, c.height(36))}
                        isLoading={state.isAddingPendingLine}
                        loaderProps={{ color: c.grays[75] }}
                        onPress={() => {
                          state.addPendingLine();
                        }}
                      >
                        <CMText style={s(c.buttons.primary.textStyles)}>
                          <i
                            className="fa-regular fa-plus"
                            style={s(c.fg(c.grays[90]))}
                          />
                          <Spacer width={6} />
                          <CMText style={s(c.weightBold)}>Add line</CMText>
                        </CMText>
                      </Button>
                    </View>
                  </>
                )}

                {/*
              {state.currentLine && (
                <CMText style={s(c.weightSemiBold, c.fg(c.colors.textSecondary))}>
                  {lineToPgn(state.currentLine)}
                </CMText>
              )}
              */}
              </>
            )}
          </View>
          <Spacer height={12} />
          <View style={s(c.row, c.fullWidth)}>
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(42),
                c.flexible,
                c.grow,
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.analyzeLineOnLichess(state.activeSide);
              }}
            >
              <CMText
                style={s(
                  c.buttons.basicInverse.textStyles,
                  c.fg(c.colors.textPrimary)
                )}
              >
                <i
                  style={s(c.fontSize(14), c.fg(c.grays[60]))}
                  className="fas fa-search"
                ></i>
                <Spacer width={8} />
                Analyze
              </CMText>
            </Button>
            <Spacer width={12} />
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(42),
                c.flexible,
                c.grow,
                c.grow,
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.searchOnChessable();
              }}
            >
              <CMText
                style={s(
                  c.buttons.basicInverse.textStyles,
                  c.fg(c.colors.textPrimary)
                )}
              >
                <i
                  style={s(c.fontSize(14), c.fg(c.grays[60]))}
                  className="fas fa-book-open"
                ></i>
                <Spacer width={8} />
                Chessable
              </CMText>
            </Button>
          </View>
          <Spacer height={12} />
          <Button
            style={s(
              c.buttons.basicInverse,
              c.height(36),
              c.selfEnd,
              c.bg(c.grays[20])
            )}
            onPress={() => {
              setEditEtcModalOpen(true);
            }}
          >
            <CMText
              style={s(
                c.buttons.basicInverse.textStyles,
                c.fg(c.colors.textPrimary)
              )}
            >
              <i
                style={s(c.fontSize(14), c.fg(c.grays[60]))}
                className="fas fa-ellipsis"
              ></i>
            </CMText>
          </Button>
        </>
      );
    } else if (state.isReviewing) {
      innerInner = (
        <>
          {backToOverviewRow}
          <CMText
            style={s(
              c.fg(c.colors.textPrimary),
              c.weightSemiBold,
              c.fontSize(14)
            )}
          >
            Play the correct response on the board
          </CMText>
          <Spacer height={12} />
          <View style={s(c.row)}>
            <Button
              style={s(
                c.buttons.squareBasicButtons,
                c.buttons.basicInverse,
                c.height("unset"),
                c.selfStretch
              )}
              onPress={() => {
                state.quick((s) => {
                  let qm = s.currentMove;
                  s.backToOverview(s);
                  s.startEditing(qm.move.side, s);
                  s.playPgn(qm.line, s);
                });
              }}
            >
              <CMText style={s(c.buttons.basicInverse.textStyles)}>
                <i className="fa fa-search" />
              </CMText>
            </Button>
            <Spacer width={8} />
            <Button
              style={s(
                state.hasGivenUp ? c.buttons.primary : c.buttons.basicInverse,
                c.grow
              )}
              onPress={() => {
                if (state.hasGivenUp) {
                  state.setupNextMove();
                } else {
                  state.giveUp();
                }
              }}
            >
              <CMText
                style={s(
                  state.hasGivenUp
                    ? c.buttons.primary.textStyles
                    : c.buttons.basicInverse.textStyles
                )}
              >
                {!state.hasGivenUp && false && (
                  <>
                    <i
                      className="fas fa-face-confused"
                      style={s(c.fg(c.grays[50]), c.fontSize(18))}
                    />
                    <Spacer width={8} />
                  </>
                )}
                {state.hasGivenUp ? "Next" : "I don't know"}
              </CMText>
            </Button>
          </View>
        </>
      );
    } else {
      // Overview
      innerInner = (
        <View
          style={s(
            c.containerStyles(isMobile),
            isMobile ? c.column : c.row,
            c.justifyCenter
          )}
        >
          <RepertoireOverview {...{ state }} />
          {!isMobile && (
            <>
              <View
                style={s(
                  c.width(2),
                  c.bg(c.grays[10]),
                  c.selfStretch,
                  c.mx(24)
                )}
              ></View>
              <ExtraActions {...{ state }} />
            </>
          )}
        </View>
      );
    }
    inner = (
      <>
        {/*<Modal
          onClose={() => {
            setUploadModalOpen(false);
          }}
          visible={uploadModalOpen}
        >
        </Modal>*/}
        <TrainerLayout
          containerStyles={s(isMobile ? c.alignCenter : c.alignStart)}
          chessboard={
            (state.isEditing || state.isReviewing) && (
              <ChessboardView
                {...{
                  state: state,
                }}
              />
            )
          }
        >
          {innerInner}
        </TrainerLayout>
        {editEtcModal}
        {confirmMoveDeleteModal}
      </>
    );
  }
  return <PageContainer centered={centered}>{inner}</PageContainer>;
};

const OpeningTree = ({
  repertoire,
  state,
  grade,
}: {
  repertoire: RepertoireSide;
  grade: RepertoireGrade;
  state: RepertoireState;
}) => {
  return (
    <View style={s()}>
      {state.showPendingMoves &&
        (state.pendingResponses[state.divergencePosition] ?? []).map((move) => {
          return (
            <OpeningNode
              key={`pending-${move.epdAfter}`}
              seenEpds={new Set()}
              line={dropRight(
                state.currentLine,
                keys(state.pendingResponses).length
              )}
              state={state}
              grade={grade}
              move={move}
              repertoire={repertoire}
            />
          );
        })}
      {!state.showPendingMoves &&
        (
          state.repertoire[state.activeSide].positionResponses[
            state.getCurrentEpd(state)
          ] ?? []
        ).map((move) => {
          return (
            <OpeningNode
              key={move.epdAfter}
              seenEpds={new Set()}
              line={state.currentLine}
              state={state}
              grade={grade}
              move={move}
              repertoire={repertoire}
            />
          );
        })}
    </View>
  );
};

const OpeningNode = ({
  move,
  grade,
  seenEpds: _seenEpds,
  state,
  repertoire,
  responseQueue,
  line,
}: {
  move: RepertoireMove;
  line?: string[];
  responseQueue?: RepertoireMove[];
  seenEpds: Set<String>;
  grade: RepertoireGrade;
  state: RepertoireState;
  repertoire: RepertoireSide;
}) => {
  // let incidence = grade?.moveIncidence[move.id];
  let responses =
    state.repertoire[state.activeSide].positionResponses[move.epdAfter];
  if (isEmpty(responses)) {
    responses = state.pendingResponses[move.epdAfter];
  }
  let trueDepth = line?.length ?? 0;
  // let trueDepth = 0;
  let assumedDepth = state.currentLine.length;
  let depthDifference = trueDepth - assumedDepth;
  let moveNumber = Math.floor(trueDepth / 2) + 1;
  let cumulativeLine = null;
  let seenEpds = new Set(_seenEpds);
  seenEpds.add(move.epd);
  if (line) {
    cumulativeLine = [...line, move.sanPlus];
  } else {
  }
  // let responses = [];
  return (
    <View style={s(c.pl(2))}>
      <Pressable
        onPress={() => {
          let pgn = lineToPgn(cumulativeLine);
          state.playPgn(pgn);
        }}
      >
        <View
          style={s(
            c.row,
            c.br(2),
            c.px(4),
            // c.bg(c.grays[20]),
            c.my(0),
            c.py(2),
            c.justifyBetween
          )}
        >
          <CMText
            style={s(
              c.fg(
                move.mine || true || move.pending ? c.grays[85] : c.grays[70]
              ),
              c.weightSemiBold

              // move.mine ? c.weightBold : c.weightRegular
            )}
          >
            {trueDepth % 2 === 0 ? `${moveNumber}.` : null}
            {move.sanPlus}
            {responses && depthDifference >= DEPTH_CUTOFF && "…"}
            {move.pending && (
              <CMText style={s(c.opacity(60), c.weightSemiBold)}>
                {" "}
                [pending]
              </CMText>
            )}
          </CMText>
          {/*incidence && !move.mine && (
            <>
              <Spacer width={0} grow />
              <CMText style={s(c.fg(c.colors.textSecondary))}>
                {formatIncidence(incidence)}
              </CMText>
            </>
          )*/}

          {/*
          <Spacer width={12} />
          <CMText style={s(c.clickable)}>
            <i
              style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
              className={`fas fa-trash`}
            ></i>
          </CMText>
          */}
        </View>
      </Pressable>
      {depthDifference < DEPTH_CUTOFF && (
        <View
          style={s(c.pl(10), c.ml(6), c.borderLeft(`1px solid ${c.grays[25]}`))}
        >
          <View style={s()}>
            {intersperse(
              (responses || [])
                .filter((m) => !seenEpds.has(m.epdAfter))
                .map((move) => {
                  return (
                    <OpeningNode
                      key={move.epdAfter}
                      seenEpds={seenEpds}
                      line={cumulativeLine}
                      repertoire={repertoire}
                      state={state}
                      move={move}
                      responseQueue={responseQueue && drop(responseQueue, 1)}
                      grade={grade}
                    />
                  );
                }),
              (i) => {
                return <Spacer key={i} height={0} />;
              }
            )}
          </View>
        </View>
      )}
    </View>
  );
};

let START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

const formatIncidence = (incidence: number) => {
  return `${removeTrailingZeros((incidence * 100).toFixed(1))}%`;
};

const removeTrailingZeros = (n: string) => {
  return n.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
};

export const SideSectionHeader = ({
  header,
  icon: _icon,
}: {
  header: string;
  icon?: any;
}) => {
  const isMobile = useIsMobile();
  let padding = isMobile ? 10 : 12;
  let icon = (
    <i
      className={_icon}
      style={s(c.fontSize(isMobile ? 20 : 24), c.fg(c.grays[70]))}
    />
  );
  if (isEmpty(header)) {
    return (
      <View style={s(c.absolute, c.top(padding), c.right(padding))}>
        {icon}
      </View>
    );
  }
  return (
    <View
      style={s(
        c.row,
        c.brbr(4),
        c.px(padding),
        c.pt(padding),
        c.alignCenter,
        c.justifyBetween,
        c.fullWidth,
        c.selfStart
      )}
    >
      <CMText
        style={s(
          c.fontSize(isMobile ? 16 : 18),
          c.weightBold,
          c.fg(c.colors.textPrimary)
        )}
      >
        {header}
      </CMText>
      <Spacer width={12} />
      {icon}
    </View>
  );
};

type EditButtonProps = {
  side: Side;
  state: RepertoireState;
};

export const EditButton: React.FC<EditButtonProps> = ({ side, state }) => {
  const isMobile = useIsMobile();
  return (
    <Button
      style={s(
        c.buttons.basic,
        isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        state.startEditing(side);
      }}
    >
      <Text style={s(c.fontSize(16), c.fg(c.colors.textInverse))}>
        <i className="fa fa-pencil" />
      </Text>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <Text
            style={s(
              c.fontSize(18),
              c.weightSemiBold,
              c.fg(c.colors.textInverse)
            )}
          >
            Edit
          </Text>
        </>
      )}
    </Button>
  );
};

const RepertoireSideSummary = ({
  side,
  isMobile,
  state,
}: {
  side: Side;
  isMobile: boolean;
  state: RepertoireState;
}) => {
  let expectedDepth = state.repertoireGrades[side]?.expectedDepth;
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss;

  let numMoves = state.myResponsesLookup?.[side]?.length;
  let hasNoMovesThisSide = isEmpty(state.repertoire[side]?.positionResponses);
  let instructiveGames = state.repertoireGrades?.[side]?.instructiveGames;
  // let biggestMissRow = createBiggestMissRow(state, side);
  return (
    <View style={s(c.column, c.maxWidth(800), c.fullWidth)}>
      <View
        style={s(
          isMobile ? c.column : c.row,
          c.overflowHidden,
          c.fullWidth,
          c.selfStretch
        )}
      >
        <View style={s(isMobile && s(c.row, c.selfStretch, c.justifyStart))}>
          <View style={s(c.size(48))}>
            <PieceView
              piece={{ color: side === "white" ? "w" : "b", type: "k" }}
            />
          </View>

          {isMobile && (
            <>
              <Spacer width={0} grow />
              <EditButton {...{ state, side }} />
            </>
          )}
        </View>
        <Spacer
          width={sectionSpacing(isMobile)}
          height={sectionSpacing(isMobile)}
          {...{ isMobile }}
        />
        <View style={s(c.column, c.alignStart, c.justifyCenter)}>
          <View
            style={s(
              c.column,
              cardStyles,
              c.selfStretch,
              c.fullWidth,
              c.grow,
              c.brb(0)
            )}
          >
            <SideSectionHeader header="" icon={null} />
            {
              <View
                style={s(
                  c.row,
                  c.alignCenter,
                  c.justifyCenter,
                  c.grow,
                  c.py(isMobile ? 16 : 32),
                  c.px(32),
                  !isMobile && c.width(400)
                )}
              >
                {intersperse(
                  [
                    <SummaryRow
                      key={"move"}
                      k={plural(numMoves, "Response")}
                      v={numMoves}
                      {...{ isMobile }}
                    />,
                    ...(!isNil(expectedDepth)
                      ? [
                          <SummaryRow
                            {...{ isMobile }}
                            key={"depth"}
                            k="Expected depth"
                            v={
                              expectedDepth === 0
                                ? "0"
                                : expectedDepth.toFixed(2)
                            }
                          />,
                        ]
                      : []),
                    // ...(biggestMiss
                    //   ? [
                    //       <SummaryRow
                    //         k={`Biggest miss, expected in ${(
                    //           biggestMiss.incidence * 100
                    //         ).toFixed(1)}% of games`}
                    //         v={biggestMiss.move.id}
                    //       />,
                    //     ]
                    //   : []),
                  ],
                  (i) => {
                    return <Spacer width={48} key={i} />;
                  }
                )}
              </View>
            }
          </View>
          {biggestMiss && <BiggestMissBoards {...{ state, side }} />}
        </View>
        {instructiveGames && (
          <>
            <Spacer
              height={sectionSpacing(isMobile)}
              width={sectionSpacing(isMobile)}
              isMobile={isMobile}
            />
            <View style={s(c.column, c.grow, isMobile && c.selfStretch)}>
              <View
                style={s(
                  c.column,
                  cardStyles,
                  !isMobile && c.maxWidth(400),
                  c.grow
                )}
              >
                <SideSectionHeader
                  header="Instructive games"
                  icon="fa fa-book-open-reader"
                />
                <Spacer height={isMobile ? 12 : 18} />
                {isEmpty(instructiveGames) && (
                  <View style={s(c.column, c.grow, c.center, c.px(24))}>
                    <Text>
                      <i
                        className="fa-regular fa-empty-set"
                        style={s(c.fg(c.grays[30]), c.fontSize(24))}
                      />
                    </Text>
                    <Spacer height={8} />
                    <Text
                      style={s(
                        c.fg(c.grays[75]),
                        c.maxWidth(240),
                        c.textAlign("center")
                      )}
                    >
                      Once you add some moves to your repertoire, you can find
                      instructive games here
                    </Text>
                    <Spacer height={16} />
                  </View>
                )}
                <View style={s(c.column, c.px(12), c.pb(12))}>
                  {intersperse(
                    take(instructiveGames, 3).map((x, i) => {
                      let link = `https://lichess.org/${x.id}`;
                      if (x.result === -1) {
                        link += "/black";
                      }
                      return (
                        <a href={link} target="_blank" key={x.id}>
                          <LichessGameCellMini
                            showFirstMoves
                            game={x}
                            hideLink
                          />
                        </a>
                      );
                    }),
                    (i) => {
                      return <Spacer height={12} key={i} />;
                    }
                  )}
                </View>
              </View>
              {!isMobile && (
                <>
                  <Spacer height={sectionSpacing(isMobile)} />
                  <EditButton side={side} state={state} />
                </>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const SummaryRow = ({ k, v, isMobile }) => {
  return (
    <View style={s(true ? c.column : c.row, true ? c.alignCenter : c.alignEnd)}>
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.weightBold,
          c.fontSize(isMobile ? 22 : 26)
        )}
      >
        {v}
      </CMText>
      <Spacer width={8} isMobile={isMobile} height={4} />
      <CMText
        style={s(
          c.fg(c.grays[70]),
          c.weightSemiBold,
          isMobile ? c.fontSize(14) : c.fontSize(16),
          c.mb(2)
        )}
      >
        {k}
      </CMText>
    </View>
  );
};

function createBiggestMissRow(state: RepertoireState, side: string) {
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss as RepertoireMiss;
  if (!biggestMiss) {
    return null;
  }
  return (
    <Pressable
      onPress={() => {
        state.quick((s) => {
          state.startEditing(side as Side, s);
          state.playPgn(biggestMiss.lines[0], s);
        });
      }}
    >
      <View
        style={s(
          c.bg(c.grays[15]),
          c.py(12),
          c.px(12),
          c.column,
          c.justifyBetween,
          c.alignCenter
        )}
      >
        <View style={s(c.row, c.selfStart)}>
          <CMText
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            Biggest miss -
          </CMText>
          <Spacer width={4} />
          <CMText
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            {formatIncidence(biggestMiss.incidence)} of games
          </CMText>
        </View>
        <Spacer height={2} />
        <CMText
          style={s(
            c.constrainWidth,
            c.fg(c.colors.textPrimary),
            c.weightSemiBold,
            c.fontSize(13),
            c.weightBold,
            c.selfStart,
            c.pb(2),
            c.overflowHidden,
            c.keyedProp("textOverflow")("ellipsis"),
            c.whitespace("nowrap"),
            c.borderBottom(`1px solid ${c.grays[40]}`)
          )}
        >
          {biggestMiss?.lines[0]}
        </CMText>
      </View>
    </Pressable>
  );
}

enum BiggestMissTagType {
  StartPosition,
  Biggest,
  Critical,
}

const BiggestMissTag = ({ type }: { type: BiggestMissTagType }) => {
  return (
    <View
      style={s(
        // c.bg(c.grays[75]),
        // c.px(12),
        c.py(4),
        c.br(2),
        c.row,
        c.alignCenter,
        c.selfStart
      )}
    >
      <CMText style={s(c.fontSize(16), c.fg(c.grays[40]))}>
        {type === BiggestMissTagType.StartPosition ? (
          <i className="fa fa-flag-checkered" />
        ) : type === BiggestMissTagType.Biggest ? (
          <i className="fa fa-percent" />
        ) : (
          <i className="fa fa-triangle-exclamation" />
        )}
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(c.fontSize(14), c.weightBold, c.fg(c.colors.textSecondary))}
      >
        {type === BiggestMissTagType.StartPosition
          ? "Start position"
          : type === BiggestMissTagType.Biggest
          ? "Biggest miss"
          : "Critical position"}
      </CMText>
    </View>
  );
};

function BiggestMissBoards({
  state,
  side,
}: {
  state: RepertoireState;
  side: string;
}) {
  const isMobile = useIsMobile();
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss as RepertoireMiss;
  if (!biggestMiss) {
    return null;
  }
  return (
    <View
      style={s(c.column, c.alignCenter, cardStyles, c.brt(0), c.selfStretch)}
    >
      <SideSectionHeader header="" icon={null} />
      <View
        style={s(
          c.row,
          c.selfStretch,
          c.alignCenter,
          c.justifyCenter,
          c.px(32),
          c.py(isMobile ? 12 : 24)
        )}
      >
        {intersperse(
          [biggestMiss].map((x, i) => {
            let onClick = () =>
              state.quick((s) => {
                state.startEditing(side as Side, s);
                state.playPgn(x.lines[0], s);
              });
            return (
              <View style={s()}>
                <View style={s(c.size(isMobile ? 120 : 160))}>
                  <Pressable
                    onPress={() => {
                      onClick();
                    }}
                  >
                    <ChessboardView
                      onSquarePress={() => {
                        onClick();
                      }}
                      state={createChessState(
                        null,
                        null,
                        (state: ChessboardState) => {
                          state.position = new Chess();
                          state.frozen = true;
                          state.flipped = side == "black";
                          state.hideCoordinates = true;
                          state.position.loadPgn(biggestMiss.lines[0]);
                        }
                      )}
                    />
                  </Pressable>
                </View>
                <Spacer height={4} />
                <BiggestMissTag
                  type={
                    x.epd === START_EPD
                      ? BiggestMissTagType.StartPosition
                      : BiggestMissTagType.Biggest
                  }
                />
              </View>
            );
          }),
          (i) => {
            return <Spacer width={24} key={i} />;
          }
        )}
      </View>
    </View>
  );
}

const RepertoireOverview = ({ state }: { state: RepertoireState }) => {
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column, c.constrainWidth)}>
      <View style={s(c.column, c.constrainWidth, c.alignCenter)}>
        {isMobile && (
          <>
            <Spacer height={24} />
            <ReviewMovesView {...{ state, isMobile, side: null }} />
            <Spacer height={36} />
          </>
        )}
        {intersperse(
          SIDES.map((side, i) => {
            return (
              <RepertoireSideSummary
                {...{ isMobile }}
                key={side}
                side={side}
                state={state}
              />
            );
          }),
          (i) => {
            return <Spacer height={32} width={12} key={i} {...{ isMobile }} />;
          }
        )}
        {isMobile && (
          <>
            <Spacer height={72} />
            <ImportButton {...{ state }} />
          </>
        )}
      </View>
    </View>
  );
};

const ReviewMovesView = ({
  state,
  isMobile,
  side,
}: {
  state: RepertoireState;
  isMobile: boolean;
  side?: Side;
}) => {
  let hasNoMovesThisSide = state.getMyResponsesLength(side) === 0;
  console.log({ hasNoMovesThisSide });
  if (hasNoMovesThisSide) {
    return null;
  }
  return (
    <>
      {state.getQueueLength(side) === 0 ? (
        <View
          style={s(
            c.bg(c.grays[20]),
            c.br(4),
            c.overflowHidden,
            c.px(16),
            c.py(16),
            c.column,
            c.center
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(
                c.fg(c.grays[50]),
                c.selfCenter,
                c.fontSize(24),
                c.pr(12)
              )}
              className="fas fa-check"
            ></i>
            <Text style={s(c.fg(c.colors.textSecondary), c.fontSize(13))}>
              You've reviewed all your moves! Now might be a good time to add
              moves. Or you can{" "}
              <span
                style={s(
                  c.weightSemiBold,
                  c.fg(c.colors.textPrimary),
                  c.clickable
                )}
                onClick={() => {
                  state.startReview(side);
                }}
              >
                review your moves anyway.
              </span>
            </Text>
          </View>
        </View>
      ) : (
        <Button
          style={s(c.buttons.primary, c.selfStretch, c.py(16), c.px(12))}
          onPress={() => {
            state.startReview(side);
          }}
        >
          {`Review ${pluralize(state.getQueueLength(side), "move")}`}
        </Button>
      )}
    </>
  );
};

const ImportButton = ({ state }: { state: RepertoireState }) => {
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        c.selfEnd,
        c.px(14),
        c.py(12),
        c.selfStretch
      )}
      onPress={() => {
        state.quick((s) => {
          s.startImporting(s);
        });
      }}
    >
      <Text style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
        <i className="fas fa-plus" />
      </Text>
      <Spacer width={12} />
      <Text
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(18),
          c.weightSemiBold
        )}
      >
        Import
      </Text>
    </Button>
  );
};

const ExtraActions = ({ state }: { state: RepertoireState }) => {
  const isMobile = useIsMobile();
  let hasNoMovesAtAll = state.getMyResponsesLength(null) === 0;
  return (
    <View style={s(c.width(220))}>
      <ReviewMovesView {...{ state, isMobile, side: null }} />
      {!hasNoMovesAtAll && <Spacer height={12} />}

      <ImportButton {...{ state }} />
    </View>
  );
};
