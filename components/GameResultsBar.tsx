import { GameResultsDistribution } from "app/models";
import {
  formatWinPercentage,
  getTotalGames,
} from "app/utils/results_distribution";
import { View, Text } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";

export const GameResultsBar = ({
  gameResults,
  hideNumbers,
  smallNumbers,
}: {
  gameResults: GameResultsDistribution;
  hideNumbers?: boolean;
  smallNumbers?: boolean;
}) => {
  let total = getTotalGames(gameResults);
  let threshold = 0.2;
  let fontSize = smallNumbers ? 10 : 12;
  return (
    <View
      style={s(
        c.row,
        c.fullWidth,
        c.fullHeight,
        c.height(18),
        c.br(2),
        c.border(`1px solid ${c.grays[30]}`)
      )}
    >
      <View
        style={s(
          c.width(`${(gameResults.white / total) * 100}%`),
          c.bg(c.grays[90]),
          c.center
        )}
      >
        {gameResults.white / total > threshold && !hideNumbers && (
          <CMText
            style={s(c.fg(c.grays[30]), c.weightSemiBold, c.fontSize(fontSize))}
          >
            {formatWinPercentage(gameResults.white / total)}
          </CMText>
        )}
      </View>
      <View
        style={s(
          c.width(`${(gameResults.draw / total) * 100}%`),
          c.bg(c.grays[40]),
          c.center
        )}
      >
        {gameResults.draw / total > threshold && !hideNumbers && (
          <CMText
            style={s(c.fg(c.grays[85]), c.weightSemiBold, c.fontSize(fontSize))}
          >
            {formatWinPercentage(gameResults.draw / total)}
          </CMText>
        )}
      </View>
      <View
        style={s(
          c.width(`${(gameResults.black / total) * 100}%`),
          c.bg(c.grays[20]),
          c.center
        )}
      >
        {gameResults.black / total > threshold && !hideNumbers && (
          <CMText
            style={s(c.fg(c.grays[70]), c.weightSemiBold, c.fontSize(fontSize))}
          >
            {formatWinPercentage(gameResults.black / total)}
          </CMText>
        )}
      </View>
    </View>
  );
};
