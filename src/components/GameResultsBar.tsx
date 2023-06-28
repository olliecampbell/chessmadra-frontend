import { GameResultsDistribution } from "~/utils/models";
import {
  formatWinPercentage,
  getDrawAdjustedWinRate,
  getTotalGames,
  getWinRate,
} from "~/utils/results_distribution";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";

export const GameResultsBar = (props: {
  gameResults: GameResultsDistribution;
  previousResults?: GameResultsDistribution;
  hideNumbers?: boolean;
  activeSide: Side;
}) => {
  const total = getTotalGames(props.gameResults) ?? 0;
  const threshold = 0.3;
  const showPercentageThreshold = 0.35;
  const fontSize = 10;
  const percentWhite = props.gameResults.white / total;
  const winrateMovement = () =>
    getWinrateMovement({
      side: props.activeSide,
      results: props.gameResults,
      previous: props.previousResults,
    });
  const whiteResults = (
    <div
      style={s(
        c.width(`${(props.gameResults.white / total) * 100}%`),
        c.bg(c.gray[90]),
        c.px(4),
        c.alignCenter,
        c.row,
        props.activeSide === "black" ? c.justifyEnd : c.justifyStart
      )}
    >
      {percentWhite > threshold && !props.hideNumbers && (
        <>
          <CMText
            class={clsx(
              props.activeSide === "white"
                ? winrateMovement() === "up"
                  ? "text-green-white"
                  : winrateMovement() === "down"
                  ? "text-red-white"
                  : "text-gray-10"
                : "text-gray-10",
              "text-[10px] font-bold"
            )}
          >
            {formatWinPercentage(props.gameResults.white / total)}
            {percentWhite > showPercentageThreshold && <span class="">%</span>}
          </CMText>
        </>
      )}
    </div>
  );
  const percentBlack = props.gameResults.black / total;
  const blackResults = (
    <div
      style={s(
        c.width(`${(props.gameResults.black / total) * 100}%`),
        c.bg(c.gray[6]),
        c.alignCenter,
        c.row,
        c.px(4),
        props.activeSide === "black" ? c.justifyStart : c.justifyEnd
      )}
    >
      {props.gameResults.black / total > threshold && !props.hideNumbers && (
        <>
          <CMText
            class={clsx(
              props.activeSide === "black"
                ? winrateMovement() === "up"
                  ? "text-green-black"
                  : winrateMovement() === "down"
                  ? "text-red-black"
                  : "text-gray-90"
                : "text-gray-90",
              "text-[10px] font-bold"
            )}
          >
            {formatWinPercentage(props.gameResults.black / total)}
            {percentBlack > showPercentageThreshold && <span class="">%</span>}
          </CMText>
        </>
      )}
    </div>
  );
  const [first, last] =
    props.activeSide === "white"
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
          c.width(`${(props.gameResults.draw / total) * 100}%`),
          c.bg(c.gray[40]),
          c.center
        )}
      >
        {props.gameResults.draw / total > threshold &&
          !props.hideNumbers &&
          !props.activeSide && (
            <CMText
              style={s(c.fg(c.gray[75]), c.weightBold, c.fontSize(fontSize))}
            >
              {formatWinPercentage(props.gameResults.draw / total)}
            </CMText>
          )}
      </div>
      {last}
    </div>
  );
};

type WinrateMovement = "up" | "down" | null;

export const getWinrateMovement = (props: {
  results: GameResultsDistribution;
  previous?: GameResultsDistribution;
  side: Side;
}): WinrateMovement => {
  if ((getTotalGames(props.results) ?? 0) < 10 || !props.previous) {
    return null;
  }

  const threshold = 0.02;
  const oldWr = getWinRate(props.previous, props.side);
  const newWr = getWinRate(props.results, props.side);
  if (newWr < oldWr - threshold) {
    if (
      getDrawAdjustedWinRate(props.results, props.side) <
      getDrawAdjustedWinRate(props.previous, props.side) - threshold
    ) {
      return "down";
    }
  } else if (newWr > oldWr + threshold) {
    return "up";
  }
  return null;
};
