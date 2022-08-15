import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
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

export const RepertoireBrowsingView = ({}: {}) => {
  const [activeSide, isBrowsing, browsingState, selectBrowserSection] =
    useRepertoireState((s) => [
      s.activeSide,
      s.isBrowsing,
      s.browserState,
      s.selectBrowserSection,
    ]);
  console.log("Re-rendering browsing view");
  const isMobile = useIsMobile();
  const chunkSize = isMobile ? 1 : 3;
  const padding = 24;
  return (
    <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
      <View style={s(c.column, c.alignStart, c.fullWidth)}>
        <BreadCrumbView />
        <Spacer height={24} />
        <View
          style={s(c.selfCenter, {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px 24px",
            width: "100%",
          })}
        >
          {browsingState.sections.map((x, i) => {
            const onClick = () => {
              selectBrowserSection(x, true);
            };
            return (
              <Pressable
                key={`section-${i}`}
                onPress={onClick}
                style={s(
                  c.bg(c.colors.cardBackground),
                  c.br(2),
                  c.pr(12),
                  c.overflowHidden,
                  c.row
                )}
              >
                <View style={s(c.size(120))}>
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
                <View style={s(c.column, c.py(12))}>
                  <CMText style={s(c.fontSize(16), c.weightBold)}>
                    {getAppropriateEcoName(x.eco_code?.fullName)}
                  </CMText>
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
                </View>
              </Pressable>
            );
          })}
        </View>

        <Spacer height={24} />
        <View style={s(c.height(1), c.bg(c.grays[20]), c.fullWidth)}></View>
        <Spacer height={24} />

        <View
          style={s(c.selfCenter, c.fullWidth, {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px 24px",
          })}
        >
          {browsingState.lines.map((browserLine, key) => {
            return (
              <View
                style={s(
                  c.row,
                  c.flexible,
                  c.alignStart,
                  c.bg(c.colors.cardBackground)
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
                      c.lineHeight("1.3rem"),
                      c.weightSemiBold
                    )}
                  >
                    {browserLine.line}
                  </CMText>
                </View>
                <Spacer width={12} />
              </View>
            );
          })}
        </View>

        <View style={s(c.row, c.selfCenter)}></View>
      </View>
    </View>
  );
};

export const BreadCrumbView = () => {
  let [previousBrowserStates, selectBrowserState] = useRepertoireState((s) => [
    s.previousBrowserStates,
    s.selectBrowserState,
  ]);
  previousBrowserStates = filter(previousBrowserStates, (s) => s.eco_code);
  console.log({ previousBrowserStates });
  return (
    <View style={s(c.row)}>
      {intersperse(
        previousBrowserStates.map((browserState, i) => {
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              onPress={() => {
                selectBrowserState(browserState);
              }}
            >
              <View style={s()}>
                <CMText style={s()}>
                  {getAppropriateEcoName(browserState.eco_code?.fullName)}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <CMText key={i} style={s(c.mx(4))}>
              {" "}
              --{" "}
            </CMText>
          );
        }
      )}
    </View>
  );
};

function getAppropriateEcoName(fullName: string) {
  if (!fullName) {
    return null;
  }
  if (fullName.includes(":")) {
    let variations = fullName.split(":")[1].split(",");
    return last(variations).trim();
  } else {
    return fullName;
  }
}
