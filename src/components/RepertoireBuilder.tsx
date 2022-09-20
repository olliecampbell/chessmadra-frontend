import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize } from "lodash-es";
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
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { RepertoireWizard } from "./RepertoireWizard";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import { RepertoireEditingView } from "./RepertoireEditingView";
import { RepertoireBrowsingView } from "./RepertoireBrowsingView";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { useRepertoireState, useDebugState, quick } from "app/utils/app_state";
import { RepertoireReview } from "./RepertoireReview";
import { SideSettingsModal } from "./SideSettingsModal";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { ProfileModal } from "./ProfileModal";

let sectionSpacing = (isMobile) => (isMobile ? 8 : 8);
let cardStyles = s(c.bg(c.grays[12]), c.overflowHidden, c.br(2), c.relative);

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const [underConstruction, debugUi] = useDebugState((s) => [
    s.underConstruction,
    s.debugUi,
  ]);
  const [
    repertoireLoading,
    showImportView,
    isBrowsing,
    isEditing,
    isReviewing,
    initState,
  ] = useRepertoireState((s) => [
    s.repertoire === undefined,
    s.showImportView,
    s.isBrowsing,
    s.isEditing,
    s.isReviewing,
    s.initState,
  ]);
  useEffect(() => {
    if (repertoireLoading) {
      initState();
    }
  }, []);

  let inner = null;
  let centered = false;
  const etcChildren = (
    <>
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <ProfileModal />
      <DeleteMoveConfirmationModal />
    </>
  );
  if (underConstruction && !debugUi) {
    inner = (
      <View style={s(c.column, c.center)}>
        {!isMobile && <Spacer height={48} />}
        <i
          className="fa-sharp fa-hammer"
          style={s(c.fontSize(32), c.fg(c.grays[80]))}
        />
        <Spacer height={12} />
        <CMText style={s(c.fontSize(18), c.weightSemiBold)}>
          Under construction
        </CMText>
        <Spacer height={12} />
        <CMText style={s()}>
          Doing some housekeeping, will be down for a while. Everything will be
          much snappier when we're back!
        </CMText>
      </View>
    );
  } else if (repertoireLoading) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (showImportView) {
    inner = <RepertoireWizard />;
  } else {
    if (isEditing) {
      return (
        <>
          {etcChildren}
          <RepertoireEditingView />
        </>
      );
    } else if (isBrowsing) {
      return (
        <>
          {etcChildren}
          <RepertoireBrowsingView />
        </>
      );
    } else if (isReviewing) {
      inner = <RepertoireReview />;
    } else {
      // Overview
      inner = (
        <View
          style={s(
            c.oldContainerStyles(isMobile),
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
  return (
    <PageContainer
      centered={centered}
      {...{
        hideIcons: isEditing || isBrowsing,
        hideNavBar: isEditing || isBrowsing,
      }}
    >
      {etcChildren}
      {inner}
    </PageContainer>
  );
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
};

export const EditButton: React.FC<EditButtonProps> = ({ side }) => {
  const isMobile = useIsMobile();
  const track = useTrack();
  const [startEditing] = useRepertoireState((s) => [s.startEditing]);
  return (
    <Button
      style={s(
        c.buttons.basic,
        // isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        track("overview.edit_repertoire");
        startEditing(side);
      }}
    >
      <CMText
        style={s(c.buttons.basic.textStyles, c.fontSize(isMobile ? 16 : 18))}
      >
        <i className="fa-sharp fa-solid fa-compass-drafting" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.basic.textStyles,
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

export const SideSettingsButton = ({ side }: { side: Side }) => {
  const isMobile = useIsMobile();
  const [quick] = useRepertoireState((s) => [s.quick]);
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
        quick((s) => {
          s.repertoireSettingsModalSide = side;
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.basicSecondary.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa-sharp fa-wrench" />
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
            More
          </CMText>
        </>
      )}
    </Button>
  );
};

export const BrowseButton = ({ side }: { side: Side }) => {
  const isMobile = useIsMobile();
  const { startBrowsing } = useRepertoireState((s) => ({
    startBrowsing: s.startBrowsing,
  }));
  const track = useTrack();
  return (
    <Button
      style={s(
        c.buttons.basic,
        // isMobile && c.bg(c.grays[70]),
        isMobile ? c.selfCenter : c.selfStretch,
        c.py(isMobile ? 12 : 16),
        c.px(24)
      )}
      onPress={() => {
        track("overview.browse_repertoire");
        startBrowsing(side);
      }}
    >
      <CMText
        style={s(c.buttons.basic.textStyles, c.fontSize(isMobile ? 16 : 18))}
      >
        <i className="fa-sharp fa-solid fa-compass" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.basic.textStyles,
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
  let [expectedDepth, biggestMiss, numMoves] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.expectedDepth,
    s.repertoireGrades[side]?.biggestMiss,
    s.myResponsesLookup?.[side]?.length,
  ]);
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
            <EditButton {...{ side }} />
            <Spacer width={12} grow />
            <BrowseButton {...{ side }} />
            <Spacer width={12} />
            <SideSettingsButton {...{ side }} />
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
          {biggestMiss && <BiggestMissBoards {...{ side }} />}
        </View>
        <Spacer
          height={sectionSpacing(isMobile)}
          width={sectionSpacing(isMobile)}
          isMobile={isMobile}
        />
        {!isMobile && (
          <View style={s(c.column, c.grow, c.width(260))}>
            <View style={s(c.column, c.grow, isMobile && c.selfStretch)}>
              <Spacer height={sectionSpacing(isMobile)} />
              <EditButton side={side} />
              <Spacer height={sectionSpacing(isMobile)} />
              <BrowseButton side={side} />
              <Spacer height={sectionSpacing(isMobile)} />
              <SideSettingsButton side={side} />
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

const BiggestMissBoards = ({ side }: { side: Side }) => {
  const [biggestMiss, quick] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.biggestMiss,
    s.quick,
  ]);
  const isMobile = useIsMobile();
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
              quick((s) => {
                s.startEditing(side as Side);
                s.chessboardState.playPgn(x.lines[0]);
                trackEvent("overview.go_to_biggest_miss");
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
  return (
    <View style={s(c.column, c.constrainWidth)}>
      <View style={s(c.column, c.constrainWidth, c.alignCenter)}>
        {isMobile && (
          <>
            <Spacer height={24} />
            <ReviewMovesView {...{ isMobile, side: null }} />
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
            <ShareRepertoireButton />
            <Spacer height={12} />
            <ImportButton />
            <Spacer height={12} />
            <SettingsButton />
          </>
        )}
      </View>
    </View>
  );
};

const ReviewMovesView = ({ side }: { side?: Side }) => {
  let [getMyResponsesLength, queueLength, startReview] = useRepertoireState(
    (s) => {
      return [s.getMyResponsesLength, s.getQueueLength(side), s.startReview];
    },
    true
  );
  let hasNoMovesThisSide = getMyResponsesLength(side) === 0;
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
              className="fa-sharp fa-check"
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
            trackEvent("overview.review_moves");
          }}
        >
          {`Review ${pluralize(queueLength, "move")}`}
        </Button>
      )}
    </>
  );
};

const ImportButton = () => {
  const [quick] = useRepertoireState((s) => [s.quick]);
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
          trackEvent("overview.import_to_repertoire");
        });
      }}
    >
      <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
        <i className="fa-sharp fa-plus" />
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
  return (
    <>
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
            s.userState.profileModalOpen = true;
          });
        }}
      >
        <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
          <i className="fa-sharp fa-gears" />
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
  const [quick] = useRepertoireState((s) => [s.quick]);

  return (
    <>
      <ShareRepertoireModal />
      <SideSettingsModal />
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
            trackEvent("overview.share_repertoire");
          });
        }}
      >
        <CMText style={s(c.buttons.basicSecondary.textStyles, c.fontSize(20))}>
          <i className="fa-sharp fa-share" />
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
  let [getMyResponsesLength] = useRepertoireState((s) => [
    s.getMyResponsesLength,
  ]);
  let hasNoMovesAtAll = getMyResponsesLength(null) === 0;
  // let hasNoMovesAtAll = failOnAny(true);
  return (
    <View style={s(c.width(280))}>
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
