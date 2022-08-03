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

export const LichessGameCell = ({
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
        c.pt(16),
        c.bg(c.grays[80]),
        c.br(4),
        c.overflowHidden,
        c.width(400),
        c.clickable,
        c.relative
      )}
    >
      {!hideLink && (
        <View style={s(c.absolute, c.top(0), c.right(0), c.pr(12), c.pt(12))}>
          <CMText style={s()}>
            <i
              style={s(
                c.fg(c.colors.textInverse),
                c.fontSize(18),
                c.fg(c.grays[40])
              )}
              className="fas fa-arrow-up-right-from-square"
            ></i>
          </CMText>
        </View>
      )}
      <Spacer height={0} />
      <View style={s(c.column, c.px(16))}>
        {intersperse(
          ["white", "black"].map((color, i) => {
            // console.log(game);
            return (
              <View style={s(c.column)}>
                <View style={s(c.row, c.alignCenter)}>
                  <View style={s(c.round, c.size(12), c.bg(color))}></View>

                  <Spacer width={4} />
                  <CMText
                    style={s(c.fg(c.colors.textInverseSecondary), c.weightBold)}
                  >
                    {game[`${color}Name`]}
                  </CMText>
                  <Spacer width={4} />
                  <CMText style={s(c.fg(c.grays[40]), c.weightBold)}>
                    ({game[`${color}Elo`]})
                  </CMText>
                </View>
                {false && (
                  <>
                    <Spacer height={4} />
                    <CMText style={s(c.fg(c.colors.textInverseSecondary))}>
                      <b>{game[`${color}Blunders`]}</b> blunders
                    </CMText>
                    <Spacer height={4} />
                    <CMText style={s(c.fg(c.colors.textInverseSecondary))}>
                      <b>{game[`${color}CentipawnLoss`]}</b> avg centipawn loss
                    </CMText>
                  </>
                )}
              </View>
            );
          }),
          (i) => {
            return <Spacer height={12} key={i} />;
          }
        )}
      </View>
      <Spacer height={24} />
      {showFirstMoves && (
        <View style={s(c.px(16))}>
          <CMText style={s(c.fg(c.colors.textInverseSecondary), c.weightBold)}>
            {lineToPgn(take(game.moves, 8))}
          </CMText>
          <Spacer height={4} />
        </View>
      )}

      <View style={s(c.row, c.justifyBetween, c.alignEnd, c.px(16))}>
        <CMText style={s(c.weightBold, c.fontSize(18))}>
          {formatGameResult(game.result)}
        </CMText>
        <CMText style={s(c.row, c.selfEnd, c.alignEnd)}>
          <CMText style={s(c.weightBold, c.fontSize(18))}>
            {Math.ceil(game.numberMoves / 2)}
          </CMText>
          <Spacer width={4} />
          <CMText style={s(c.fontSize(14), c.mb(0))}>moves</CMText>
        </CMText>
      </View>
      {gameStatus?.everReviewed ? (
        <View
          style={s(
            c.bg(!gameStatus.needsReview ? c.primaries[50] : c.yellows[60]),
            c.mt(12),
            c.px(12),
            c.py(8)
          )}
        ></View>
      ) : (
        <Spacer height={12} />
      )}
    </View>
  );
};
