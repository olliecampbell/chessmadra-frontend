import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  otherSide,
  RepertoireMiss,
  Side,
} from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import {
  getAppropriateEcoName,
  getNameEcoCodeIdentifier,
} from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";
import { quick, useDebugState, useRepertoireState } from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { BP, useResponsive } from "app/utils/useResponsive";
import { PositionOverview, Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";

const VERTICAL_BREAKPOINT = BP.md;

export const RepertoireBrowsingView = ({ shared }: { shared?: boolean }) => {
  const [
    activeSide,
    isBrowsing,
    quick,
    readOnly,
    failedToFetch,
    backToOverview,
    chessboardState,
    repertoireLoading,
  ] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.isBrowsing,
    s.quick,
    s.browsingState.readOnly,
    s.failedToFetchSharedRepertoire,
    s.backToOverview,
    s.browsingState.chessboardState,
    s.repertoire === undefined,
  ]);
  let reviewQueueFromHere = useRepertoireState(
    (s) =>
      s.reviewState.buildQueue({
        cram: true,
        side: s.browsingState.activeSide,
        startPosition: s.browsingState.chessboardState.getCurrentEpd(),
        startLine: s.browsingState.chessboardState.moveLog,
      }),
    { referenceEquality: true }
  );
  let { side: paramSide } = useParams();
  useEffect(() => {
    if (
      (paramSide !== activeSide || !isBrowsing) &&
      !repertoireLoading &&
      !shared
    ) {
      quick((s) => {
        s.startBrowsing((paramSide as Side) ?? "white");
      });
    }
  }, [repertoireLoading]);
  // const router = useRouter();
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  return (
    <RepertoirePageLayout bottom={<RepertoireEditingBottomNav />}>
      <View style={s(c.containerStyles(responsive.bp), c.alignCenter)}>
        <View
          style={s(
            vertical ? c.width(c.min(600, "100%")) : c.fullWidth,
            vertical ? c.column : c.row
          )}
        >
          <View
            style={s(
              c.column,
              !vertical && s(c.grow, c.noBasis, c.flexShrink),
              vertical ? c.width("min(480px, 100%)") : c.maxWidth(600),
              vertical ? c.selfCenter : c.selfStretch
            )}
          >
            <View
              style={s(
                c.fullWidth,
                vertical && s(c.selfCenter, c.maxWidth(320))
              )}
            >
              <ChessboardView state={chessboardState} />
            </View>
            <Spacer height={12} />
            <BackControls
              includeAnalyze
              includeReview={
                responsive.isMobile && reviewQueueFromHere?.length > 0
              }
            />
            {!readOnly &&
              reviewQueueFromHere?.length > 0 &&
              !responsive.isMobile && (
                <>
                  <Spacer height={12} />
                  <ReviewFromHereButton />
                </>
              )}
            {readOnly && (
              <>
                <Spacer height={12} />
                <SwitchSideButton />
              </>
            )}
            {vertical && (
              <>
                <Spacer height={12} />
                <ResultsView />
              </>
            )}
          </View>
          {!vertical && (
            <>
              <Spacer width={responsive.switch(24, [BP.xl, 48])} />
              <View
                style={s(
                  c.column,
                  !vertical && s(c.flexGrow(2), c.flexShrink, c.noBasis),
                  c.maxWidth(700)
                  // c.width(
                  //   `min(${responsive.bp >= BP.xxl ? 1000 : 800}px, 100%)`
                  // )
                )}
              >
                <PositionOverview card={true} />
                <Spacer height={responsive.switch(24)} />
                <ResultsView />
              </View>
            </>
          )}
        </View>
      </View>
    </RepertoirePageLayout>
  );
};

export const ReviewFromHereButton = () => {
  const responsive = useResponsive();
  const buttonStyles = s(
    c.buttons.darkFloater,
    c.selfStretch,
    // c.height(buttonHeight),
    { textStyles: s(c.fg(c.colors.textPrimary)) },
    c.px(8),
    c.py(12)
  );
  const [activeSide] = useRepertoireState((s) => [s.browsingState.activeSide]);
  return (
    <Button
      style={s(buttonStyles)}
      onPress={() => {
        quick((s) => {
          s.repertoireState.reviewState.startReview(
            s.repertoireState.browsingState.activeSide,
            {
              side: activeSide,
              cram: true,
              startLine:
                s.repertoireState.browsingState.chessboardState.moveLog,
              startPosition:
                s.repertoireState.browsingState.chessboardState.getCurrentEpd(),
            }
          );
        });
      }}
    >
      <CMText style={s(c.fg(c.grays[80]), c.fontSize(18))}>
        <i className={"fa-duotone fa-cards-blank"} />
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.fontSize(responsive.switch(16)),
          c.weightBold
        )}
      >
        Review all from here
      </CMText>
    </Button>
  );
};

