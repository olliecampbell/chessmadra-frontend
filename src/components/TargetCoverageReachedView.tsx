import { Spacer } from "~/components/Space";
import { isEmpty, cloneDeep } from "lodash-es";
import { SidebarTemplate } from "./SidebarTemplate";
import { quick, useSidebarState, useRepertoireState } from "~/utils/app_state";
import { CMText } from "./CMText";
import { trackEvent } from "~/utils/trackEvent";
import { c, s } from "~/utils/styles";
import { Accessor, For, Show } from "solid-js";
import { SidebarAction } from "./SidebarActions";

export const TargetCoverageReachedView = () => {
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
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
          text: "Save this line to my repertoire",
        },
      ];
      if (!onboarding().isOnboarding) {
        acts.push({
          onPress: () => {
            quick((s) => {
              trackEvent(`${mode()}.plans_view.keep_adding`);
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.dismissTransientSidebarState();
            });
          },
          style: "primary",
          text: "Keep adding moves",
        });
      }
    }
    return acts;
  };
  const [mode] = useSidebarState(([s]) => [s.mode]);

  return (
    <SidebarTemplate
      header={
        showPlansState().coverageReached
          ? "You've reached your coverage goal!"
          : "How to play from here"
      }
      actions={actions()}
      bodyPadding={true}
    >
      <Show when={onboarding().isOnboarding}>
        <p class="body-text pb-6">
          Let's add these moves to your repertoire! You'll be able to come back
          to change these at any time.
        </p>
      </Show>
      <Show when={!isEmpty(planSections())}>
        <PlayFromHere />
      </Show>
      <Show when={isEmpty(planSections()) && !onboarding().isOnboarding}>
        <CMText
          style={s(c.weightRegular, c.fontSize(14), c.fg(c.colors.text.primary))}
        >
          Do you want to keep adding moves, or save your progress?
        </CMText>
      </Show>
    </SidebarTemplate>
  );
};

export const PlayFromHere = (props: { isolated?: boolean }) => {
  const [planSections, showPlansState] = useSidebarState(([s]) => [
    cloneDeep(s.planSections),
    s.showPlansState,
  ]);
  return (
    <>
      <Show when={showPlansState().coverageReached || props.isolated}>
        <CMText
          style={s(c.weightBold, c.fontSize(14), c.fg(c.colors.text.primary))}
        >
          How to play from here
        </CMText>
        <Spacer height={12} />
      </Show>
      <div class={"space-y-2 lg:space-y-4"}>
        <For each={planSections()}>
          {(section, i) => {
            return (
              <div style={s(c.row, c.alignStart)}>
                <i
                  class="fa-solid fa-circle"
                  style={s(c.fontSize(6), c.fg(c.gray[70]), c.mt(6))}
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
