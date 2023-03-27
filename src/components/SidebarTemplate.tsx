// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { Accessor, Component, For, Show } from "solid-js";

export const SidebarTemplate: Component<{
  header: string;
  children: any;
  loading?: string;
  bodyPadding?: boolean;
  actions: SidebarAction[];
}> = (props) => {
  const responsive = useResponsive();
  return (
    <div style={s(c.column)}>
      <Show when={props.header}>
        <RepertoireEditingHeader>{props.header}</RepertoireEditingHeader>
        <Spacer height={12} />
      </Show>
      <div
        style={s(
          c.column,
          props.bodyPadding && c.px(c.getSidebarPadding(responsive)),
          c.zIndex(2),
          c.relative
        )}
      >
        <Show
          when={!props.loading}
          fallback={
            <div style={s(c.selfCenter, c.pt(48), c.center)}>
              <CMText
                style={s(c.fontSize(14), c.weightSemiBold, c.fg(c.grays[75]))}
              >
                loading
              </CMText>
            </div>
          }
          keyed
        >
          {props.children}
        </Show>
      </div>
      <Spacer height={36} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        <For each={props.actions}>
          {(action) => <SidebarFullWidthButton action={action} />}
        </For>
      </div>
    </div>
  );
};
