import { JSX, Show, createSignal, onMount } from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import { c, s } from "~/utils/styles";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { VERTICAL_BREAKPOINT } from "./SidebarLayout";

type AnimateSidebar = (dir: "left" | "right") => void;

let _animateSidebar: AnimateSidebar | null = null;
export const animateSidebar = (dir: "left" | "right") => {
	_animateSidebar?.(dir);
};

export const SidebarContainer = (props: {
	settings: JSX.Element;
	children: JSX.Element;
	backSection: JSX.Element;
}) => {
	onMount(() => {
		_animateSidebar = (dir: "left" | "right") => {
			if (!previousRef() || !currentRef()) {
				return;
			}
			const clone = currentRef().cloneNode(true);
			previousRef().replaceChildren(clone);
			const ms = 200;
			const duration = `${ms}ms`;
			previousRef().style.transform = "translateX(0px)";
			currentRef().style.transform =
				dir === "right" ? "translateX(40px)" : "translateX(-40px)";
			previousRef().style.transition = "";
			currentRef().style.transition = "";
			previousRef().style.opacity = "1";
			currentRef().style.opacity = "0";
			previousRef().offsetHeight; /* trigger reflow */
			previousRef().style.transition = `opacity ${duration}, transform ${duration}`;
			currentRef().style.transition = `opacity ${duration}, transform ${duration}`;
			previousRef().style.opacity = "0";
			previousRef().style.transform =
				dir === "left" ? "translateX(40px)" : "translateX(-40px)";
			setTimeout(() => {
				currentRef().style.opacity = "1";
				currentRef().style.transform = "translateX(0px)";
				previousRef().replaceChildren();
			}, ms);
		};
	});
	// @ts-ignore
	const [previousRef, setPreviousRef] = createSignal<HTMLElement>(null);
	// @ts-ignore
	const [currentRef, setCurrentRef] = createSignal<HTMLElement>(null);

	const responsive = useResponsiveV2();
	const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;

	return (
		<div
			style={s(
				c.column,
				c.zIndex(4),
				c.relative,
				c.overflowHidden,
				c.bg(c.gray[14]),
				c.pb(20),
				c.minHeight("100%"),
			)}
		>
			<Show when={!vertical()}>
				<div
					style={s(
						c.absolute,
						c.top(0),
						c.right(0),
						c.zIndex(15),
						c.pr(c.getSidebarPadding(responsive())),
						c.pt(c.getSidebarPadding(responsive())),
					)}
				>
					{props.settings}
				</div>
			</Show>
			{!vertical() && props.backSection}
			<div
				style={s(
					c.column,
					// c.top(200),
					c.fullWidth,
					c.displayGrid,
					c.grow,
					c.right(0),
				)}
			>
				<div
					id="prev-sidebar"
					ref={setPreviousRef}
					style={s(
						c.keyedProp("grid-area")("1/1"),
						c.displayFlex,
						c.noPointerEvents,
					)}
				/>
				<div
					ref={setCurrentRef}
					style={s(c.keyedProp("grid-area")("1/1"), c.displayFlex)}
				>
					<Show when={vertical()}>{props.backSection}</Show>
					{props.children}
				</div>
			</div>
		</div>
	);
};
