// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "~/components/TrainerLayout";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { useRepertoireState, quick } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { pgnToLine } from "~/utils/repertoire";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { pluralize } from "~/utils/pluralize";
import { View } from "./View";

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
  let textStyles = s(
    c.fg(c.grays[80]),
    c.weightSemiBold,
    c.fontSize(12),
    c.lineHeight("1.3rem")
  );
  const date = new Date(dateString);
  const numMovesDueFromHere = numDue;
  let now = new Date();
  let diff = date.getTime() - now.getTime();
  let dueString = "";
  let seconds = diff / 1000;
  let minutes = seconds / 60;
  let hours = minutes / 60;
  let days = hours / 24;
  let color = c.grays[50];
  const prefix = overview ? `Next review in` : `Due in`;
  if (diff < 0) {
    color = inverse ? c.oranges[30] : c.oranges[70];
    dueString = `${numMovesDueFromHere} Due`;
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
          <i
            style={s(c.fg(color), c.fontSize(12))}
            className="fa-regular fa-clock"
          ></i>
          <Spacer width={4} />
          <CMText style={s(textStyles, c.fg(color))}>{dueString}</CMText>
        </div>
      }
    </>
  );
};
