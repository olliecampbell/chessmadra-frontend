import { Show } from "solid-js";
import { clsx } from "~/utils/classes";
import { createDebugStateEffect } from "~/utils/debug_effect";
import { useIsMobileV2 } from "~/utils/isMobile";
import { c, stylex } from "~/utils/styles";
import { LogoFull } from "./icons/LogoFull";

export const RepertoirePageLayout = (props: {
	children: any;
	bottom?: any;
	flushTop?: boolean;
	centered?: boolean;
	fullHeight?: boolean;
	naked?: boolean;
	loading?: boolean;
}) => {
	const isMobile = useIsMobileV2();

	createDebugStateEffect();
	const backgroundColor = c.gray[8];
	return (
		<div
			style={stylex(c.column, c.fullWidth, c.bg(backgroundColor), c.grow)}
			class={clsx(
				!props.loading && "pt-[env(safe-area-inset-top)]",
				"min-h-[100dvh]",
			)}
		>
			<div
				style={stylex(
					isMobile() ? stylex(c.grow) : c.flexShrink(1),
					props.centered && c.grow,
					props.fullHeight && c.grow,
					props.loading && c.grow,
				)}
			>
				<Show when={props.loading}>
					<div style={stylex(c.grow, c.center)}>
						<div class={clsx("w-40")}>
							<LogoFull />
						</div>
					</div>
				</Show>
				<Show when={!props.loading}>
					<div
						style={stylex(
							!isMobile() && stylex(c.overflowY("auto")),
							isMobile() && stylex(c.grow),
							c.center,
							c.justifyStart,
							c.flexShrink(1),
							props.fullHeight && stylex(c.grow),
							!props.flushTop && !props.naked && c.pt(isMobile() ? 24 : 48),
							props.centered && stylex(c.grow, c.justifyCenter),
						)}
					>
						<div
							style={stylex(
								!props.fullHeight &&
									!props.naked &&
									c.pb(isMobile() ? 92 : 180),
								c.center,
								c.fullWidth,
								props.fullHeight && c.grow,
							)}
						>
							{props.children}
						</div>
					</div>
				</Show>
			</div>
			<Show when={!props.loading}>{props.bottom}</Show>
		</div>
	);
};
