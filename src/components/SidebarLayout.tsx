import { createElementBounds } from "@solid-primitives/bounds";
import { includes, isEmpty } from "lodash-es";
import {
	JSX,
	JSXElement,
	Show,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import {
	getAppState,
	quick,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { ChessboardInterface } from "~/utils/chessboard_interface";
import { clsx } from "~/utils/classes";
import { isChessmadra } from "~/utils/env";
import { getLichessLink } from "~/utils/lichess";
import { c, s } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { FadeInOut } from "./FadeInOut";
import { Intersperse } from "./Intersperse";
import { MoveLog } from "./MoveLog";
import { Pressable } from "./Pressable";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { SidebarContainer } from "./SidebarContainer";

export const VERTICAL_BREAKPOINT = BP.md;

export const SidebarLayout = (props: {
	shared?: boolean;
	chessboardView?: JSX.Element;
	setAnimateSidebar: (fn: (dir: "right" | "left") => void) => void;
	breadcrumbs: JSXElement;
	sidebarContent: JSXElement;
	belowChessboard: JSXElement;
	chessboardInterface?: ChessboardInterface;
	backSection: JSXElement;
	settings: JSXElement;
	loading: boolean;
}) => {
	const [mode] = useSidebarState(([s]) => [s.mode]);
	const [showingPlans] = useSidebarState(([s]) => [s.showPlansState.visible]);
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const chessboardFrozen = () => {
		let frozen = false;
		if (showingPlans()) {
			console.log("chessboardFrozen");
			frozen = true;
		}
		return frozen;
	};
	const activeTool = () => getAppState().trainersState.getActiveTool();

	// const event = useKeyDownEvent();
	// console.log("renderign sidebar layout");
	//
	// createEffect(() => {
	//   const e = event();
	//   console.log(e); // => KeyboardEvent | null
	//
	//   if (e) {
	//     console.log("key is", e.key); // => "Q" | "ALT" | ... or null
	//     if (mode() === "review") {
	//       return;
	//     }
	//     if (e.key === "ArrowLeft") {
	//       e.preventDefault(); // prevent default behavior or last keydown event
	//       e.stopPropagation();
	//       quick((s) => s.repertoireState.backOne());
	//     }
	//     if (e.key === "ArrowRight") {
	//       quick((s) => s.repertoireState.backOne());
	//       e.preventDefault(); // prevent default behavior or last keydown event
	//     }
	//   }
	// });
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

	// let { side: paramSide } = useParams();
	// useEffect(() => {
	//   if (mode && !sideBarMode) {
	//     quick((s) => {
	//       s.navigationState.push("/");
	//     });
	//   }
	// }, [mode, sideBarMode]);
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
			console.log("checking this hidden thing", activeTool());
			return activeTool() !== "visualization";
		}
		if (vertical()) {
			return includes(["overview", "home"], mode());
		}
		return false;
	};

	return (
		<RepertoirePageLayout
			flushTop
			bottom={null}
			fullHeight
			naked
			loading={props.loading}
		>
			<div
				id="page-content"
				style={s(
					!vertical ? c.containerStyles(responsive().bp) : c.fullWidth,
					c.alignCenter,
					c.grow,
					c.noUserSelect,
				)}
			>
				<div
					style={s(
						vertical() ? c.width(c.min(600, "100%")) : c.fullWidth,
						vertical() ? c.column : c.row,
						c.grow,
						c.selfStretch,
						vertical() ? c.justifyStart : c.justifyCenter,
					)}
				>
					<div
						style={s(
							c.column,
							!vertical() && s(c.grow, c.noBasis, c.flexShrink),
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
							<div style={s(c.height(140), c.column, c.justifyEnd)}>
								{props.breadcrumbs}
								<Spacer height={32} />
							</div>
						) : (
							<div
								style={s(
									c.row,
									c.alignCenter,
									c.fullWidth,
									c.justifyBetween,
									c.px(c.getSidebarPadding(responsive())),
									c.py(8),
								)}
							>
								{props.breadcrumbs}
								{props.settings}
							</div>
						)}
						<div ref={setChessboardContainerRef} class="col">
							<div
								class={clsx("duration-250 transition-opacity ease-in-out")}
								style={s(
									c.fullWidth,
									vertical() &&
										s(
											c.selfCenter,
											c.maxWidth(480),
											c.px(c.getSidebarPadding(responsive())),
										),
									chessboardFrozen() && c.noPointerEvents,
									chessboardHidden() ? c.opacity(20) : c.opacity(100),
								)}
							>
								{props.chessboardView ?? (
									<ChessboardView
										chessboardInterface={props.chessboardInterface!}
									/>
								)}
							</div>
							<Show when={props.belowChessboard}>
								<Spacer height={responsive().isMobile ? 12 : 32} />
								<div class="row w-full justify-center">
									{props.belowChessboard}
								</div>
							</Show>
							<Show when={responsive().isMobile}>
								<Spacer height={12} />
							</Show>
						</div>
						{vertical() ? (
							<div
								class={clsx("transition-mt duration-250 ease-in-out")}
								style={s(
									c.grow,

									chessboardHeight()
										? // @ts-ignore
										  c.mt(!chessboardHidden() ? 0 : -chessboardHeight() + 100)
										: c.mt(0),
								)}
							>
								<SidebarContainer
									backSection={props.backSection}
									setAnimateSidebar={props.setAnimateSidebar}
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
								class={"max-w-[600px] xl:max-w-[650px] "}
								style={s(c.flexGrow(2), c.flexShrink, c.noBasis)}
							>
								<SidebarContainer
									backSection={props.backSection}
									setAnimateSidebar={props.setAnimateSidebar}
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
	const [mode] = useSidebarState(([s]) => [s.mode]);
	return (
		// todo: figure out why this is not working
		<FadeInOut
			open={() => !hidden()}
			style={s(c.row, c.alignCenter, c.constrainWidth)}
		>
			<Intersperse
				separator={() => {
					return (
						<div style={s(c.mx(responsive().switch(6, [BP.lg, 8])))}>
							<CMText style={s(c.fg(c.gray[40]))}>
								<i class="fa-light fa-angle-right" />
							</CMText>
						</div>
					);
				}}
				each={breadcrumbs}
			>
				{(breadcrumb) => (
					<Pressable
						style={s(breadcrumb().onPress ? c.clickable : c.unclickable)}
						onPress={() => {
							if (!breadcrumb().onPress) {
								return;
							}
							quick((s) => {
								trackEvent("breadcrumbs.clicked", {
									mode,
									breadcrumb: breadcrumb().text,
								});
								s.repertoireState.browsingState.moveSidebarState("left");
								breadcrumb().onPress?.();
							});
						}}
					>
						<div style={s()}>
							<CMText
								style={s(c.weightBold)}
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
