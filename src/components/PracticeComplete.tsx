import { clsx } from "~/utils/classes";
import { CMText } from "./CMText";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";
import { createEffect, createMemo, For } from "solid-js";
import { Bullet } from "./Bullet";
import { useRepertoireState, quick } from "~/utils/app_state";
import { SidebarAction } from "./SidebarActions";
import { forEach, min, filter } from "lodash-es";
import { Repertoire, RepertoireMove, Side } from "~/utils/repertoire";
import { pluralize } from "~/utils/pluralize";
import { getHumanTimeUntil } from "./ReviewText";
import { OnboardingComplete } from "./SidebarOnboarding";

export const PracticeComplete = () => {
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [repertoire] = useRepertoireState((s) => [s.repertoire]);
  const [allReviewPositionMoves] = useRepertoireState((s) => [
    s.reviewState.allReviewPositionMoves,
  ]);
  let moves = createMemo(() => {
    let moves: { epd: string; sanPlus: string; failed: boolean; side: Side }[] =
      [];
    forEach(allReviewPositionMoves(), (sanLookup, epd) => {
      forEach(sanLookup, ({ failed, side }, sanPlus) => {
        console.log({ epd, sanPlus, failed });
        moves.push({ epd, sanPlus, failed, side });
      });
    });
    return moves;
  });
  let numFailed = () => {
    return moves().filter((m) => m.failed).length;
  };
  let numCorrect = () => {
    return moves().filter((m) => !m.failed).length;
  };
  let total = () => {
    return moves().length;
  };
  let earliestDue = () => {
    let rep = repertoire() as Repertoire;
    let dues = moves().flatMap((m) => {
      return rep[m.side].positionResponses[m.epd]?.map((r: RepertoireMove) => {
        if (r.sanPlus === m.sanPlus) {
          return r.srs?.dueAt;
        }
      });
    });
    // can assume there will be one
    return new Date(min(filter(dues, (d) => d !== undefined)) as string);
  };
  createEffect(() => {
    console.log(
      "All debug, numFailed",
      numFailed(),
      numCorrect(),
      total(),
      earliestDue()
    );
  });

  const bullets = () => {
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
    bullets.push(
      <>
        These moves will be due for review again in{" "}
        <span class={clsx("text-highlight font-semibold")}>
          {getHumanTimeUntil(earliestDue())}
        </span>
      </>
    );
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
              if (s.repertoireState.onboarding.isOnboarding) {
                s.repertoireState.browsingState.pushView(OnboardingComplete);
              } else {
                s.repertoireState.backToOverview();
              }
            });
          },
          text: "Continue",
          style: "primary",
        },
      ]}
    >
      <CMText class={clsx("body-text")}>Your stats from this session:</CMText>
      <Spacer height={12} />
      <div class={"space-y-2"}>
        <For each={bullets()}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
      </div>
    </SidebarTemplate>
  );
};
