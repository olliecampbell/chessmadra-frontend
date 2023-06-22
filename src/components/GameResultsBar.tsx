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

export const GameResultsBar = (props: {
  gameResults: GameResultsDistribution;
  previousResults?: GameResultsDistribution;
  hideNumbers?: boolean;
  activeSide: Side;
}) => {
  const total = getTotalGames(props.gameResults);
  const threshold = 0.3;
  const showPercentageThreshold = 0.4;
  const fontSize = 10;
  const percentWhite = props.gameResults.white / total;
  const whiteResults = (
    <div
      style={s(
        c.width(`${(props.gameResults.white / total) * 100}%`),
        c.bg(c.grays[90]),
        c.px(4),
        c.alignCenter,
        c.row,
        props.activeSide === "black" ? c.justifyEnd : c.justifyStart
      )}
    >
      {percentWhite > threshold && !props.hideNumbers && (
        <>
          <CMText
            style={s(c.fg(c.grays[10]), c.weightBold, c.fontSize(fontSize))}
          >
            {formatWinPercentage(props.gameResults.white / total)}
            {percentWhite > showPercentageThreshold && <span class="">%</span>}
          </CMText>
          {props.activeSide === "white" && (
            <MovementIndicator
              side={"white"}
              results={props.gameResults}
              previous={props.previousResults}
            />
          )}
        </>
      )}
    </div>
  );
  const percentBlack = props.gameResults.black / total;
  const blackResults = (
    <div
      style={s(
        c.width(`${(props.gameResults.black / total) * 100}%`),
        c.bg(c.grays[6]),
        c.alignCenter,
        c.row,
        c.px(4),
        props.activeSide === "black" ? c.justifyStart : c.justifyEnd
      )}
    >
      {props.gameResults.black / total > threshold && !props.hideNumbers && (
        <>
          <CMText
            style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(fontSize))}
          >
            {formatWinPercentage(props.gameResults.black / total)}
            {percentBlack > showPercentageThreshold && <span class="">%</span>}
          </CMText>
          {props.activeSide === "black" && (
            <MovementIndicator
              side={"black"}
              results={props.gameResults}
              previous={props.previousResults}
            />
          )}
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
          c.bg(c.grays[40]),
          c.center
        )}
      >
        {props.gameResults.draw / total > threshold &&
          !props.hideNumbers &&
          !props.activeSide && (
            <CMText
              style={s(c.fg(c.grays[75]), c.weightBold, c.fontSize(fontSize))}
            >
              {formatWinPercentage(props.gameResults.draw / total)}
            </CMText>
          )}
      </div>
      {last}
    </div>
  );
};

export const MovementIndicator = (props: {
  results: GameResultsDistribution;
  previous: GameResultsDistribution;
  side: Side;
}) => {
  if (getTotalGames(props.results) < 10 || !props.previous) {
    return null;
  }

  let icon = null;
  let color = null;
  const threshold = 0.02;
  const oldWr = getWinRate(props.previous, props.side);
  const newWr = getWinRate(props.results, props.side);
  if (newWr < oldWr - threshold) {
    if (
      getDrawAdjustedWinRate(props.results, props.side) <
      getDrawAdjustedWinRate(props.previous, props.side) - threshold
    ) {
      icon = "fa-sharp fa-arrow-down-right";
      color = props.side === "white" ? c.reds[45] : c.reds[55];
    }
  } else if (newWr > oldWr + threshold) {
    icon = "fa-sharp fa-arrow-up-right";
    color = props.side === "white" ? c.colors.success : c.colors.success;
  }
  if (!icon) {
    return null;
  }
  return (
    <div class={"pl-px"}>
      <i class={icon} style={s(c.fg(color), c.fontSize(10))} />
    </div>
  );
};
