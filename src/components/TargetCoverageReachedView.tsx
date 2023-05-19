import { Spacer } from "~/components/Space";
import { isEmpty, cloneDeep } from "lodash-es";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarTemplate } from "./SidebarTemplate";
import { quick, useSidebarState } from "~/utils/app_state";
import { CMText } from "./CMText";
import { trackEvent } from "~/utils/trackEvent";
import { c, s } from "~/utils/styles";
import { Intersperse } from "./Intersperse";
import { Accessor, createEffect, For, Show } from "solid-js";
import { SidebarAction } from "./SidebarActions";

export const TargetCoverageReachedView = () => {
  const [planSections, showPlansState] = useSidebarState(([s]) => [
    cloneDeep(s.planSections),
    s.showPlansState,
  ]);
  const actions: Accessor<SidebarAction[]> = () => {
    let acts: SidebarAction[] = [];
    if (showPlansState().coverageReached) {
      acts = [
        {
          onPress: () => {
            trackEvent(`${mode()}.save_line`);
            quick((s) => {
              s.repertoireState.browsingState.requestToAddCurrentLine();
            });
          },
          style: "focus",
          text: "I'm done, save this line to my repertoire",
        },
        {
          onPress: () => {
            quick((s) => {
              trackEvent(`${mode()}.plans_view.keep_adding`);
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.dismissTransientSidebarState();
            });
          },
          style: "primary",
          text: "Keep adding moves to this line",
        },
      ];
    }
    return acts;
  };
  const [mode] = useSidebarState(([s]) => [s.mode]);

  return (
    <SidebarTemplate
      header={
        showPlansState().coverageReached
          ? "You've reached your target depth!"
          : "How to play from here"
      }
      actions={actions()}
      bodyPadding={true}
    >
      <Show when={!isEmpty(planSections())}>
        <PlayFromHere />
      </Show>
      <Show when={isEmpty(planSections())}>
        <CMText
          style={s(c.weightRegular, c.fontSize(14), c.fg(c.colors.textPrimary))}
        >
          Do you want to keep adding moves to this line, or save your progress?
        </CMText>
      </Show>
    </SidebarTemplate>
  );
};

export const PlayFromHere = ({ isolated }: { isolated?: boolean }) => {
  const [planSections, showPlansState] = useSidebarState(([s]) => [
    cloneDeep(s.planSections),
    s.showPlansState,
  ]);
  return (
    <>
      <Show when={showPlansState().coverageReached || isolated}>
        <CMText
          style={s(c.weightBold, c.fontSize(14), c.fg(c.colors.textPrimary))}
        >
          How to play from here
        </CMText>
        <Spacer height={18} />
      </Show>
      <div class={"space-y-4"}>
        <For each={planSections()}>
          {(section, i) => {
            return (
              <div style={s(c.row, c.alignStart)}>
                <i
                  class="fa-solid fa-circle"
                  style={s(c.fontSize(6), c.fg(c.grays[70]), c.mt(6))}
                />
                <Spacer width={8} />
                <p class={"text-primary"}>{section()}</p>
              </div>
            );
          }}
        </For>
      </div>
    </>
  );
};
