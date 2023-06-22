// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarActions, SidebarFullWidthButton } from "./SidebarActions";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { Component, createEffect, For, Show } from "solid-js";
import { Puff } from "solid-spinner";

export const SidebarTemplate: Component<{
  header: string | null;
  children: any;
  loading?: boolean;
  bodyPadding?: boolean;
  actions: SidebarAction[];
}> = (props) => {
  const responsive = useResponsive();
  return (
    <div style={s(c.column)}>
      <Show when={props.header}>
        <div class={"padding-sidebar"}>
          <SidebarHeader>{props.header}</SidebarHeader>
        </div>

        <div class={"h-6 lg:h-10"} />
      </Show>
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
      >
        <div
          style={s(
            c.column,
            props.bodyPadding && c.px(c.getSidebarPadding(responsive)),
            c.zIndex(2),
            c.relative
          )}
        >
          {props.children}
        </div>
        <Spacer height={props.children ? (responsive.isMobile ? 24 : 36) : 0} />
        <SidebarActions actions={props.actions} />
      </Show>
    </div>
  );
};
