// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { pluralize } from "~/utils/pluralize";
import { destructure } from "@solid-primitives/destructure";

export const ReviewText = (props: {
  date?: string;
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
  const date = () => new Date(props.date || "");
  const numMovesDueFromHere = () => props.numDue;
  const now = new Date();
  const diff = () => date().getTime() - now.getTime();
  const prefix = () => (props.overview ? `Due in` : `Due in`);
  const { color, dueString } = destructure(() => {
    let dueString = "";
    let color = c.grays[50];
    if (!props.date || diff() < 0) {
      color = props.inverse ? c.oranges[30] : c.oranges[70];
      dueString = `${numMovesDueFromHere().toLocaleString()} Due`;
    } else {
      dueString = `${prefix()} ${getHumanTimeUntil(date())}`;
    }
    return {
      color,
      dueString,
    };
  });
  return (
    <>
      <div style={s(c.row, c.alignCenter)}>
        <CMText style={s(textStyles, c.fg(color()))}>{dueString()}</CMText>
        <i
          style={s(c.fg(color()), c.fontSize(12))}
          class="fa fa-clock pl-2"
        ></i>
      </div>
    </>
  );
};

export const getHumanTimeUntil = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  if (diff < 0) {
    return "Now";
  } else if (minutes < 60) {
    return `${pluralize(Math.round(minutes), "min")}`;
  } else if (hours < 24) {
    return `${pluralize(Math.round(hours), "hour")}`;
  } else {
    return `${pluralize(Math.round(days), "day")}`;
  }
};
