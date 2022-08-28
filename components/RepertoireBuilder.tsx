import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  capitalize,
  take,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { RepertoireState } from "app/utils/repertoire_state";
import {
  SIDES,
  Side,
  RepertoireMiss,
  formatIncidence,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { RepertoireWizard } from "./RepertoireWizard";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { AppStore } from "app/store";
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import {
  createStaticChessState,
} from "app/utils/chessboard_state";
import { LichessGameCellMini } from "./LichessGameCellMini";
import { CMText } from "./CMText";
import { RepertoireEditingView } from "./RepertoireEditingView";
import { RepertoireBrowsingView } from "./RepertoireBrowsingView";
import { useEloRangeWarning } from "./useEloRangeWarning";
import shallow from "zustand/shallow";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { useRepertoireState } from "app/utils/app_state";

let sectionSpacing = (isMobile) => (isMobile ? 8 : 8);
let cardStyles = s(
  c.bg(c.colors.cardBackground),
  c.overflowHidden,
  c.br(2),
  c.relative
);

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireState(
    (s) => s,
    () => false
  );
  console.log("Rendering repertoire builder");
  let { user, authStatus, token } = AppStore.useState((s) => s.auth);
  useEffect(() => {
    state.setUser(user);
  }, [user]);
  useEffect(() => {
    state.initState();
  }, []);

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
    let backToOverviewRow = (
      <View
        style={s(c.row, c.alignCenter, c.clickable)}
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
      inner = (
        <RepertoireEditingView state={state} {...{ backToOverviewRow }} />
      );
    } else if (state.isBrowsing) {
      inner = <RepertoireBrowsingView />;
    } else if (state.isReviewing) {
      inner = (
        <TrainerLayout
          containerStyles={s(isMobile ? c.alignCenter : c.alignStart)}
          chessboard={
            (state.isEditing || state.isReviewing) && (
              <ChessboardView
                {...{
                  state: state.chessboardState,
                }}
              />
            )
          }
        >
          {backToOverviewRow}
          <Spacer height={12} />
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
                  s.backToOverview();
                  s.startEditing(qm.move.side);
                  s.playPgn(qm.line);
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
        </TrainerLayout>
      );
    } else {
      // Overview
      inner = (
        <View
          style={s(
            c.containerStyles(isMobile),
            isMobile ? c.column : c.row,
            c.justifyCenter
          )}
        >
          <RepertoireOverview />
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
              <ExtraActions />
            </>
          )}
        </View>
      );
    }
  }
  return <PageContainer centered={centered}>{inner}</PageContainer>;
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
      style={s(c.fontSize(isMobile ? 20 : 24), c.fg(c.grays[30]))}
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
        c.buttons.basicSecondary,
        // isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        state.startEditing(side);
      }}
    >
      <CMText
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa fa-pencil" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.basicSecondary.textStyles,
              c.fontSize(isMobile ? 16 : 18),
              c.weightSemiBold
            )}
          >
            Edit
          </CMText>
        </>
      )}
    </Button>
  );
};

export const BrowseButton = ({ side }: { side: Side }) => {
  const isMobile = useIsMobile();
  const { startBrowsing } = useRepertoireState(
    (s) => ({
      startBrowsing: s.startBrowsing,
    }),
    shallow
  );
  return (
    <Button
      style={s(
        c.buttons.basicSecondary,
        // isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        startBrowsing(side);
      }}
    >
      <CMText
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fas fa-eye" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.basicSecondary.textStyles,
              c.fontSize(isMobile ? 16 : 18),
              c.weightSemiBold
            )}
          >
            Browse
          </CMText>
        </>
      )}
    </Button>
  );
};

