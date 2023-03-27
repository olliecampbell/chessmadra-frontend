import { View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { intersperse } from "../utils/intersperse";
import { LichessGame } from "~/utils/models";
import { formatGameResult } from "~/utils/formatGameResult";
import { lineToPgn } from "~/utils/repertoire";
import { take } from "lodash-es";
import { MemorizedGameStatus } from "~/utils/game_memorization_state";
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
    <div
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
    <Show when={!hideLink }>
        <div style={s(c.absolute, c.top(0), c.right(0), c.pr(12), c.pt(12))}>
          <CMText style={s()}>
            <i
              style={s(
                c.fg(c.colors.textInverse),
                c.fontSize(18),
                c.fg(c.grays[40])
              )}
              class="fa-sharp fa-arrow-up-right-from-square"
            ></i>
          </CMText>
        </div>
        </Show>
      <Spacer height={0} />
      <div style={s(c.column, c.px(16))}>
        {intersperse(
          ["white", "black"].map((color, i) => {
            // console.log(game);
            return (
              <div style={s(c.column)}>
                <div style={s(c.row, c.alignCenter)}>
                  <div style={s(c.round, c.size(12), c.bg(color))}></div>

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
                </div>
                <Show when={false }>
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
                  </Show>
              </div>
            );
          }),
          (i) => {
            return <Spacer height={12} key={i} />;
          }
        )}
      </div>
      <Spacer height={24} />
      <Show when={showFirstMoves }>
        <div style={s(c.px(16))}>
          <CMText style={s(c.fg(c.colors.textInverseSecondary), c.weightBold)}>
            {lineToPgn(take(game.moves, 8))}
          </CMText>
          <Spacer height={4} />
        </div>
        </Show>

      <div style={s(c.row, c.justifyBetween, c.alignEnd, c.px(16))}>
        <CMText
          style={s(c.weightBold, c.fontSize(18), c.fg(c.colors.textInverse))}
        >
          {formatGameResult(game.result)}
        </CMText>
        <CMText
          style={s(c.row, c.selfEnd, c.alignEnd, c.fg(c.colors.textInverse))}
        >
          <CMText
            style={s(c.weightBold, c.fontSize(18), c.fg(c.colors.textInverse))}
          >
            {Math.ceil(game.numberMoves / 2)}
          </CMText>
          <Spacer width={4} />
          <CMText
            style={s(c.fontSize(14), c.mb(0), c.fg(c.colors.textInverse))}
          >
            moves
          </CMText>
        </CMText>
      </div>
      {gameStatus?.everReviewed ? (
        <div
          style={s(
            c.bg(!gameStatus.needsReview ? c.primaries[50] : c.yellows[60]),
            c.mt(12),
            c.px(12),
            c.py(8)
          )}
        ></div>
      ) : (
        <Spacer height={12} />
      )}
    </div>
  );
};
