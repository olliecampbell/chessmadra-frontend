import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import { useRepertoireState, quick } from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import React, { useEffect } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { pgnToLine } from "app/utils/repertoire";
import { SidebarLayout } from "./RepertoireBrowsingView";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { pluralize } from "app/utils/pluralize";

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
        <View style={s(c.row, c.alignCenter)}>
          <i
            style={s(c.fg(color), c.fontSize(14))}
            className="fa-regular fa-clock"
          ></i>
          <Spacer width={4} />
          <CMText style={s(textStyles, c.fg(color))}>{dueString}</CMText>
        </View>
      }
    </>
  );
};
