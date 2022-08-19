import { GameResultsDistribution } from "app/models";
import {
  formatWinPercentage,
  getTotalGames,
} from "app/utils/results_distribution";
import { View, Text } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { Side } from "app/utils/repertoire";

export const GameResultsBar = ({
  gameResults,
  hideNumbers,
  activeSide,
  smallNumbers,
}: {
  gameResults: GameResultsDistribution;
  hideNumbers?: boolean;
  activeSide?: Side;
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
          c.bg(c.grays[80]),
          c.center
        )}
      >
        {gameResults.white / total > threshold &&
          !hideNumbers &&
          (!activeSide || activeSide === "white") && (
            <CMText
              style={s(c.fg(c.grays[30]), c.weightBold, c.fontSize(fontSize))}
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
        {gameResults.draw / total > threshold &&
          !hideNumbers &&
          !activeSide && (
            <CMText
              style={s(c.fg(c.grays[75]), c.weightBold, c.fontSize(fontSize))}
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
        {gameResults.black / total > threshold &&
          !hideNumbers &&
          (!activeSide || activeSide === "black") && (
            <CMText
              style={s(c.fg(c.grays[60]), c.weightBold, c.fontSize(fontSize))}
            >
              {formatWinPercentage(gameResults.black / total)}
            </CMText>
          )}
      </View>
    </View>
  );
};