const RepertoireSideSummary = ({
  side,
  isMobile,
}: {
  side: Side;
  isMobile: boolean;
}) => {
  let state = useRepertoireState((s) => s, shallow);
  let expectedDepth = state.repertoireGrades[side]?.expectedDepth;
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss;

  let numMoves = state.myResponsesLookup?.[side]?.length;
  let instructiveGames = state.repertoireGrades?.[side]?.instructiveGames;
  // let biggestMissRow = createBiggestMissRow(state, side);
  return (
    <View style={s(c.column, c.maxWidth(800), c.fullWidth)}>
      <View
        style={s(
          c.fullWidth,
          isMobile && s(c.row, c.selfStretch, c.justifyStart)
        )}
      >
        <CMText
          style={s(
            c.selfCenter,
            c.fontSize(isMobile ? 22 : 18),
            c.fullWidth,
            !isMobile && c.textAlign("center"),
            isMobile && c.pl(12),
            c.br(2),
            // cardStyles,
            !isMobile && c.border(`1px solid ${c.grays[20]}`),
            c.weightBold,
            c.fg(c.colors.textPrimary),
            c.py(12)
          )}
        >
          {capitalize(side)}
        </CMText>

        {isMobile && (
          <>
            <Spacer width={12} grow />
            <EditButton {...{ state, side }} />
            <Spacer width={12} />
            <BrowseButton {...{ side }} />
          </>
        )}
      </View>
      <View
        style={s(
          isMobile ? c.column : c.row,
          c.overflowHidden,
          c.fullWidth,
          c.selfStretch
        )}
      >
        <View style={s(c.column, c.alignStart, c.justifyCenter)}>
          <Spacer
            width={sectionSpacing(isMobile)}
            height={sectionSpacing(isMobile)}
            {...{ isMobile }}
          />
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
        <Spacer
          height={sectionSpacing(isMobile)}
          width={sectionSpacing(isMobile)}
          isMobile={isMobile}
        />
        {(!isEmpty(instructiveGames) || !isMobile) && (
          <View style={s(c.column, c.grow)}>
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
                    <CMText
                      style={s(
                        c.fg(c.grays[75]),
                        c.maxWidth(240),
                        c.textAlign("center")
                      )}
                    >
                      Once you add some moves to your repertoire, you can find
                      instructive games here
                    </CMText>
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
                  <BrowseButton side={side} />
                  <Spacer height={sectionSpacing(isMobile)} />
                  <EditButton side={side} state={state} />
                </>
              )}
            </View>
          </View>
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

const BiggestMissBoards = ({
  state,
  side,
}: {
  state: RepertoireState;
  side: Side;
}) => {
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
                state.startEditing(side as Side);
                state.playPgn(x.lines[0]);
              });
            return (
              <View style={s(c.column, c.center)} key={`miss-${i}`}>
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
                      state={createStaticChessState({
                        line: biggestMiss.lines[0],
                        side: side as Side,
                      })}
                    />
                  </Pressable>
                </View>
                <Spacer height={12} />
                <View style={s(c.row, c.alignCenter)}>
                  <CMText
                    style={s(
                      c.fg(c.grays[70]),
                      c.weightSemiBold,
                      isMobile ? c.fontSize(14) : c.fontSize(16)
                    )}
                  >
                    Biggest gap – {formatIncidence(biggestMiss.incidence)} of
                    games{" "}
                  </CMText>
                </View>
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
};

const RepertoireOverview = ({}: {}) => {
  const isMobile = useIsMobile();
  const { eloWarning } = useEloRangeWarning({});
  return (
    <View style={s(c.column, c.constrainWidth)}>
      <View style={s(c.column, c.constrainWidth, c.alignCenter)}>
        {isMobile && (
          <>
            <Spacer height={24} />
            <ReviewMovesView {...{ isMobile, side: null }} />
            {eloWarning && (
              <>
                <Spacer height={24} />
                {eloWarning}
              </>
            )}
            <Spacer height={36} />
          </>
        )}
        {intersperse(
          SIDES.map((side, i) => {
            return (
              <RepertoireSideSummary {...{ isMobile }} key={side} side={side} />
            );
          }),
          (i) => {
            return <Spacer height={32} width={12} key={i} {...{ isMobile }} />;
          }
        )}
        {isMobile && (
          <>
            <Spacer height={72} />
            <ImportButton />
          </>
        )}
      </View>
    </View>
  );
};

const ReviewMovesView = ({ side }: { side?: Side }) => {
  console.log("re-rendering review moves view!");
  let [getMyResponsesLength, queueLength, startReview] = useRepertoireState(
    (s) => {
      console.log("In this hook?");
      return [s.getMyResponsesLength, s.getQueueLength(side), s.startReview];
    },
    shallow
  );
  let hasNoMovesThisSide = getMyResponsesLength(side) === 0;
  console.log({ hasNoMovesThisSide });
  if (hasNoMovesThisSide) {
    return null;
  }
  return (
    <>
      {queueLength === 0 ? (
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
            <CMText style={s(c.fg(c.colors.textSecondary), c.fontSize(13))}>
              You've reviewed all your moves! Now might be a good time to add
              moves. Or you can{" "}
              <span
                style={s(
                  c.weightSemiBold,
                  c.fg(c.colors.textPrimary),
                  c.clickable
                )}
                onClick={() => {
                  startReview(side);
                }}
              >
                review your moves anyway.
              </span>
            </CMText>
          </View>
        </View>
      ) : (
        <Button
          style={s(c.buttons.primary, c.selfStretch, c.py(16), c.px(12))}
          onPress={() => {
            startReview(side);
          }}
        >
          {`Review ${pluralize(queueLength, "move")}`}
        </Button>
      )}
    </>
  );
};

const ImportButton = () => {
  const [quick] = useRepertoireState((s) => [s.quick], shallow);
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
        quick((s) => {
          s.startImporting();
        });
      }}
    >
      <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
        <i className="fas fa-plus" />
      </CMText>
      <Spacer width={12} />
      <CMText
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(18),
          c.weightSemiBold
        )}
      >
        Import
      </CMText>
    </Button>
  );
};

