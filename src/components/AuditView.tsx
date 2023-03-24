import { c, s } from "~/utils/styles";
import { quick, useAdminState } from "~/utils/app_state";
import {
  AuditMissedLine,
  AuditResponse,
  RepertoireAudit,
} from "~/utils/admin_state";
import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { useResponsive } from "~/utils/useResponsive";
import { ChessboardView } from "./chessboard/Chessboard";
import { createStaticChessState } from "~/utils/chessboard_state";
import { intersection, sortBy, uniq } from "lodash-es";

export const AuditView = (props: {}) => {
  useEffect(() => {
    quick((s) => {
      s.adminState.fetchAudit();
    });
  }, []);
  let auditResponse = useAdminState((s) => s.auditResponse, {
    referenceEquality: true,
  });
  let responsive = useResponsive();
  return (
    <View
      style={s(c.column, c.containerStyles(responsive.bp), c.py(48), c.px(12))}
    >
      <View style={s(c.column, c.selfStretch)}>
        <View style={s(c.column, c.px(12), c.py(12), c.bg(c.primaries[40]))}>
          <CMText style={s(c.weightBold, c.fontSize(32), c.fg(c.grays[95]))}>
            Long Live the King's Gambit
          </CMText>
          <Spacer height={4} />
          <CMText
            style={s(c.weightSemiBold, c.fontSize(18), c.fg(c.grays[80]))}
          >
            Repertoire Audit
          </CMText>
        </View>
      </View>
      <Spacer height={8} />
      <CMText
        style={s(
          c.px(12),
          c.weightRegular,
          c.fontSize(14),
          c.fg(c.grays[90]),
          c.lineHeight("1.3rem")
        )}
      >
        This is an auto-generated audit of the repertoire{" "}
        <b>Long Live the King's Gambit</b>. The audit has two parts. The first
        is positions that are "missed". You're likely to see these positions at
        least once every 40 games, but there's no response for them in the
        repertoire.
        <br />
        <br />
        The second part is "excessive" lines. These are responses in the
        repertoire that you expect to play in fewer than 1 in 5000 games,
        regardless of Elo range.
        <br />
        <br />
        The idea is you should add responses to the missed lines, and consider
        removing the lines that are extremely rare, so people are spending their
        time efficiently while studying.
        <br />
        <br />
        The statistics are powered by 400m+ Lichess games, about 80 million per
        Elo band.
      </CMText>
      <Spacer height={48} />
      <View style={s(c.column, c.px(12), c.py(12), c.bg(c.primaries[40]))}>
        <CMText style={s(c.weightBold, c.fontSize(24), c.fg(c.grays[90]))}>
          Missed positions
        </CMText>
      </View>
      <Spacer height={24} />
      <View
        style={s(
          c.px(12),
          c.grid({
            templateColumns: ["1fr"],
            columnGap: 12,
            templateRows: [],
            rowGap: 72,
          })
        )}
      >
        {auditResponse?.eloAudits.map((audit) => (
          <EloAudit audit={audit} />
        ))}
      </View>
      <Spacer height={48} />
      <View style={s(c.column, c.px(12), c.py(12), c.bg(c.primaries[40]))}>
        <CMText style={s(c.weightBold, c.fontSize(24), c.fg(c.grays[90]))}>
          Excessive lines
        </CMText>
      </View>
      <Spacer height={24} />
      {auditResponse && <ExcessiveLinesAudit auditResponse={auditResponse} />}
    </View>
  );
};

interface ProcessedExcessiveLine {
  maxIncidence: number;
  lines: string[];
  epd: string;
}

