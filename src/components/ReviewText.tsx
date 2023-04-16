// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { pluralize } from "~/utils/pluralize";

export const ReviewText = ({
  date: dateString,
  numDue,
  inverse,
  overview,
}: {
  date: string;
  inverse?: boolean;
  overview?: boolean;
  numDue: number;
}) => {
  const textStyles = s(
    c.fg(c.grays[80]),
    c.weightSemiBold,
    c.fontSize(12),
    c.lineHeight("1.3rem")
  );
  const date = new Date(dateString);
  const numMovesDueFromHere = numDue;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  let dueString = "";
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  let color = c.grays[50];
  const prefix = overview ? `Due in` : `Due in`;
  if (diff < 0) {
    color = inverse ? c.oranges[30] : c.oranges[70];
    dueString = `${numMovesDueFromHere.toLocaleString()} Due`;
  } else if (minutes < 60) {
    dueString = `${prefix} ${pluralize(Math.round(minutes), "minute")}`;
  } else if (hours < 24) {
    dueString = `${prefix} ${pluralize(Math.round(hours), "hour")}`;
  } else {
    dueString = `${prefix} ${pluralize(Math.round(days), "day")}`;
  }
  return (
    <>
      {
        <div style={s(c.row, c.alignCenter)}>
          <CMText style={s(textStyles, c.fg(color))}>{dueString}</CMText>
          <Spacer width={4} />
          <i
            style={s(c.fg(color), c.fontSize(12))}
            class="fa-regular fa-clock"
          ></i>
        </div>
      }
    </>
  );
};
