import { GameResultsDistribution } from "~/utils/models";
import {
  formatWinPercentage,
  getTotalGames,
  getWinRate,
} from "~/utils/results_distribution";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Side } from "~/utils/repertoire";
import { View } from "./View";

export const GameResultsBar = ({
  gameResults,
  previousResults,
  hideNumbers,
  activeSide,
}: {
  gameResults: GameResultsDistribution;
  previousResults?: GameResultsDistribution;
  hideNumbers?: boolean;
  activeSide: Side;
}) => {
  let total = getTotalGames(gameResults);
  let threshold = 0.2;
  let fontSize = 10;
  let whiteResults = (
    <View
      style={s(
        c.width(`${(gameResults.white / total) * 100}%`),
        c.bg(c.grays[90]),
        c.px(4),
        c.alignCenter,
        c.row,
        activeSide === "black" ? c.justifyEnd : c.justifyStart
      )}
    >
      {gameResults.white / total > threshold && !hideNumbers && (
        <>
          <CMText
            style={s(
              c.fg(c.grays[10]),
              c.weightBold,
              c.fontSize(fontSize),
              c.pr(2)
            )}
          >
            {formatWinPercentage(gameResults.white / total)}
          </CMText>
          {activeSide === "white" && (
            <MovementIndicator
              side={"white"}
              results={gameResults}
              previous={previousResults}
            />
          )}
        </>
      )}
    </View>
  );
  let blackResults = (
    <View
      style={s(
        c.width(`${(gameResults.black / total) * 100}%`),
        c.bg(c.grays[6]),
        c.alignCenter,
        c.row,
        c.px(4),
        activeSide === "black" ? c.justifyStart : c.justifyEnd
      )}
    >
      {gameResults.black / total > threshold && !hideNumbers && (
        <>
          <CMText
            style={s(
              c.fg(c.grays[90]),
              c.weightBold,
              c.fontSize(fontSize),
              c.pr(2)
            )}
          >
            {formatWinPercentage(gameResults.black / total)}
          </CMText>
          {activeSide === "black" && (
            <MovementIndicator
              side={"black"}
              results={gameResults}
              previous={previousResults}
            />
          )}
        </>
      )}
    </View>
  );
  let [first, last] =
    activeSide === "white"
      ? [whiteResults, blackResults]
      : [blackResults, whiteResults];
  return (
    <View
      style={s(
        c.row,
        c.fullWidth,
        c.fullHeight,
        c.height(18),
        c.br(2),
        c.overflowHidden
      )}
    >
      {first}
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
      {last}
    </View>
  );
};

export const MovementIndicator = ({
  results,
  previous,
  side,
}: {
  results: GameResultsDistribution;
  previous: GameResultsDistribution;
  side: Side;
}) => {
  if (getTotalGames(results) < 10 || !previous) {
    return null;
  }

  let icon = null;
  let color = null;
  let threshold = 0.02;
  let oldWr = getWinRate(previous, side);
  let newWr = getWinRate(results, side);
  if (newWr < oldWr - threshold) {
    icon = "fa-sharp fa-arrow-down-right";
    color = side === "white" ? c.reds[45] : c.reds[55];
  } else if (newWr > oldWr + threshold) {
    icon = "fa-sharp fa-arrow-up-right";
    color = side === "white" ? c.greens[40] : c.greens[55];
  }
  if (!icon) {
    return null;
  }
  return (
    <View style={s()}>
      <i className={icon} style={s(c.fg(color), c.fontSize(12))} />
    </View>
  );
};