export const ExcessiveLinesAudit = ({
  auditResponse,
}: {
  auditResponse: AuditResponse;
}) => {
  let excessiveEpds = auditResponse.eloAudits[0].excessiveLines.map(
    (el) => el.epd
  );
  auditResponse.eloAudits.forEach((audit) => {
    excessiveEpds = intersection(
      excessiveEpds,
      audit.excessiveLines.map((el) => el.epd)
    );
  });
  excessiveEpds = uniq(excessiveEpds);
  let collatedExcessiveLines: ProcessedExcessiveLine[] = [];
  excessiveEpds.forEach((epd) => {
    let maxIncidence = 0.0;
    let lines: Set<string> = new Set();
    auditResponse.eloAudits.map((audit) => {
      let excessiveLine = audit.excessiveLines.find((el) => el.epd === epd);
      excessiveLine.lines.forEach((line) => {
        lines.add(line);
      });
      maxIncidence = Math.max(maxIncidence, excessiveLine.incidence);
    });
    if (maxIncidence < 1 / 5000) {
      collatedExcessiveLines.push({
        maxIncidence: maxIncidence,
        epd,
        lines: Array.from(lines),
      });
    }
  });
  collatedExcessiveLines = sortBy(
    collatedExcessiveLines,
    (cl) => cl.maxIncidence
  );
  return (
    <View style={s(c.px(12))}>
      <View
        style={s(
          c.column,
          c.grid({
            templateColumns: ["1fr"],
            columnGap: 12,
            templateRows: [],
            rowGap: 24,
          })
        )}
      >
        {collatedExcessiveLines.map((el) => {
          return (
            <Pressable
              onPress={() => {
                quick((s) => {});
              }}
              style={s(
                c.keyedProp("pageBreakInside")("avoid"),
                c.relative,
                c.fullWidth,
                c.bg(c.grays[97]),
                c.minHeight(120),
                c.lightCardShadow,
                c.br(2),
                c.overflowHidden,
                c.row,
                c.clickable
              )}
            >
              <View style={s(c.column, c.py(12), c.flexible, c.grow, c.px(12))}>
                <View
                  style={s(
                    c.grid({
                      templateColumns: ["1fr"],
                      templateRows: ["1fr"],
                      rowGap: 8,
                      columnGap: 24,
                    })
                  )}
                >
                  {el.lines.map((l) => {
                    return (
                      <CMText
                        style={s(
                          c.fontSize(16),
                          c.weightSemiBold,
                          c.flexible,
                          c.overflowHidden,
                          c.fg(c.grays[20]),
                          c.lineHeight("1.3rem")
                        )}
                      >
                        {l}
                      </CMText>
                    );
                  })}
                  {/*line.pgn*/}
                  {/*line.pgn.replace(
            line.deleteMove?.sanPlus,
            `[${line.deleteMove?.sanPlus}]`
          )*/}
                </View>
                <Spacer height={4} grow />
                <CMText
                  style={s(
                    c.fontSize(14),
                    c.weightBold,
                    c.fg(c.grays[50]),
                    c.selfEnd
                  )}
                >
                  Expected in 1 in{" "}
                  {Math.round(1 / el.maxIncidence).toLocaleString()} games
                </CMText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const EloAudit = ({ audit }: { audit: RepertoireAudit }) => {
  let { eloRange, missedLines, excessiveLines } = audit;
  return (
    <View style={s()}>
      <CMText style={s(c.weightBold, c.fontSize(24), c.fg(c.grays[90]))}>
        {eloRange} Elo
      </CMText>
      <Spacer height={12} />
      <View
        style={s(
          c.column,
          c.grid({
            templateColumns: ["1fr"],
            columnGap: 12,
            templateRows: [],
            rowGap: 24,
          })
        )}
      >
        {missedLines.map((ml) => {
          return (
            <View style={s(c.block)}>
              <MissView miss={ml} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const MissView = ({ miss }: { miss: AuditMissedLine }) => {
  return (
    <Pressable
      onPress={() => {
        quick((s) => {});
      }}
      style={s(
        c.keyedProp("page-break-inside")("avoid"),
        c.relative,
        c.fullWidth,
        c.bg(c.grays[97]),
        c.height(120),
        c.lightCardShadow,
        c.br(2),
        c.overflowHidden,
        c.row,
        c.clickable
      )}
    >
      <View style={s(c.column, c.py(12), c.flexible, c.grow, c.px(12))}>
        <CMText
          style={s(
            c.fontSize(16),
            c.weightSemiBold,
            c.flexible,
            c.overflowHidden,
            c.fg(c.grays[20]),
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
          style={s(c.fontSize(14), c.weightBold, c.fg(c.grays[50]), c.selfEnd)}
        >
          Expected in 1 in {Math.round(1 / miss.incidence)} games
        </CMText>
      </View>
      <View style={s(c.size(120))}>
        <ChessboardView
          onSquarePress={() => {}}
          state={createStaticChessState({
            epd: miss.epd,
            side: "white",
          })}
        />
      </View>
    </Pressable>
  );
};
