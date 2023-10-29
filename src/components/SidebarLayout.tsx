import { createElementBounds } from "@solid-primitives/bounds";
import { includes, isEmpty } from "lodash-es";
import {
	JSX,
	JSXElement,
	Show,
	createEffect,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import {
	getAppState,
	quick,
	useMode,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { ChessboardInterface } from "~/utils/chessboard_interface";
import { clsx } from "~/utils/classes";
import { isChessmadra, isNative } from "~/utils/env";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { FadeInOut } from "./FadeInOut";
import { Intersperse } from "./Intersperse";
import { Pressable } from "./Pressable";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { SidebarContainer, animateSidebar } from "./SidebarContainer";

export const VERTICAL_BREAKPOINT = BP.md;

export const SidebarLayout = (props: {
	shared?: boolean;
	chessboardView?: JSX.Element;
	breadcrumbs: JSXElement;
	sidebarContent: JSXElement;
	belowChessboard: JSXElement;
	chessboardInterface?: ChessboardInterface;
	backSection: JSXElement;
	settings: JSXElement;
	loading: boolean;
}) => {
	const mode = useMode();
	const [showingPlans] = useSidebarState(([s]) => [s.showPlansState.visible]);
	const chessboardFrozen = () => {
		let frozen = false;
		if (showingPlans()) {
			console.log("chessboardFrozen");
			frozen = true;
		}
		return frozen;
	};
	const activeTool = () => getAppState().trainersState.getActiveTool();

	const keydownListener = function (event: KeyboardEvent) {
		const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
		// todo: allow in review too
		if (mode() !== "build") {
			return;
		}
		// @ts-ignore
		const tagName = event.target?.tagName?.toLowerCase();
		if (tagName === "input" || tagName === "textarea") {
			return;
		}
		switch (
			key // change to event.key to key to use the above variable
		) {
			case "ArrowLeft":
				event.preventDefault();
				quick((s) => s.repertoireState.getChessboard()?.backOne());
				// Left pressed
				break;
			case "ArrowRight":
				event.preventDefault();
				quick((s) => s.repertoireState.getChessboard()?.forwardOne());
				// Right pressed
				break;
			case "ArrowUp":
				// Up pressed
				break;
			case "ArrowDown":
				// Down pressed
				break;
		}
	};
	onMount(() => {
		document.addEventListener("keydown", keydownListener);
	});
	onCleanup(() => {
		document.removeEventListener("keydown", keydownListener);
	});

	const responsive = useResponsiveV2();
	const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;
	const [chessboardContainerRef, setChessboardContainerRef] =
		createSignal(null);
	const chessboardLayout = createElementBounds(chessboardContainerRef, {
		trackMutation: false,
	});
	const chessboardHeight = () => chessboardLayout.height;
	const chessboardHidden = () => {
		if (isChessmadra) {
			return !activeTool();
		}
		if (vertical()) {
			return includes(["home", "overview"], mode());
		}
		return false;
	};
	createEffect(() => {
		if (isNative) {
			if (props.loading) {
				document.documentElement.style.overflow = "hidden";
			} else {
				document.documentElement.style.overflow = "auto";
			}
		}
	});

	return (
		<RepertoirePageLayout
			flushTop
			bottom={null}
			fullHeight
			naked
			loading={props.loading}
		>
			<div
				id=""
				class="md:px-4 items-center grow"
				style={stylex(
					!vertical ? c.containerStyles(responsive().bp) : c.fullWidth,
					c.noUserSelect,
				)}
			>
				<div
					class="grow self-stretch"
					style={stylex(
						vertical() ? c.width(c.min(600, "100%")) : c.fullWidth,
						vertical() ? c.column : c.row,
						vertical() ? c.justifyStart : c.justifyCenter,
					)}
				>
					<div
						style={stylex(
							c.column,
							!vertical() && stylex(c.grow, c.noBasis, c.flexShrink),
							vertical() && c.width("min(480px, 100%)"),
							!vertical() && c.minWidth("300px"),
							vertical() && c.grow,
							vertical() ? c.selfCenter : c.selfStretch,
						)}
						class={clsx(
							"md:max-w-[440px] lg:max-w-[440px] xl:max-w-[520px] 2xl:max-w-[650px]",
						)}
					>
						{!vertical() ? (
							<div style={stylex(c.height(140), c.column, c.justifyEnd)}>
								{props.breadcrumbs}
								<Spacer height={32} />
							</div>
						) : (
							<div class="row items-center w-full justify-between padding-sidebar py-2">
								{props.breadcrumbs}
								{props.settings}
							</div>
						)}
						<div ref={setChessboardContainerRef} class="col">
							<div
								class={clsx(
									"w-full duration-250 transition-opacity ease-in-out",
									vertical() && "self-center max-w-[480px] padding-sidebar",
									chessboardFrozen() && "pointer-events-none",
									chessboardHidden() ? "opacity-20" : "opacity-100",
								)}
							>
								{props.chessboardView ?? (
									<ChessboardView
										chessboardInterface={props.chessboardInterface!}
									/>
								)}
							</div>
							<Show when={props.belowChessboard}>
								<div class="row w-full justify-center pt-3 md:pt-5">
									{props.belowChessboard}
								</div>
							</Show>
							<Show when={responsive().isMobile}>
								<Spacer height={12} />
							</Show>
						</div>
						{vertical() ? (
							<div
								class={clsx(
									"transition-mt duration-250 ease-in-out relative z-10 grow",
								)}
								style={stylex(
									chessboardHeight()
										? // @ts-ignore
										  c.mt(!chessboardHidden() ? 0 : -chessboardHeight() + 100)
										: c.mt(0),
								)}
							>
								<SidebarContainer
									backSection={props.backSection}
									children={props.sidebarContent}
									settings={props.settings}
								/>
							</div>
						) : (
							<Spacer height={60} />
						)}
					</div>
					<Show when={!vertical()}>
						<>
							<Spacer
								width={responsive().switch(24, [BP.lg, 36], [BP.xl, 48])}
							/>
							<div
								// @ts-ignore
								id="sidebar"
								class={
									"max-w-[440px] lg:max-w-[600px] xl:max-w-[650px]  z-10 relative"
								}
								style={stylex(c.flexGrow(2), c.flexShrink, c.noBasis)}
							>
								<SidebarContainer
									backSection={props.backSection}
									children={props.sidebarContent}
									settings={props.settings}
								/>
							</div>
						</>
					</Show>
				</div>
			</div>
		</RepertoirePageLayout>
	);
};

export const NavBreadcrumbs = () => {
	const responsive = useResponsiveV2();
	const mobile = () => responsive().isMobile;
	const [breadcrumbs] = useRepertoireState((s) => [s.getBreadCrumbs(mobile())]);

	const hidden = () => breadcrumbs().length === 1;
	const mode = useMode();
	return (
		<FadeInOut
			open={!hidden()}
			style={stylex(c.row, c.alignCenter, c.constrainWidth)}
		>
			<Intersperse
				separator={() => {
					return (
						<div style={stylex(c.mx(responsive().switch(6, [BP.lg, 8])))}>
							<CMText style={stylex(c.fg(c.gray[40]))}>
								<i class="fa-light fa-angle-right" />
							</CMText>
						</div>
					);
				}}
				each={breadcrumbs}
			>
				{(breadcrumb) => (
					<Pressable
						style={stylex(breadcrumb().onPress ? c.clickable : c.unclickable)}
						onPress={() => {
							if (!breadcrumb().onPress) {
								return;
							}
							quick((s) => {
								trackEvent("breadcrumbs.clicked", {
									mode,
									breadcrumb: breadcrumb().text,
								});
								animateSidebar("left");
								breadcrumb().onPress?.();
							});
						}}
					>
						<div style={stylex()}>
							<CMText
								style={stylex(c.weightBold)}
								class={clsx(
									"text-tertiary",
									breadcrumb().onPress &&
										"&hover:text-primary text-sm transition-colors",
								)}
							>
								{breadcrumb().text}
							</CMText>
						</div>
					</Pressable>
				)}
			</Intersperse>
		</FadeInOut>
	);
};