export const SwitchSideButton = () => {
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;
  const track = useTrack();
  const [side, q] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.quick,
  ]);
  return (
    <Button
      style={s(
        c.buttons.darkFloater,
        // isMobile && c.bg(c.grays[70]),
        c.selfStretch,
        !isMobile && c.py(16),
        c.px(24)
      )}
      onPress={() => {
        q((s) => {
          track("browsing.switched_side");
          s.startBrowsing(otherSide(side));
          s.browsingState.chessboardState.resetPosition();
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.darkFloater.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa-sharp fa-solid fa-arrows-rotate" />
      </CMText>
      {!isMobile && (
        <>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.darkFloater.textStyles,
              c.fontSize(isMobile ? 16 : 18),
              c.weightSemiBold
            )}
          >
            Switch side
          </CMText>
        </>
      )}
    </Button>
  );
};

export const ResultsView = React.memo(function () {
  const [selectedTab, quick, readOnly] = useRepertoireState((s) => [
    s.browsingState.selectedTab,
    s.quick,
    s.browsingState.readOnly,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;
  let tabs = [
    BrowsingTab.Responses,
    ...(isMobile ? [BrowsingTab.Position] : []),
    // BrowsingTab.Lines,
    // ...(!isMobile ? [BrowsingTab.Misses] : []),
    // BrowsingTab.InstructiveGames,
  ];
  return (
    <View style={s(c.column)}>
      {!readOnly && tabs.length > 1 && (
        <>
          <SelectOneOf
            tabStyle
            containerStyles={s(c.fullWidth, c.justifyBetween)}
            choices={tabs}
            activeChoice={selectedTab}
            separator={() => {
              // if (isMobile) {
              //   return null;
              // }
              return null;
            }}
            horizontal
            onSelect={(tab) => {}}
            renderChoice={(tab, active, i) => {
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    quick((s) => {
                      s.browsingState.selectedTab = tab;
                    });
                  }}
                  style={s(
                    c.column,
                    c.grow,
                    c.alignCenter,
                    c.py(responsive.switch(8, [BP.lg, 12])),
                    // c.bg(active ? c.grays[95] : "transparent"),
                    c.br(0),
                    c.borderBottom(
                      `2px solid ${active ? c.grays[95] : "transparent"}`
                    ),
                    c.zIndex(5),
                    c.px(isMobile ? 0 : 48)
                  )}
                >
                  <CMText
                    style={s(c.fg(c.grays[85]), c.fontSize(16), c.weightBold)}
                  >
                    {tab}
                  </CMText>
                </Pressable>
              );
            }}
          />
        </>
      )}
      <View style={s(c.br(tabs.length === 1 ? 2 : 0), c.brb(2), c.pt(24))}>
        {selectedTab === BrowsingTab.Responses && <Responses />}
        {selectedTab === BrowsingTab.Position && <PositionOverview />}
        {selectedTab === BrowsingTab.Lines && <BrowsingSectionsView />}
        {selectedTab === BrowsingTab.Misses && <BrowsingMissesView />}
        {selectedTab === BrowsingTab.InstructiveGames && (
          <InstructiveGamesView />
        )}
      </View>
    </View>
  );
});

export const InstructiveGamesView = React.memo(() => {
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column, c.alignCenter)}>
      {!isMobile && <Spacer height={48} />}
      <i
        style={s(c.fontSize(32), c.fg(c.grays[80]))}
        className="fa-sharp fa-hammer"
      ></i>
      <Spacer height={12} />
      <CMText style={s(c.fontSize(16), c.weightSemiBold)}>Coming soon</CMText>
    </View>
  );
});

export const BrowsingMissesView = React.memo(() => {
  const [sections, biggestMisses] = useRepertoireState((s) => [
    s.browsingState.sections,
    s.repertoireGrades[s.browsingState.activeSide]?.biggestMisses,
  ]);
  const isMobile = useIsMobile();
  let misses = sortBy(biggestMisses, (miss) => -miss.incidence);
  return (
    <View
      style={s({
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "24px 12px",
      })}
    >
      {misses.map((miss, i) => {
        return <MissView key={i} miss={miss} />;
      })}
    </View>
  );
});

