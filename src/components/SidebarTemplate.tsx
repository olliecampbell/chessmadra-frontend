import { Component, Show, mergeProps } from "solid-js";
import { Puff } from "solid-spinner";
import { Spacer } from "~/components/Space";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { SidebarAction, SidebarActions } from "./SidebarActions";

export const SidebarTemplate: Component<{
	header: string | null;
	children?: any;
	loading?: boolean;
	bodyPadding?: boolean;
	actionsPadding?: boolean;
	actions: SidebarAction[];
}> = (props) => {
	props = mergeProps(
		{
			actionsPadding: true,
		},
		props,
	);
	const responsive = useResponsiveV2();
	return (
		<div style={s(c.column)}>
			<Show when={props.header}>
				<div class={"padding-sidebar"}>
					<SidebarHeader>{props.header}</SidebarHeader>
				</div>

				<div class={"h-4 lg:h-10"} />
			</Show>
			<Show
				when={!props.loading}
				fallback={
					<div style={s(c.selfCenter, c.pt(48), c.center)}>
						<CMText
							style={s(c.fontSize(14), c.weightSemiBold, c.fg(c.gray[75]))}
						>
							<Puff color={c.primaries[65]} />
						</CMText>
					</div>
				}
			>
				<div
					style={s(
						c.column,
						props.bodyPadding && c.px(c.getSidebarPadding(responsive())),
						c.zIndex(2),
						c.relative,
					)}
				>
					{props.children}
				</div>
				<Spacer
					height={
						props.children && props.actionsPadding
							? responsive().isMobile
								? 24
								: 36
							: 0
					}
				/>
				<SidebarActions actions={props.actions} />
			</Show>
		</div>
	);
};