const SettingsButton = () => {
  const [quick] = useRepertoireState((s) => [s.quick], shallow);

  const { eloWarning, isEloModalOpen, setIsEloModalOpen, eloModal } =
    useEloRangeWarning({
      separate: true,
    });
  useEffect(() => {
    setOpen(false);
  }, [isEloModalOpen]);
  const { open, setOpen, modal } = useModal({
    content: <>eloWarning</>,
    isOpen: false,
  });
  return (
    <>
      {eloModal}
      <Button
        style={s(
          c.buttons.basicSecondary,
          c.selfEnd,
          c.px(14),
          c.py(12),
          c.selfStretch
        )}
        onPress={() => {
          setIsEloModalOpen(true);
        }}
      >
        <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
          <i className="fas fa-gears" />
        </CMText>
        <Spacer width={12} />
        <CMText
          style={s(
            c.buttons.basicSecondary.textStyles,
            c.fontSize(18),
            c.weightSemiBold
          )}
        >
          Settings
        </CMText>
      </Button>
    </>
  );
};

const ShareRepertoireButton = () => {
  const [quick] = useRepertoireState((s) => [s.quick], shallow);

  return (
    <>
      <ShareRepertoireModal />
      <Button
        style={s(
          c.buttons.basicSecondary,
          c.selfEnd,
          c.px(14),
          c.py(12),
          c.selfStretch
        )}
        onPress={() => {
          quick((s) => {
            s.overviewState.isShowingShareModal = true;
          });
        }}
      >
        <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
          <i className="fas fa-share" />
        </CMText>
        <Spacer width={12} />
        <CMText
          style={s(
            c.buttons.basicSecondary.textStyles,
            c.fontSize(18),
            c.weightSemiBold
          )}
        >
          Share
        </CMText>
      </Button>
    </>
  );
};

const ExtraActions = () => {
  const { eloWarning } = useEloRangeWarning({});
  let [user, getMyResponsesLength] = useRepertoireState(
    (s) => [s.user, s.getMyResponsesLength],
    shallow
  );
  let hasNoMovesAtAll = getMyResponsesLength(null) === 0;
  // let hasNoMovesAtAll = failOnAny(true);
  return (
    <View style={s(c.width(280))}>
      {eloWarning && (
        <>
          {eloWarning}
          <Spacer height={12} />
        </>
      )}
      <ReviewMovesView {...{ side: null }} />
      {!hasNoMovesAtAll && <Spacer height={12} />}
      <ShareRepertoireButton />
      <Spacer height={12} />
      <ImportButton />
      {<Spacer height={12} />}
      <SettingsButton />
    </View>
  );
};
