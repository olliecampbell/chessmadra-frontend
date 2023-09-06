import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { Component, For, Show, JSX } from "solid-js";
import { clsx } from "~/utils/classes";

export const SidebarSelectOneOf: Component<{
  title?: string;
  description?: string;
  equality?: (choice: any, activeChoice: any) => boolean;
  choices: any[];
  activeChoice: any;
  onSelect: (_: any, i?: number) => void;
  renderChoice: (x: any, active: boolean) => JSX.Element;
  // todo: typing is hard
}> = (props) => {
  const responsive = useResponsiveV2();
  const actions = () =>
    props.choices.map((choice, i) => {
      const active = props.equality
        ? props.equality(choice, props.activeChoice)
        : choice === props.activeChoice;
      return {
        style: "secondary" as SidebarAction["style"],
        text: props.renderChoice(choice, active),
        class:
          active &&
          "bg-sidebar_button_primary &hover:bg-sidebar_button_primary_hover !text-primary w-full",
        onPress: () => props.onSelect(choice, i),
        right: (
          <i
            class={clsx(
              "fa fa-check transition-opacity",
              !active && "opacity-0",
            )}
            style={s(c.fg(c.colors.text.primary))}
          />
        ),
      } as SidebarAction;
    });
  return (
    <div style={s(c.column, c.fullWidth)}>
      <Show when={props.title}>
        <>
          <CMText
            style={s(
              c.fontSize(14),
              c.weightSemiBold,
              c.fg(c.colors.text.primary),
              c.px(c.getSidebarPadding(responsive())),
            )}
          >
            {props.title}
          </CMText>
        </>
      </Show>
      <Show when={props.description}>
        <>
          <CMText class={"body-text padding-sidebar"}>
            {props.description}
          </CMText>
          <Spacer height={12} />
        </>
      </Show>
      <div
        style={s(c.fullWidth)}
        class="border-t-1 border-t-solid border-t-border"
      >
        <For each={actions()}>
          {(action, i) => {
            return <SidebarFullWidthButton action={action} />;
          }}
        </For>
      </div>
    </div>
  );
};