export const BrowsingSectionsView = React.memo(() => {
  const [sections, quick, readOnly] = useRepertoireState((s) => [
    s.browsingState.sections,
    s.quick,
    s.browsingState.readOnly,
  ]);
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column)}>
      {isEmpty(sections) && (
        <View
          style={s(
            c.px(12),
            c.py(12),
            c.maxWidth(400),
            c.selfStretch,
            // c.bg(c.grays[10]),
            // c.border(`1px solid ${c.grays[10]}`),
            c.br(2)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <View style={s(c.column, c.constrainWidth)}>
              <CMText
                style={s(
                  c.fontSize(22),
                  c.fg(c.colors.textInverse),
                  c.weightBold
                )}
              >
                No lines found
              </CMText>
              <Spacer height={12} />
              <CMText
                style={s(
                  c.fontSize(14),
                  c.lineHeight("1.3rem"),
                  c.fg(c.colors.textInverse)
                )}
              >
                You don't have any saved lines from this position.
              </CMText>
            </View>
          </View>
        </View>
      )}
      {sections &&
        intersperse(
          sections.map((section, i) => {
            return (
              <SectionView key={section.ecoCode?.fullName} section={section} />
            );
          }),
          (i) => {
            return <Spacer height={isMobile ? 48 : 48} key={i} />;
          }
        )}
    </View>
  );
});

const SectionView = ({ section }: { section: BrowserSection }) => {
  let [expanded, setExpanded] = useState(false);
  const responsive = useResponsive();
  const isMobile = useIsMobile();
  let MAX_TRUNCATED = 2;
  let truncated = section.lines.length > MAX_TRUNCATED && !expanded;
  let numTruncated = section.lines.length - MAX_TRUNCATED;
  let lines = section.lines;
  if (!expanded) {
    lines = take(section.lines, MAX_TRUNCATED);
  }
  return (
    <View style={s()}>
      <View style={s(c.row, c.alignCenter)}>
        <CMText
          style={s(
            c.fg(c.colors.textInverse),
            c.fontSize(isMobile ? 16 : 18),
            c.weightBold
          )}
        >
          {section.ecoCode
            ? getNameEcoCodeIdentifier(section.ecoCode.fullName)
            : "Others"}
        </CMText>
        <Spacer width={8} />
        <CMText
          style={s(
            c.fg(c.colors.textInverseSecondary),
            c.fontSize(isMobile ? 16 : 18),
            c.weightThin
          )}
        >
          ({section.lines.length})
        </CMText>
      </View>
      <Spacer height={isMobile ? 12 : 18} />
      <View
        style={s({
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px 24px",
        })}
      >
        {lines.map((line) => {
          return (
            <View style={s()} key={line.pgn}>
              <LineView line={line} />
            </View>
          );
        })}
      </View>
      <Spacer height={isMobile ? 12 : 12} />
      {truncated && (
        <Pressable
          style={s(
            c.borderBottom(`1px solid ${c.grays[70]}`),
            c.pb(1),
            c.selfCenter
          )}
          onPress={() => {
            trackEvent(`browsing.show_more_lines`);
            setExpanded(true);
          }}
        >
          <CMText style={s(c.fontSize(12), c.fg(c.grays[40]))}>
            Show more ({numTruncated})
          </CMText>
        </Pressable>
      )}
    </View>
  );
};

const MissView = ({ miss }: { miss: RepertoireMiss }) => {
  const [activeSide, quick] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.quick,
  ]);
  const onPress = () => {};
  const isMobile = useIsMobile();
  const ref = useRef();
  const entry = useIntersectionObserver(ref, { freezeOnceVisible: true });

  const responsive = useResponsive();
  const isVisible = !!entry?.isIntersecting;

  const chessboardSize = isMobile ? 120 : 120;
  return (
    <Pressable
      ref={ref}
      onPress={() => {
        quick((s) => {
          s.browsingState.selectedTab = BrowsingTab.Responses;
          s.browsingState.chessboardState.playPgn(miss.lines[0]);
          trackEvent(`browsing.miss_tapped`);
        });
      }}
      style={s(
        c.bg(c.grays[97]),
        c.height(chessboardSize),
        c.lightCardShadow,
        c.br(2),
        c.overflowHidden,
        c.row,
        c.clickable
      )}
    >
      <View
        style={s(
          c.column,
          c.py(isMobile ? 12 : 12),
          c.flexible,
          c.grow,
          c.px(isMobile ? 12 : 12)
        )}
      >
        <View style={s(c.row)}>
          <CMText
            style={s(c.fontSize(16), c.weightBold, c.fg(c.colors.textInverse))}
          >
            {miss.ecoCodeName ? miss.ecoCodeName : "Overall"}
          </CMText>
        </View>
        <Spacer height={responsive.switch(12, [BP.md, 12])} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 12 : 14),
            c.weightRegular,
            c.flexible,
            c.overflowHidden,
            c.fg(c.grays[40]),
            c.lineHeight("1.3rem")
          )}
        >
          {miss.lines[0]}
          {/*line.pgn*/}
          {/*line.pgn.replace(
            line.deleteMove?.sanPlus,
            `[${line.deleteMove?.sanPlus}]`
          )*/}
        </CMText>
        <Spacer height={4} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 14 : 14),
            c.weightBold,
            c.fg(c.grays[30]),
            c.selfEnd
          )}
        >
          {formatIncidence(miss.incidence)} of games
        </CMText>
      </View>
      <View style={s(c.size(chessboardSize))}>
        {isVisible && (
          <ChessboardView
            onSquarePress={() => {
              onPress();
            }}
            state={createStaticChessState({
              epd: miss.epd,
              side: activeSide,
            })}
          />
        )}
      </View>
    </Pressable>
  );
};

