// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  isNil,
  sortBy,
  filter,
  range,
  forEach,
  some,
  values,
  sum,
} from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  getAppState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Accessor, createEffect, createMemo, For, Show } from "solid-js";
import { Intersperse } from "./Intersperse";
import { RepertoireMove, Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { bySide } from "~/utils/repertoire";
import { isMoveDifficult } from "~/utils/srs";
import { countQueue } from "~/utils/queues";
import { pluralize } from "~/utils/pluralize";
import { COMMON_MOVES_CUTOFF } from "~/utils/review";

export const PreReview = (props: { side: Side | null }) => {
  const [numMovesDueBySide] = useRepertoireState((s) => [
    bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
  ]);
  let actions = () => {
    let actions: SidebarAction[] = [];
    const queue = getAppState().repertoireState.reviewState.buildQueue({
      side: props.side,
      filter: "due",
    });
    const difficultCount = countQueue(
      filter(queue, (m) => some(m.moves, (m) => isMoveDifficult(m)))
    );
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    if (true) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.reviewState.startReview({
              side: props.side,
              filter: "due",
            });
          });
        },
        text: "All the moves that are due for review",
        right: `${pluralize(totalDue, "move")}`,
        style: "focus",
      });
    }
    if (COMMON_MOVES_CUTOFF < totalDue) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.reviewState.startReview({
              side: props.side,
              filter: "common",
            });
          });
        },
        text: "Just the most common due moves",
        right: `${COMMON_MOVES_CUTOFF} moves`,
        style: "primary",
      });
    }
    if (difficultCount > 0) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.reviewState.startReview({
              side: props.side,
              filter: "difficult",
            });
          });
        },
        text: "Just the moves I often get wrong",
        right: `${pluralize(difficultCount, "move")}`,
        style: "primary",
      });
    }
    const myMoves = getAppState().repertoireState.numMyMoves;
    const numMyMoves = props.side ? myMoves[props.side] : sum(values(myMoves));
    actions.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.popView();
          s.repertoireState.reviewState.startReview({
            side: props.side,
            filter: "all",
          });
        });
      },
      text: "Every single move in my repertoire",
      right: `${numMyMoves} moves`,
      style: "primary",
    });
    let side = props.side;
    if (side) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.startBrowsing(side as Side, "browse");
          });
        },
        text: "A specific opening I've added",
        right: "",
        style: "primary",
      });
    }
    return actions;
  };
  return (
    <SidebarTemplate
      header={"What would you like to practice?"}
      actions={actions()}
      bodyPadding={true}
    ></SidebarTemplate>
  );
};
