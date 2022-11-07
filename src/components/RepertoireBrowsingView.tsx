import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size, isNil } from "lodash-es";
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
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import { PositionOverview, Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { SidebarActions } from "./SidebarActions";
import { BrowserSidebar } from "./BrowsingSidebar";

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

  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft") {
      quick((s) => s.backOne());
    }
  });
  let { side: paramSide } = useParams();
  let reviewQueueFromHere = useRepertoireState(
    (s) =>
      s.reviewState.buildQueue({
        cram: true,
        side: paramSide as Side,
        startPosition: s.browsingState.chessboardState.getCurrentEpd(),
        startLine: s.browsingState.chessboardState.moveLog,
      }),
    { referenceEquality: true }
  );
  useEffect(() => {
    if (
      (paramSide !== activeSide || !isBrowsing) &&
      !repertoireLoading &&
      !shared
    ) {
      quick((s) => {
        console.log("starting browsing");
        s.startBrowsing((paramSide as Side) ?? "white");
      });
    }
  }, [repertoireLoading]);
  // const router = useRouter();
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const loading = repertoireLoading || isNil(activeSide);
  const paddingTop = 140;
  return (
    <RepertoirePageLayout flushTop bottom={null} fullHeight>
      {loading ? null : (
        <View
          style={s(c.containerStyles(responsive.bp), c.alignCenter, c.grow)}
        >
          <View
            style={s(
              vertical ? c.width(c.min(600, "100%")) : c.fullWidth,
              vertical ? c.column : c.row,
              c.grow,
              c.selfStretch,
              c.justifyCenter
            )}
          >
            <View
              style={s(
                c.column,
                !vertical && s(c.grow, c.noBasis, c.flexShrink),
                vertical ? c.width("min(480px, 100%)") : c.maxWidth(440),
                vertical ? c.selfCenter : c.selfStretch
              )}
            >
              <View
                style={s(
                  c.fullWidth,
                  vertical && s(c.selfCenter, c.maxWidth(320)),
                  !vertical && c.pt(paddingTop)
                )}
              >
                <ChessboardView state={chessboardState} />
              </View>
              <Spacer height={12} />
              <ExtraChessboardActions />
              <Spacer height={60} />
              {readOnly && (
                <>
                  <Spacer height={12} />
                  <SwitchSideButton />
                </>
              )}
              {vertical && (
                <>
                  <Spacer height={12} />
                  <BrowserSidebar />
                </>
              )}
            </View>
            {!vertical && (
              <>
                <Spacer width={responsive.switch(24, [BP.lg, 48])} />
                <View
                  // @ts-ignore
                  nativeID="sidebar"
                  style={s(
                    c.column,
                    !vertical && s(c.flexGrow(2), c.flexShrink, c.noBasis),
                    c.bg(c.grays[20]),
                    c.pb(20),
                    c.maxWidth(600)
                  )}
                >
                  <Pressable
                    onPress={() => {
                      quick((s) => {
                        if (s.browsingState.addedLineState.visible) {
                          s.browsingState.addedLineState.visible = false;
                          return;
                        } else if (s.browsingState.deleteLineState.visible) {
                          s.browsingState.deleteLineState.visible = false;
                          return;
                        }
                        if (isEmpty(s.browsingState.chessboardState.moveLog)) {
                          s.backToOverview();
                        } else {
                          s.browsingState.chessboardState.backOne();
                        }
                      });
                    }}
                    style={s(
                      c.height(paddingTop),
                      c.unshrinkable,
                      c.column,
                      c.justifyEnd,
                      c.px(getSidebarPadding(responsive))
                    )}
                  >
                    <CMText style={s()}>
                      <i className="fa fa-arrow-left"></i>
                      <Spacer width={8} />
                      Back
                    </CMText>
                    <Spacer height={44} />
                  </Pressable>
                  <BrowserSidebar />
                  <Spacer height={44} />
                  <SidebarActions />
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </RepertoirePageLayout>
  );
};

export const getSidebarPadding = (responsive: Responsive) => {
  return responsive.switch(8, [BP.lg, 18]);
};

export const ExtraChessboardActions = ({}: {}) => {
  const textStyles = s(c.fontSize(14), c.fg(c.grays[50]), c.weightSemiBold);
  const iconStyles = s(c.fontSize(14), c.fg(c.grays[50]));
  const padding = 8;
  let [currentLine, activeSide] = useRepertoireState((s) => [
    s.browsingState.chessboardState.moveLog,
    s.browsingState.activeSide,
  ]);
  return (
    <View style={s(c.row, c.fullWidth, c.justifyCenter)}>
      <Pressable
        style={s(c.row, c.alignCenter)}
        onPress={() => {
          quick((s) => {
            s.repertoireState.browsingState.chessboardState.resetPosition();
          });
        }}
      >
        <CMText style={s(textStyles)}>Reset board</CMText>
        <Spacer width={padding} />
        <i className="fa fa-arrows-rotate" style={s(iconStyles)}></i>
      </Pressable>
      <Spacer width={18} />
      <Pressable
        style={s(c.row, c.alignCenter)}
        onPress={() => {
          quick((s) => {
            s.repertoireState.analyzeLineOnLichess(currentLine, activeSide);
          });
        }}
      >
        <CMText style={s(textStyles)}>Analyze on lichess</CMText>
        <Spacer width={padding} />
        <i className="fa fa-up-right-from-square" style={s(iconStyles)}></i>
      </Pressable>
    </View>
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
