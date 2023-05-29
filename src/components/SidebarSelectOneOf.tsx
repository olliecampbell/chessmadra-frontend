import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import {
  Component,
  createSignal,
  createEffect,
  For,
  on,
  Show,
  JSX,
} from "solid-js";

export const SidebarSelectOneOf: Component<{
  title: string;
  description: string;
  equality: (a: any, b: any) => boolean;
  choices: any[];
  activeChoice: any;
  onSelect: (_: any, i?: number) => void;
  renderChoice: (x: any, active: boolean) => JSX.Element;
  // todo: typing is hard
}> = (props) => {
  const responsive = useResponsive();
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
          "bg-sidebar_button_primary &hover:bg-sidebar_button_primary_hover !text-primary",
        onPress: () => props.onSelect(choice, i),
        right: () =>
          active && (
            <i class={`fa fa-check`} style={s(c.fg(c.colors.textPrimary))} />
          ),
      };
    });
  return (
    <div style={s(c.column, c.fullWidth)}>
      <Show when={props.title}>
        <>
          <CMText
            style={s(
              c.fontSize(14),
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.px(c.getSidebarPadding(responsive))
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
      <div style={s(c.fullWidth)}>
        <For each={actions()}>
          {(action, i) => {
            return <SidebarFullWidthButton action={action} />;
          }}
        </For>
      </div>
    </div>
  );
};
