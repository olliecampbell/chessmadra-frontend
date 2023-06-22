import { clsx } from "~/utils/classes";
import { CMText } from "./CMText";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";
import { createMemo, For, onMount } from "solid-js";
import { Bullet } from "./Bullet";
import { useRepertoireState, quick } from "~/utils/app_state";
import { forEach, min, filter } from "lodash-es";
import { Repertoire, RepertoireMove, Side } from "~/utils/repertoire";
import { pluralize } from "~/utils/pluralize";
import { getHumanTimeUntil } from "./ReviewText";
import {
  ChooseToCreateAccountOnboarding,
} from "./SidebarOnboarding";
import { trackEvent } from "~/utils/trackEvent";
import { START_EPD } from "~/utils/chess";
import { bySide } from "~/utils/repertoire";

export const PracticeComplete = () => {
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [repertoire] = useRepertoireState((s) => [s.repertoire]);
  const [allReviewPositionMoves] = useRepertoireState((s) => [
    s.reviewState.allReviewPositionMoves,
  ]);
  const moves = createMemo(() => {
    const moves: { epd: string; sanPlus: string; failed: boolean; side: Side }[] =
      [];
    forEach(allReviewPositionMoves(), (sanLookup, epd) => {
      forEach(sanLookup, ({ failed, side }, sanPlus) => {
        moves.push({ epd, sanPlus, failed, side });
      });
    });
    return moves;
  });
  const numFailed = () => {
    return moves().filter((m) => m.failed).length;
  };
  const numCorrect = () => {
    return moves().filter((m) => !m.failed).length;
  };
  const total = () => {
    return moves().length;
  };
  const [numMovesDueBySide] = useRepertoireState((s) => [
    bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
  ]);
  const earliestDue = () => {
    const rep = repertoire() as Repertoire;
    const dues = moves().flatMap((m) => {
      return rep[m.side].positionResponses[m.epd]?.map((r: RepertoireMove) => {
        if (r.sanPlus === m.sanPlus) {
          return r.srs?.dueAt;
        }
      });
    });
    // can assume there will be one
    return new Date(min(filter(dues, (d) => d !== undefined)) as string);
  };
  onMount(() => {
    trackEvent("practice_complete", {
      num_failed: numFailed(),
      num_correct: numCorrect(),
    });
  });

  const bullets = () => {
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    const bullets = [];
    bullets.push(
      <>
        You practiced{" "}
        <span class={clsx("text-highlight font-semibold")}>
          {pluralize(total(), "move")}
        </span>
      </>
    );
    bullets.push(
      <>
        You played the correct move{" "}
        <span class={clsx("text-highlight font-semibold")}>
          {pluralize(numCorrect(), "time")}
        </span>{" "}
        ({Math.round((100 * numCorrect()) / total())}%)
      </>
    );
    if (totalDue > 0) {
      bullets.push(
        <>
          You have{" "}
          <span class={clsx("text-highlight font-semibold")}>
            {pluralize(totalDue, "move")}
          </span>{" "}
          due for review now
        </>
      );
    } else {
      bullets.push(
        <>
          These moves will be due for review again in{" "}
          <span class={clsx("text-highlight font-semibold")}>
            {getHumanTimeUntil(earliestDue())}
          </span>
        </>
      );
    }
    return bullets;
  };
  return (
    <SidebarTemplate
      header={"Practice complete!"}
      bodyPadding={true}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              trackEvent("practice_complete.continue");
              if (s.repertoireState.onboarding.isOnboarding) {
                trackEvent("onboarding.practice_complete.continue");
                s.repertoireState.browsingState.pushView(
                  ChooseToCreateAccountOnboarding
                );
                s.repertoireState.updateRepertoireStructures();
              } else {
                s.repertoireState.browsingState.moveSidebarState("left");
                s.repertoireState.backToOverview();
              }
            });
          },
          text: "Continue",
          style: "primary",
        },
      ]}
    >
      <CMText class={clsx("text-primay font-bold")}>
        Your stats from this session:
      </CMText>
      <Spacer height={12} />
      <div class={"space-y-2"}>
        <For each={bullets()}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
      </div>
    </SidebarTemplate>
  );
};
