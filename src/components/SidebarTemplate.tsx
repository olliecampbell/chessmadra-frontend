// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { Component, For, Show } from "solid-js";
import { Puff } from "solid-spinner";

export const SidebarTemplate: Component<{
  header: string | null;
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
        <Spacer height={32} />
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
                <Puff color={c.primaries[65]} />
              </CMText>
            </div>
          }
          keyed
        >
          {props.children}
        </Show>
      </div>
      <Spacer height={props.children ? (responsive.isMobile ? 24 : 36) : 0} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        <For each={props.actions}>
          {(action) => <SidebarFullWidthButton action={action} />}
        </For>
      </div>
    </div>
  );
};
