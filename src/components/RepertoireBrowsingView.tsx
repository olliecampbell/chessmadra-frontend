import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy } from "lodash-es";
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
import { useDebugState, useRepertoireState } from "app/utils/app_state";
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
    s.activeSide,
    s.isBrowsing,
    s.quick,
    s.browsingState.readOnly,
    s.failedToFetchSharedRepertoire,
    s.backToOverview,
    s.browsingState.chessboardState,
    s.repertoire === undefined,
  ]);
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
  const vertical = responsive.bp <= VERTICAL_BREAKPOINT;
  return (
    <RepertoirePageLayout>
      <View style={s(c.containerStyles(responsive.bp), c.alignCenter)}>
        <View
          style={s(
            vertical ? c.column : c.row,
            vertical ? c.alignCenter : c.alignStart,
            c.constrainWidth,
            c.fullWidth
          )}
        >
          <View
            style={s(
              c.column,
              !vertical && c.grow,
              c.constrainWidth,
              !vertical && s(c.minWidth(340), c.grow)
            )}
          >
            {!responsive.isMobile && (
              <>
                <CMText
                  style={s(
                    c.fg(c.colors.textPrimary),
                    c.fontSize(20),
                    c.weightBold
                  )}
                >
                  Filter
                </CMText>
                <Spacer height={12} />
              </>
            )}
            <View
              style={s(
                c.column,
                c.center,
                vertical ? c.selfCenter : c.selfStretch,
                c.width("min(400px, 100%)")
              )}
            >
              <View style={s(c.fullWidth)}>
                <ChessboardView state={chessboardState} />
              </View>
              <Spacer height={12} />
              <BackControls
                extraButton={
                  responsive.isMobile &&
                  (readOnly ? <SwitchSideButton /> : <EditButton />)
                }
              />
              {!responsive.isMobile && (
                <>
                  <Spacer height={12} />
                  {readOnly && <SwitchSideButton />}
                  {!readOnly && <EditButton />}
                </>
              )}
            </View>
            {responsive.isMobile && (
              <>
                <Spacer height={24} />
                <ResultsView />
              </>
            )}
          </View>
          {!responsive.isMobile && (
            <>
              <Spacer width={responsive.switch(24, [BP.xl, 48])} />
              <View
                style={s(
                  c.column,
                  c.flexShrink(1),
                  c.flexGrow(10)
                  // c.width(
                  //   `min(${responsive.bp >= BP.xxl ? 1000 : 800}px, 100%)`
                  // )
                )}
              >
                <ResultsView />
              </View>
            </>
          )}
        </View>
      </View>
    </RepertoirePageLayout>
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

export const EditButton = () => {
  const isMobile = useIsMobile();
  const [side] = useRepertoireState((s) => [s.browsingState.activeSide]);
  const [q] = useAppState((s) => [s.quick]);
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
          trackEvent(`browsing.to_editor`);
          s.repertoireState.startEditing(side);
          s.repertoireState.chessboardState.playPgn(
            s.repertoireState.browsingState.chessboardState.moveLogPgn
          );
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.darkFloater.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa-sharp fa-solid fa-compass-drafting" />
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(
          c.buttons.darkFloater.textStyles,
          c.fontSize(isMobile ? 16 : 18),
          c.weightSemiBold
        )}
      >
        Edit
      </CMText>
    </Button>
  );
};