const LineView = ({ line }: { line: BrowserLine }) => {
  const [activeSide, quick] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.quick,
  ]);
  const onPress = () => {};
  const isMobile = useIsMobile();
  const ref = useRef();
  const entry = useIntersectionObserver(ref, { freezeOnceVisible: true });

  const isVisible = !!entry?.isIntersecting;

  const responsive = useResponsive();
  const chessboardSize = responsive.switch(120, [BP.lg, 160]);
  const debugUi = useDebugState((s) => s.debugUi);
  return (
    <Pressable
      ref={ref}
      onPress={() => {
        quick((s) => {
          if (s.browsingState.readOnly) {
            trackEvent(`shared_repertoire.line_tapped`);
            s.analyzeLineOnLichess(line.line);
          } else {
            s.browsingState.selectedTab = BrowsingTab.Responses;
            s.browsingState.chessboardState.playPgn(line.pgn);
            trackEvent(`browsing.line_tapped`);
          }
        });
      }}
      style={s(
        c.bg(c.grays[97]),
        c.height(chessboardSize),
        c.cardShadow,
        c.lightCardShadow,
        c.br(2),
        c.overflowHidden,
        c.row,
        c.clickable
      )}
    >
      <View
        style={s(
          c.column,
          c.flexible,
          c.grow,
          c.p(responsive.switch(12, [BP.lg, 24]))
        )}
      >
        <View style={s(c.row)}>
          <CMText
            style={s(c.fontSize(16), c.weightBold, c.fg(c.colors.textInverse))}
          >
            {line.ecoCode?.fullName
              ? getAppropriateEcoName(line.ecoCode?.fullName)[1].join(", ")
              : ""}
          </CMText>
          <Spacer width={12} grow />

          <Pressable
            style={s()}
            onPress={() => {
              quick((s) => {
                console.log({ line });
                s.deleteMoveState.modalOpen = true;
                s.deleteMoveState.response = line.deleteMove;
                trackEvent(`browsing.line_delete_tapped`);
              });
            }}
          >
            <i
              style={s(c.fontSize(16), c.fg(c.failureShades[60]))}
              className="fa-sharp fa-trash"
            ></i>
          </Pressable>
        </View>
        <Spacer height={responsive.switch(12, [BP.md, 12])} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 12 : 14),
            c.weightRegular,
            c.fg(c.grays[40]),
            c.flexible,
            c.overflowHidden,
            c.lineHeight("1.3rem")
          )}
        >
          {debugUi
            ? line.pgn.replace(
                line.deleteMove?.sanPlus,
                `[${line.deleteMove?.sanPlus}]`
              )
            : line.pgn}
        </CMText>
      </View>
      <View style={s(c.size(chessboardSize))}>
        {isVisible && (
          <ChessboardView
            onSquarePress={() => {
              onPress();
            }}
            state={createStaticChessState({
              epd: line.epd,
              side: activeSide,
            })}
          />
        )}
      </View>
    </Pressable>
  );
};

const RevokedLinkWarning = () => {
  const [backToOverview] = useRepertoireState((s) => [s.backToOverview]);
  let [quick] = useAppState((s) => [s.quick]);
  return (
    <View style={s(c.center, c.selfCenter, c.px(12), c.py(12), c.row)}>
      <CMText style={s(c.fontSize(36), c.fg(c.grays[90]))}>
        <i className="fa-light fa-face-confused" />
      </CMText>
      <Spacer width={18} />
      <View style={s(c.column, c.maxWidth(400))}>
        <CMText
          style={s(
            c.weightSemiBold,
            c.fontSize(18),
            c.fg(c.colors.textPrimary)
          )}
        >
          Can't find this repertoire
        </CMText>
        <Spacer height={8} />
        <CMText style={s(c.fg(c.colors.textSecondary))}>
          Looks like this link has been revoked, if you want to see this user's
          repertoire you'll need to get another link from them. In the meantime,
          you can{" "}
          <Pressable
            onPress={() => {
              quick((s) => {
                s.repertoireState.backToOverview();
                s.navigationState.push("/");
              });
            }}
          >
            <CMText
              style={s(
                c.fg(c.colors.textPrimary),
                c.weightSemiBold,
                c.borderBottom(`1px solid ${c.grays[70]}`)
              )}
            >
              work on your own repertoire.
            </CMText>
          </Pressable>
        </CMText>
      </View>
    </View>
  );
};
