import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import shallow from "zustand/shallow";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  map,
  dropRight,
  capitalize,
  drop,
  keys,
  take,
  sortBy,
  reverse,
  some,
  forEach,
  first,
  find,
  times,
  filter,
  last,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  BrowserDrilldownState,
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
  formatIncidence,
  otherSide,
  Repertoire,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { RepertoireWizard } from "./RepertoireWizard";
import { BeatLoader, GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { AppStore } from "app/store";
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import {
  ChessboardState,
  createChessState,
  createStaticChessState,
} from "app/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { LichessGameCellMini } from "./LichessGameCellMini";
import { CMText } from "./CMText";
import {
  GameResultsDistribution,
  PositionReport,
  StockfishReport,
  SuggestedMove,
} from "app/models";
import { failOnAny, failOnTrue } from "app/utils/test_settings";
import { chunked } from "app/utils/intersperse";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";

export const RepertoireBrowsingView = ({}: {}) => {
  const [
    activeSide,
    isBrowsing,
    drilldownState,
    selectBrowserSection,
    quick,
    previousDrilldownStates,
    readOnly,
  ] = useRepertoireState(
    (s) => [
      s.activeSide,
      s.isBrowsing,
      s.browsingState.drilldownState,
      s.browsingState.selectBrowserSection,
      s.quick,
      s.browsingState.previousDrilldownStates,
      s.browsingState.readOnly,
    ],
    shallow
  );
  console.log({ drilldownState });
  console.log("Re-rendering browsing view");
  const isMobile = useIsMobile();
  const chunkSize = isMobile ? 1 : 3;
  const padding = 24;
  if (!isBrowsing) {
    return null;
  }
  return (
    <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
      <View style={s(c.column, c.alignStart, c.fullWidth)}>
        {readOnly && (
          <>
            <ReadOnlyWarning />
            <Spacer height={24} />
          </>
        )}
        <View style={s(c.row, c.fullWidth, c.center)}>
          <SelectOneOf
            tabStyle
            containerStyles={s(c.fullWidth, c.justifyBetween, c.maxWidth(400))}
            choices={["white", "black"] as Side[]}
            activeChoice={activeSide}
            horizontal
            onSelect={(side) => {}}
            renderChoice={(side, active) => {
              return (
                <Pressable
                  onPress={() => {
                    quick((s) => {
                      if (side !== s.activeSide) {
                        s.startBrowsing(side, s);
                      }
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
                    c.pb(8)
                  )}
                >
                  <CMText
                    style={s(
                      c.fg(
                        active ? c.colors.textPrimary : c.colors.textSecondary
                      ),
                      c.fontSize(isMobile ? 20 : 24),
                      c.weightBold
                    )}
                  >
                    {capitalize(side)}
                  </CMText>
                </Pressable>
              );
            }}
          />
        </View>
        <Spacer height={isMobile ? 24 : 44} />
        <BreadCrumbView />
        <View style={s(c.row, c.fullWidth)}>
        <ChessboardFilter/>
          <VariationsAndLines />
        </View>
      </View>
    </View>
  );
};

export const ChessboardFilter = () => {
    return (
    <View style={s(c.column)}>
<ChessboardView/>
    </View>
    )
  }

export const VariationsAndLines = () => {
  const [
    activeSide,
    drilldownState,
    selectBrowserSection,
    quick,
    previousDrilldownStates,
  ] = useRepertoireState(
    (s) => [
      s.activeSide,
      s.browsingState.drilldownState,
      s.browsingState.selectBrowserSection,
      s.quick,
      s.browsingState.previousDrilldownStates,
    ],
    shallow
  );
  const isMobile = useIsMobile();
  return (
    <View style={s(c.column)}>
      <Spacer height={12} />
      {!isEmpty(drilldownState.sections) && (
        <>
          <CMText style={s(c.fontSize(24), c.weightBold)}>Variations</CMText>
          <Spacer height={12} />
          <View
            style={s(c.selfCenter, {
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: "12px 24px",
              width: "100%",
            })}
          >
            {drilldownState.sections.map((x, i) => {
              const onClick = () => {
                selectBrowserSection(x, true);
              };
              return (
                <Pressable
                  key={`section-${i}`}
                  onPress={onClick}
                  style={s(
                    c.bg(c.grays[12]),
                    c.br(2),
                    c.pr(12),
                    c.overflowHidden,
                    c.row,
                    c.clickable
                  )}
                >
                  <View style={s(c.size(isMobile ? 100 : 120))}>
                    <ChessboardView
                      onSquarePress={() => {
                        onClick();
                      }}
                      state={createStaticChessState({
                        epd: x.epd,
                        side: activeSide,
                      })}
                    />
                  </View>
                  <Spacer width={12} />
                  <View style={s(c.column, c.py(12), c.flexible, c.grow)}>
                    <CMText style={s(c.fontSize(16), c.weightBold)}>
                      {
                        getAppropriateEcoName(
                          x.eco_code?.fullName,
                          previousDrilldownStates
                        )[0]
                      }
                    </CMText>
                    <Spacer height={2} />
                    <CMText
                      style={s(
                        c.fontSize(12),
                        c.weightSemiBold,
                        c.fg(c.grays[70])
                      )}
                    >
                      {getAppropriateEcoName(
                        x.eco_code?.fullName,
                        previousDrilldownStates
                      )[1]?.join(", ")}
                    </CMText>
                    {/*
                      <Spacer height={12} />
                      <View style={s(c.row, c.alignEnd)}>
                        <CMText style={s(c.fontSize(16), c.weightBold)}>
                          {x.numMoves.withTranspositions}
                        </CMText>
                        <Spacer width={4} />
                        <CMText style={s(c.fontSize(14), c.weightRegular)}>
                          moves
                        </CMText>
                      </View>
                      */}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Spacer height={48} />
        </>
      )}

      {!isEmpty(drilldownState.lines) && (
        <>
          <CMText style={s(c.fontSize(24), c.weightBold)}>
            {!isEmpty(drilldownState.sections) ? "Lines" : "Lines"}
          </CMText>
          <Spacer height={12} />

          <View
            style={s(c.selfCenter, c.fullWidth, {
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: "12px 24px",
            })}
          >
            {drilldownState.lines.map((browserLine, key) => {
              const onClick = () => {
                quick((s) => {
                  s.isBrowsing = false;
                  s.startEditing(activeSide as Side, s);
                  s.playPgn(browserLine.line, s);
                });
              };
              return (
                <Pressable
                  onPress={() => {
                    onClick();
                  }}
                  key={`lines-${key}`}
                  style={s(
                    c.row,
                    c.flexible,
                    c.alignStart,
                    c.bg(c.grays[12]),
                    c.clickable
                  )}
                >
                  <View style={s(c.size(120))}>
                    <ChessboardView
                      onSquarePress={() => {
                        onClick();
                      }}
                      state={createStaticChessState({
                        epd: browserLine.epd,
                        side: activeSide,
                      })}
                    />
                  </View>
                  <Spacer width={12} />
                  <View style={s(c.flexible, c.py(12))}>
                    <CMText
                      style={s(
                        c.fg(c.colors.textSecondary),
                        c.fontSize(isMobile ? 12 : 14),
                        c.lineHeight(isMobile ? "1.2rem" : "1.3rem"),
                        c.weightSemiBold
                      )}
                    >
                      {browserLine.line}
                    </CMText>
                  </View>
                  <Spacer width={12} />
                </Pressable>
              );
            })}
          </View>

          <View style={s(c.row, c.selfCenter)}></View>
        </>
      )}
    </View>
  );
};

export const BreadCrumbView = () => {
  let [
    previousDrilldownStates,
    selectDrilldownState,
    backToOverview,
    readOnly,
  ] = useRepertoireState(
    (s) => [
      s.browsingState.previousDrilldownStates,
      s.browsingState.selectDrilldownState,
      s.backToOverview,
      s.browsingState.readOnly,
    ],
    shallow
  );
  let containerRef = useRef(null);
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [previousDrilldownStates]);
  previousDrilldownStates = filter(
    previousDrilldownStates,
    (s) => s.ecoCode
  ) as BrowserDrilldownState[];
  console.log({ previousDrilldownStates });
  const separator = (
    <CMText style={s(c.mx(8), c.fontSize(12), c.fg(c.grays[70]))}>
      <i className="fa fa-arrow-right" />
    </CMText>
  );
  let seenEcoCodes = new Set();
  return (
    <View
      style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth, c.py(8))}
      ref={containerRef}
    >
      {!readOnly && (
        <>
          <Pressable
            onPress={() => {
              backToOverview();
            }}
          >
            <CMText style={s()}>Overview</CMText>
          </Pressable>
          {!isEmpty(previousDrilldownStates) && separator}
        </>
      )}
      {intersperse(
        previousDrilldownStates.map((drilldownState, i) => {
          seenEcoCodes.add(drilldownState.ecoCode.code);
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              onPress={() => {
                selectDrilldownState(drilldownState);
              }}
            >
              <View style={s()}>
                <CMText style={s()}>
                  {
                    getAppropriateEcoName(
                      drilldownState.ecoCode?.fullName,
                      take(previousDrilldownStates, i)
                    )[0]
                  }
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return <React.Fragment key={i}>{separator}</React.Fragment>;
        }
      )}
    </View>
  );
};

const ReadOnlyWarning = () => {
  return (
    <View
      style={s(
        c.border(`1px solid ${c.grays[20]}`),
        c.py(12),
        c.px(12),
        c.column,
        c.alignStart,
        c.maxWidth(400)
      )}
    >
      <View style={s(c.row, c.alignStart)}>
        <CMText style={s()}>
          <i className="fa fa-eye" />
        </CMText>
        <Spacer width={12} />
        <CMText style={s()}>
          This is someone else's repertoire, so you can only view the lines.
        </CMText>
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
