import { Animated, Text, Pressable, View, Platform } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { chunked, intersperse } from "../utils/intersperse";
import { LichessGame } from "app/models";
import { GameSearchResult } from "app/utils/state";
import { formatGameResult } from "app/utils/formatGameResult";
import { lineToPgn } from "app/utils/repertoire";
import { take } from "lodash";
import { MemorizedGameStatus } from "app/utils/game_memorization_state";
import { CMText } from "./CMText";

export const LichessGameCellMini = ({
  game,
  hideLink,
  gameStatus,
  showFirstMoves,
}: {
  game: LichessGame;
  hideLink?: boolean;
  gameStatus?: MemorizedGameStatus;
  showFirstMoves?: boolean;
}) => {
  return (
    <View
      style={s(
        c.py(16),
        c.bg(c.grays[15]),
        c.br(4),
        c.overflowHidden,
        c.clickable,
        c.relative
      )}
    >
      {!hideLink && (
        <View style={s(c.absolute, c.top(0), c.right(0), c.pr(12), c.pt(12))}>
          <CMText style={s()}>
            <i
              style={s(
                c.fg(c.colors.textPrimary),
                c.fontSize(18),
                c.fg(c.grays[40])
              )}
              className="fas fa-arrow-up-right-from-square"
            ></i>
          </CMText>
        </View>
      )}
      <Spacer height={0} />
      <View style={s(c.row, c.px(16))}>
        {intersperse(
          ["white", "black"].map((color, i) => {
            // console.log(game);
            return (
              <View style={s(c.column)}>
                <View style={s(c.row, c.alignCenter)}>
                  <CMText style={s(c.fg(c.colors.textSecondary), c.weightBold)}>
                    {game[`${color}Name`]}
                  </CMText>
                </View>
              </View>
            );
          }),
          (i) => {
            return (
              <CMText
                style={s(c.fg(c.grays[70]), c.px(4), c.pl(6), c.weightThin)}
              >
                vs.
              </CMText>
            );
          }
        )}
        <Spacer width={2} grow />
      </View>
      <Spacer height={12} />
      {showFirstMoves && (
        <View style={s(c.px(16), c.row)}>
          <CMText style={s(c.fg(c.grays[70]), c.weightBold, c.fontSize(12))}>
            {lineToPgn(take(game.moves, 4))} ...
          </CMText>
          <Spacer width={12} grow />
          <CMText style={s(c.row, c.selfEnd, c.alignEnd)}>
            <CMText
              style={s(
                c.weightBold,
                c.fontSize(14),
                c.fg(c.colors.textSecondary)
              )}
            >
              {Math.ceil(game.numberMoves / 2)}
            </CMText>
            <Spacer width={4} />
            <CMText
              style={s(c.fontSize(14), c.mb(0), c.fg(c.colors.textSecondary))}
            >
              moves
            </CMText>
          </CMText>
        </View>
      )}
    </View>
  );
};
