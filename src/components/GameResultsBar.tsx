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
  const total = getTotalGames(gameResults);
  const threshold = 0.2;
  const fontSize = 10;
  const whiteResults = (
    <div
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
    </div>
  );
  const blackResults = (
    <div
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
    </div>
  );
  const [first, last] =
    activeSide === "white"
      ? [whiteResults, blackResults]
      : [blackResults, whiteResults];
  return (
    <div
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
      <div
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
      </div>
      {last}
    </div>
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
  const threshold = 0.02;
  const oldWr = getWinRate(previous, side);
  const newWr = getWinRate(results, side);
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
    <div style={s()}>
      <i className={icon} style={s(c.fg(color), c.fontSize(12))} />
    </div>
  );
};
