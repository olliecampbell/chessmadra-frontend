// import { ExchangeRates } from "~/ExchangeRate";
import { filter, some, values, sum } from "lodash-es";
import { useRepertoireState, quick, getAppState } from "~/utils/app_state";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";
import { bySide } from "~/utils/repertoire";
import { isMoveDifficult } from "~/utils/srs";
import { countQueue } from "~/utils/queues";
import { COMMON_MOVES_CUTOFF } from "~/utils/review";
import { ReviewText } from "./ReviewText";
import { Label } from "./Label";
import { useIsMobile } from "~/utils/isMobile";

export const PreReview = (props: { side: Side | null }) => {
  const [numMovesDueBySide] = useRepertoireState((s) => [
    bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
  ]);
  const actions = () => {
    const actions: SidebarAction[] = [];
    const queue = getAppState().repertoireState.reviewState.buildQueue({
      side: props.side,
      filter: "due",
    });
    const difficultCount = countQueue(
      filter(queue, (m) => some(m.moves, (m) => isMoveDifficult(m)))
    );
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    const due = props.side ? numMovesDueBySide()[props.side] : totalDue;
    const isMobile = useIsMobile();
    if (due > 0) {
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
        text: (
          <div class={clsx("row items-center")}>
            <p class={clsx()}>
              Everything that's due {isMobile ? "" : "for review"}
              <Label>Recommended</Label>
            </p>
          </div>
        ),
        right: <ReviewText numDue={due} />,
        style: "secondary",
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
        text: "Just the most common moves",
        right: <ReviewText numDue={COMMON_MOVES_CUTOFF} />,
        style: "secondary",
      });
    }
    if (difficultCount > 0) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.reviewState.startReview({
              side: props.side,
              filter: "difficult-due",
            });
          });
        },
        text: "Just the moves I often get wrong",
        right: <ReviewText numDue={difficultCount} />,
        style: "secondary",
      });
    }
    const myMoves = getAppState().repertoireState.numMyMoves;
    const numMyMoves = props.side ? myMoves[props.side] : sum(values(myMoves));
    if (numMyMoves > due) {
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
        text: props.side
          ? `My entire ${props.side} repertoire`
          : "My entire repertoire",
        right: `${numMyMoves} moves`,
        style: "secondary",
      });
    }
    const side = props.side;
    if (side) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.startBrowsing(side as Side, "browse");
          });
        },
        text: "A specific opening I've added",
        right: <i class="fa fa-arrow-right" />,
        style: "secondary",
      });
    }
    return actions;
  };
  return (
    <SidebarTemplate
      header={"What would you like to practice?"}
      actions={actions()}
      bodyPadding={true}
    />
  );
};
