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
        c.py(12),
        c.bg(c.grays[12]),
        c.br(2),
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
      <View style={s(c.row, c.px(12))}>
        {intersperse(
          ["white", "black"].map((color, i) => {
            // console.log(game);
            return (
              <View style={s(c.column)} key={color}>
                <View style={s(c.row, c.alignCenter)}>
                  <CMText style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
                    {game[`${color}Name`]}
                  </CMText>
                </View>
              </View>
            );
          }),
          (i) => {
            return (
              <CMText
                key={i}
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
        <View style={s(c.px(12), c.row)}>
          <CMText style={s(c.fg(c.grays[60]), c.weightRegular, c.fontSize(12))}>
            {lineToPgn(take(game.moves, 4))} ...
          </CMText>
        </View>
      )}
    </View>
  );
};
