import { View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { intersperse } from "../utils/intersperse";
import { LichessGame } from "~/utils/models";
import { lineToPgn } from "~/utils/repertoire";
import { take } from "lodash-es";
import { MemorizedGameStatus } from "~/utils/game_memorization_state";
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
    <div
      style={s(
        c.py(12),
        c.bg(c.grays[15]),
        c.br(2),
        c.overflowHidden,
        c.clickable,
        c.relative
      )}
    >
      {!hideLink && (
        <div style={s(c.absolute, c.top(0), c.right(0), c.pr(12), c.pt(12))}>
          <CMText style={s()}>
            <i
              style={s(
                c.fg(c.colors.textPrimary),
                c.fontSize(18),
                c.fg(c.grays[40])
              )}
              className="fa-sharp fa-arrow-up-right-from-square"
            ></i>
          </CMText>
        </div>
      )}
      <Spacer height={0} />
      <div style={s(c.row, c.px(12))}>
        {intersperse(
          ["white", "black"].map((color, i) => {
            // console.log(game);
            return (
              <div style={s(c.column)} key={color}>
                <div style={s(c.row, c.alignCenter)}>
                  <CMText style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
                    {game[`${color}Name`]}
                  </CMText>
                </div>
              </div>
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
      </div>
      <Spacer height={6} />
      {showFirstMoves && (
        <div style={s(c.px(12), c.row)}>
          <CMText style={s(c.fg(c.grays[60]), c.weightRegular, c.fontSize(12))}>
            {lineToPgn(take(game.moves, 4))} ...
          </CMText>
        </div>
      )}
    </div>
  );
};
