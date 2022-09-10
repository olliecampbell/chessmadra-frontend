import React, { useRef, useState } from "react";
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
} from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import {
  getAppropriateEcoName,
  getNameEcoCodeIdentifier,
} from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";
import { useRepertoireState } from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";

export const RepertoireBrowsingView = ({}: {}) => {
  const [
    activeSide,
    isBrowsing,
    quick,
    readOnly,
    failedToFetch,
    backToOverview,
    chessboardState,
  ] = useRepertoireState(
    (s) => [
      s.activeSide,
      s.isBrowsing,
      s.quick,
      s.browsingState.readOnly,
      s.failedToFetchSharedRepertoire,
      s.backToOverview,
      s.browsingState.chessboardState,
    ],
    true
  );
  // const router = useRouter();
  const isMobile = useIsMobile();
  if (!isBrowsing) {
    return null;
  }
  return (
    <RepertoirePageLayout>
      <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
        <View style={s(c.column, c.alignStart, c.constrainWidth, c.fullWidth)}>
          <View style={s(c.row, c.selfCenter, c.constrainWidth, c.fullWidth)}>
            <View
              style={s(c.column, c.constrainWidth, isMobile && c.fullWidth)}
            >
              {!isMobile && (
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
                style={s(c.width(isMobile ? "100%" : 300), c.maxWidth("100%"))}
              >
                <ChessboardView state={chessboardState} />
              </View>
              <Spacer height={12} />
              <BackControls
                extraButton={
                  isMobile && (readOnly ? <SwitchSideButton /> : <EditButton />)
                }
              />
              {!isMobile && (
                <>
                  <Spacer height={12} />
                  {readOnly && <SwitchSideButton />}
                  {!readOnly && <EditButton />}
                </>
              )}
              {isMobile && (
                <>
                  <Spacer height={24} />
                  <ResultsView />
                </>
              )}
            </View>
            {!isMobile && (
              <>
                <Spacer width={48} />
                <View style={s(c.column, c.flexShrink(1), c.grow)}>
                  <ResultsView />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </RepertoirePageLayout>
  );
};

export const SwitchSideButton = () => {
  const isMobile = useIsMobile();
  const [side, q] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.quick,
  ]);
  return (
    <Button
      style={s(
        c.buttons.extraDark,
        // isMobile && c.bg(c.grays[70]),
        c.selfStretch,
        !isMobile && c.py(16),
        c.px(24)
      )}
      onPress={() => {
        q((s) => {
          s.startBrowsing(otherSide(side));
          s.browsingState.chessboardState.resetPosition();
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.extraDark.textStyles,
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
              c.buttons.extraDark.textStyles,
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
  const [side, q] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.quick,
  ]);
  return (
    <Button
      style={s(
        c.buttons.extraDark,
        // isMobile && c.bg(c.grays[70]),
        c.selfStretch,
        !isMobile && c.py(16),
        c.px(24)
      )}
      onPress={() => {
        q((s) => {
          s.startEditing(side);
          s.chessboardState.playPgn(s.browsingState.chessboardState.moveLogPgn)
        });
      }}
    >
      <CMText
        style={s(
          c.buttons.extraDark.textStyles,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        <i className="fa-sharp fa-solid fa-compass-drafting" />
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(
          c.buttons.extraDark.textStyles,
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
    <View style={s(c.column, isMobile && c.fullWidth)}>
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
        className="fa-regular fa-hammer"
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
  const [sections, quick] = useRepertoireState((s) => [
    s.browsingState.sections,
    s.quick,
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
      {intersperse(
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
  const isMobile = useIsMobile();
  let MAX_TRUNCATED = isMobile ? 2 : 4;
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
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
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

  const isVisible = !!entry?.isIntersecting;

  const chessboardSize = isMobile ? 120 : 120;
  return (
    <Pressable
      ref={ref}
      onPress={() => {
        quick((s) => {
          s.startEditing(activeSide);
          s.chessboardState.playPgn(miss.lines[0]);
        });
      }}
      style={s(
        c.bg(c.grays[10]),
        c.height(chessboardSize),
        c.extraDarkBorder,
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
            style={s(c.fontSize(14), c.weightBold, c.fg(c.colors.textPrimary))}
          >
            {miss.ecoCodeName ? miss.ecoCodeName : "Overall"}
          </CMText>
        </View>
        <Spacer height={isMobile ? 6 : 4} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 12 : 14),
            c.weightRegular,
            c.flexible,
            c.overflowHidden
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

  const chessboardSize = isMobile ? 120 : 160;
  return (
    <Pressable
      ref={ref}
      onPress={() => {
        quick((s) => {
          s.startEditing(activeSide);
          s.chessboardState.playPgn(line.pgn);
        });
      }}
      style={s(
        c.bg(c.grays[10]),
        c.height(chessboardSize),
        c.extraDarkBorder,
        c.br(2),
        c.overflowHidden,
        c.row,
        c.clickable
      )}
    >
      <View
        style={s(
          c.column,
          c.py(isMobile ? 12 : 24),
          c.flexible,
          c.grow,
          c.px(isMobile ? 12 : 24)
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
              });
            }}
          >
            <i
              style={s(c.fontSize(16), c.fg(c.failureShades[50]))}
              className="fa-regular fa-trash"
            ></i>
          </Pressable>
        </View>
        <Spacer height={isMobile ? 6 : 8} />
        <CMText
          style={s(
            c.fontSize(isMobile ? 12 : 14),
            c.weightRegular,
            c.flexible,
            c.overflowHidden
          )}
        >
          {line.pgn}
          {/*line.pgn*/}
          {/*line.pgn.replace(
            line.deleteMove?.sanPlus,
            `[${line.deleteMove?.sanPlus}]`
          )*/}
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

// export const VariationsAndLines = () => {
//   const [activeSide, selectBrowserSection, quick, readOnly] =
//     useRepertoireState(
//       (s) => [
//         s.activeSide,
//         s.browsingState.selectBrowserSection,
//         s.quick,
//         s.browsingState.readOnly,
//       ],
//       shallow
//     );
//   const isMobile = useIsMobile();
//   return (
//     <View style={s(c.column, c.constrainWidth, c.fullWidth)}>
//       <Spacer height={12} />
//       {!isEmpty(drilldownState.sections) && (
//         <>
//           <CMText style={s(c.fontSize(24), c.weightBold)}>Variations</CMText>
//           <Spacer height={12} />
//           <View
//             style={s(c.selfCenter, {
//               display: "grid",
//               gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
//               gap: "12px 24px",
//               width: "100%",
//             })}
//           >
//             {drilldownState.sections.map((x, i) => {
//               const onClick = () => {
//                 selectBrowserSection(x, true);
//               };
//               return (
//                 <Pressable
//                   key={`section-${i}`}
//                   onPress={onClick}
//                   style={s(
//                     c.bg(c.grays[12]),
//                     c.br(2),
//                     c.pr(12),
//                     c.overflowHidden,
//                     c.row,
//                     c.clickable
//                   )}
//                 >
//                   <View style={s(c.size(isMobile ? 100 : 120))}>
//                     <ChessboardView
//                       onSquarePress={() => {
//                         onClick();
//                       }}
//                       state={createStaticChessState({
//                         epd: x.epd,
//                         side: activeSide,
//                       })}
//                     />
//                   </View>
//                   <Spacer width={12} />
//                   <View style={s(c.column, c.py(12), c.flexible, c.grow)}>
//                     <CMText style={s(c.fontSize(16), c.weightBold)}>
//                       {getAppropriateEcoName(x.eco_code?.fullName)[0]}
//                     </CMText>
//                     <Spacer height={2} />
//                     <CMText
//                       style={s(
//                         c.fontSize(12),
//                         c.weightSemiBold,
//                         c.fg(c.grays[70])
//                       )}
//                     >
//                       {getAppropriateEcoName(x.eco_code?.fullName)[1]?.join(
//                         ", "
//                       )}
//                     </CMText>
//                     {/*
//                       <Spacer height={12} />
//                       <View style={s(c.row, c.alignEnd)}>
//                         <CMText style={s(c.fontSize(16), c.weightBold)}>
//                           {x.numMoves.withTranspositions}
//                         </CMText>
//                         <Spacer width={4} />
//                         <CMText style={s(c.fontSize(14), c.weightRegular)}>
//                           moves
//                         </CMText>
//                       </View>
//                       */}
//                   </View>
//                 </Pressable>
//               );
//             })}
//           </View>
//           <Spacer height={48} />
//         </>
//       )}
//
//       {!isEmpty(drilldownState.lines) && (
//         <>
//           <CMText style={s(c.fontSize(24), c.weightBold)}>
//             {!isEmpty(drilldownState.sections) ? "Lines" : "Lines"}
//           </CMText>
//           <Spacer height={12} />
//
//           <View
//             style={s(c.selfCenter, c.fullWidth, {
//               display: "grid",
//               gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
//               gap: "12px 24px",
//             })}
//           >
//             {drilldownState.lines.map((browserLine, key) => {
//               const onClick = () => {
//                 quick((s) => {
//                   if (readOnly) {
//                     s.analyzeLineOnLichess(pgnToLine(browserLine.line));
//                   } else {
//                     s.isBrowsing = false;
//                     s.startEditing(activeSide as Side);
//                     s.playPgn(browserLine.line);
//                   }
//                 });
//               };
//               return (
//                 <Pressable
//                   onPress={() => {
//                     onClick();
//                   }}
//                   key={`lines-${key}`}
//                   style={s(
//                     c.row,
//                     c.flexible,
//                     c.alignStart,
//                     c.bg(c.grays[12]),
//                     c.clickable
//                   )}
//                 >
//                   <View style={s(c.size(120))}>
//                     <ChessboardView
//                       onSquarePress={() => {
//                         onClick();
//                       }}
//                       state={createStaticChessState({
//                         epd: browserLine.epd,
//                         side: activeSide,
//                       })}
//                     />
//                   </View>
//                   <Spacer width={12} />
//                   <View style={s(c.flexible, c.py(12))}>
//                     <CMText
//                       style={s(
//                         c.fg(c.colors.textSecondary),
//                         c.fontSize(isMobile ? 12 : 14),
//                         c.lineHeight(isMobile ? "1.2rem" : "1.3rem"),
//                         c.weightSemiBold
//                       )}
//                     >
//                       {browserLine.line}
//                     </CMText>
//                   </View>
//                   <Spacer width={12} />
//                 </Pressable>
//               );
//             })}
//           </View>
//
//           <View style={s(c.row, c.selfCenter)}></View>
//         </>
//       )}
//     </View>
//   );
// };

// export const BreadCrumbView = () => {
//   let [
//     previousDrilldownStates,
//     selectDrilldownState,
//     backToOverview,
//     readOnly,
//   ] = useRepertoireState(
//     (s) => [
//       s.browsingState.previousDrilldownStates,
//       s.browsingState.selectDrilldownState,
//       s.backToOverview,
//       s.browsingState.readOnly,
//     ],
//     shallow
//   );
//   let containerRef = useRef(null);
//   useLayoutEffect(() => {
//     if (containerRef.current) {
//       containerRef.current.scrollLeft = containerRef.current.scrollWidth;
//     }
//   }, [previousDrilldownStates]);
//   console.log({ previousDrilldownStates });
//   const separator = (
//     <CMText style={s(c.mx(8), c.fontSize(12), c.fg(c.grays[70]))}>
//       <i className="fa fa-arrow-right" />
//     </CMText>
//   );
//   let seenEcoCodes = new Set();
//   return (
//     <View
//       style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth, c.py(8))}
//       ref={containerRef}
//     >
//       {!readOnly && (
//         <>
//           <Pressable
//             onPress={() => {
//               backToOverview();
//             }}
//           >
//             <CMText style={s()}>Overview</CMText>
//           </Pressable>
//           {!isEmpty(previousDrilldownStates) && separator}
//         </>
//       )}
//       {intersperse(
//         previousDrilldownStates.map((drilldownState, i) => {
//           seenEcoCodes.add(drilldownState.ecoCode?.code);
//           return (
//             <Pressable
//               key={`breadcrumb-${i}`}
//               onPress={() => {
//                 selectDrilldownState(drilldownState);
//               }}
//             >
//               <View style={s()}>
//                 <CMText style={s()}>
//                   {drilldownState?.ecoCode
//                     ? getAppropriateEcoName(
//                         drilldownState.ecoCode?.fullName,
//                         take(previousDrilldownStates, i)
//                       )[0]
//                     : "Start position"}
//                 </CMText>
//               </View>
//             </Pressable>
//           );
//         }),
//         (i) => {
//           return <React.Fragment key={i}>{separator}</React.Fragment>;
//         }
//       )}
//     </View>
//   );
// };

const ReadOnlyWarning = () => {
  return (
    <View
      style={s(
        c.selfCenter,
        c.py(12),
        c.px(12),
        c.column,
        c.alignStart,
        c.maxWidth(400)
      )}
    >
      <View style={s(c.row, c.alignStart)}>
        <CMText style={s()}>You are viewing someone else's repertoire.</CMText>
      </View>
      <Spacer height={4} />
      <Button style={s(c.buttons.primary, c.selfEnd, c.py(6), c.px(10))}>
        <CMText style={s(c.buttons.primary.textStyles, c.fontSize(14))}>
          Make your own
        </CMText>
      </Button>
    </View>
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