export const ResultsView = React.memo(function () {
  const [selectedTab, quick, readOnly] = useRepertoireState((s) => [
    s.browsingState.selectedTab,
    s.quick,
    s.browsingState.readOnly,
  ]);
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column)}>
      {!readOnly && (
        <>
          <SelectOneOf
            tabStyle
            containerStyles={s(c.fullWidth, c.justifyBetween)}
            choices={[
              BrowsingTab.Lines,
              BrowsingTab.Misses,
              BrowsingTab.InstructiveGames,
            ]}
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
                    c.borderBottom(
                      `2px solid ${active ? c.grays[90] : c.grays[20]}`
                    ),
                    c.zIndex(5),
                    c.px(isMobile ? 0 : 48),
                    c.pb(isMobile ? 8 : 8)
                  )}
                >
                  <CMText
                    style={s(
                      c.fg(active ? c.colors.textPrimary : c.grays[70]),
                      c.fontSize(16),
                      c.weightSemiBold
                    )}
                  >
                    {tab}
                  </CMText>
                </Pressable>
              );
            }}
          />
          <Spacer height={isMobile ? 36 : 36} />
        </>
      )}
      {selectedTab === BrowsingTab.Lines && <BrowsingSectionsView />}
      {selectedTab === BrowsingTab.Misses && <BrowsingMissesView />}
      {selectedTab === BrowsingTab.InstructiveGames && <InstructiveGamesView />}
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
  const [sections, quick, readOnly] = useRepertoireState(
    (s) => [s.browsingState.sections, s.quick, s.browsingState.readOnly],
    true
  );
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column)}>
      {isEmpty(sections) && (
        <View
          style={s(
            c.px(12),
            c.py(12),
            c.maxWidth(400),
            c.selfCenter,
            c.bg(c.grays[10]),
            // c.border(`1px solid ${c.grays[10]}`),
            c.br(2)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <View style={s(c.column, c.constrainWidth)}>
              <CMText
                style={s(
                  c.fontSize(22),
                  c.fg(c.colors.textPrimary),
                  c.weightBold
                )}
              >
                No lines found
              </CMText>
              <Spacer height={12} />
              <CMText style={s(c.fontSize(14), c.lineHeight("1.5rem"))}>
                You don't have any saved lines from this position. Open the
                editor to add or edit this line.
              </CMText>
            </View>
          </View>
          <Spacer height={12} />
          <Button
            style={s(
              c.buttons.primary,
              c.selfEnd,
              c.px(16),
              c.py(8),
              c.bg(c.purples[50])
            )}
            onPress={() => {
              quick((s) => {
                trackEvent(`browsing.empty_lines.to_editor`);
                s.startEditing(s.browsingState.activeSide);
                s.chessboardState.playPgn(
                  s.browsingState.chessboardState.position.pgn()
                );
              });
            }}
          >
            <CMText style={s(c.buttons.primary.textStyles)}>Open editor</CMText>
          </Button>
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
  let MAX_TRUNCATED = responsive.bp >= BP.xxl ? 4 : 2;
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
            c.fg(c.colors.textPrimary),
            c.fontSize(isMobile ? 18 : 22),
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
            c.fg(c.colors.textSecondary),
            c.fontSize(isMobile ? 16 : 20),
            c.weightThin
          )}
        >
          ({section.lines.length})
        </CMText>
      </View>
      <Spacer height={isMobile ? 12 : 24} />
      <View
        style={s({
          display: "grid",
          gridTemplateColumns: responsive.bp >= BP.xxl ? "1fr 1fr" : "1fr",
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
      <Spacer height={isMobile ? 12 : 18} />
      {truncated && (
        <Pressable
          style={s(
            c.borderBottom(`1px solid ${c.grays[40]}`),
            c.pb(1),
            c.selfCenter
          )}
          onPress={() => {
            trackEvent(`browsing.show_more_lines`);
            setExpanded(true);
          }}
        >
          <CMText style={s(c.fontSize(12))}>Show more ({numTruncated})</CMText>
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
          s.startEditing(activeSide);
          s.chessboardState.playPgn(miss.lines[0]);
          trackEvent(`browsing.miss_tapped`);
        });
      }}
      style={s(
        c.bg(c.colors.cardBackground),
        c.height(chessboardSize),
        c.cardShadow,
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
            style={s(c.fontSize(16), c.weightBold, c.fg(c.colors.textPrimary))}
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
            c.fg(c.grays[70]),
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
            c.fontSize(isMobile ? 16 : 16),
            c.weightBold,
            c.fg(c.grays[85]),
            c.selfEnd
          )}
        >
          {formatIncidence(miss.incidence)} of games
        </CMText>
      </View>
      <View style={s(c.size(chessboardSize - 2))}>
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
            s.startEditing(activeSide);
            s.chessboardState.playPgn(line.pgn);
            trackEvent(`browsing.line_tapped`);
          }
        });
      }}
      style={s(
        c.bg(c.colors.cardBackground),
        c.height(chessboardSize),
        c.cardShadow,
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
            style={s(c.fontSize(16), c.weightBold, c.fg(c.colors.textPrimary))}
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
              style={s(c.fontSize(16), c.fg(c.failureShades[50]))}
              className="fa-sharp fa-trash"
            ></i>
          </Pressable>
        </View>
        <Spacer height={responsive.switch(12, [BP.md, 12])} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 12 : 14),
            c.weightRegular,
            c.fg(c.grays[70]),
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
      <View style={s(c.size(chessboardSize - 2))}>
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
