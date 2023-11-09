import { isEmpty, isNil } from "lodash-es";
import { JSXElement, Match, Show, Switch, createMemo } from "solid-js";
import { Spacer } from "~/components/Space";
import { useHovering } from "~/mocks";
import {
	getAppState,
	quick,
	useMode,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { pgnToLine } from "~/utils/repertoire";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { Intersperse } from "./Intersperse";
import { animateSidebar } from "./SidebarContainer";
import { useLineEcoCode } from "~/utils/eco_codes";

export interface SidebarAction {
	rightText?: string;
	onPress?: () => void;
	static?: boolean;
	class?: string;
	text: string | JSXElement;
	submitsForm?: string;
	right?: JSXElement | string;
	subtext?: string;
	style: "primary" | "focus" | "secondary" | "tertiary" | "wide";
	disabled?: boolean;
}

export const SidebarActionsLegacy = () => {
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const hideContinuePracticing = () =>
		getAppState().repertoireState.browsingState.hideContinuePracticing;
	let [
		hasPendingLineToAdd,
		isPastCoverageGoal,
		addedLineState,
		deleteLineState,
		currentLine,
		currentEpd,
		positionHistory,
		showPlansState,
		transposedState,
		numDue,
		view,
	] = useSidebarState(([s, bs, rs]) => [
		s.hasPendingLineToAdd,
		s.isPastCoverageGoal,
		s.addedLineState,
		s.deleteLineState,
		s.chessboard.getMoveLog(),
		s.chessboard.getCurrentEpd(),
		s.chessboard.get((s) => s.positionHistory),
		s.showPlansState,
		s.transposedState,
		rs.numMovesDueFromEpd?.[s.activeSide!]?.[s.chessboard.getCurrentEpd()],
		rs.ui.currentView(),
	]);
	const isQuizzing = () => {
		return !isEmpty(getAppState().repertoireState.reviewState.activeQueue);
	};

	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	positionHistory = positionHistory ?? [];
	const hasPlans = () => {
		const browsingState = getAppState().repertoireState.browsingState;
		const repertoireState = getAppState().repertoireState;
		return !isEmpty(
			repertoireState.positionReports[browsingState.currentSide][
				browsingState.chessboard.getCurrentEpd()
			]?.plans,
		);
	};
	const biggestGapAction = createMemo(() => useBiggestGapAction());
	const addBiggestMissAction = (buttons: SidebarAction[]) => {
		if (biggestGapAction()) {
			buttons.push(biggestGapAction()!);
			return;
		}
	};
	const buttonsSig = () => {
		const mode = () => getAppState().repertoireState.ui.mode;
		if (mode() === "review") {
			return [];
		}
		if (mode() === "side_overview") {
			return [];
		}
		if (mode() === "overview") {
			return [];
		}

		let buttons: SidebarAction[] = [];
		let showTogglePlansButton = true;
		if (onboarding().isOnboarding) {
			showTogglePlansButton = false;
		}

		if (transposedState().visible) {
			showTogglePlansButton = false;
		} else if (showPlansState().visible) {
			showTogglePlansButton = false;
			// This is taken care of by the delete line view, maybe bad though
		} else if (deleteLineState().visible) {
			showTogglePlansButton = false;
			// This is taken care of by the delete line view, maybe bad though
		} else if (addedLineState().visible) {
		} else if (!hasPendingLineToAdd()) {
			addBiggestMissAction(buttons);
		} else if (hasPendingLineToAdd() && !view()) {
			if (onboarding().isOnboarding && !isPastCoverageGoal()) {
				return [];
			}
			buttons.push({
				onPress: () => {
					isPastCoverageGoal()
						? trackEvent(`${mode()}.save_line`)
						: trackEvent(`${mode()}.save_line_premature`);
					quick((s) => {
						s.repertoireState.browsingState.requestToAddCurrentLine();
					});
				},
				text: isPastCoverageGoal()
					? "Save these moves to my repertoire"
					: "I'll finish this later, save my progress",
				style: isPastCoverageGoal() ? "focus" : "primary",
			});
		}
		if (showTogglePlansButton && hasPlans()) {
			buttons.push({
				onPress: () => {
					quick((s) => {
						const bs = s.repertoireState.browsingState;
						animateSidebar("right");
						bs.showPlansState.visible = true;
						bs.showPlansState.coverageReached = false;
						bs.chessboard.set((s) => {
							s.showPlans = true;
						});
					});
				},
				text: "How to play from here",
				style: "primary",
			});
		}
		if (isQuizzing() && !hideContinuePracticing()) {
			buttons.push({
				onPress: () => {
					quick((s) => {
						trackEvent(`${mode()}.resume_practice`);
						s.repertoireState.ui.popView();
						animateSidebar("right");
						s.repertoireState.reviewState.resumeReview();
					});
				},
				text: "Continue practice session",
				right: (
					<div class={clsx("flex row text-xs font-semibold text-tertiary")}>
						<i class={clsx("fa  fa-forward")} />
					</div>
				),
				style: "primary",
			});
		}
		if (mode() === "browse") {
			buttons = [];
			if (numDue() > 0) {
				buttons.push({
					onPress: () => {
						trackEvent(`${mode()}.practice_due`);
						quick((s) => {
							s.repertoireState.reviewState.startReview({
								side: activeSide()!,
								filter: "due",
								startLine: currentLine(),
								startPosition: currentEpd(),
							});
						});
					},
					text: `Practice ${numDue()} moves which are due for review`,
					style: "primary",
				});
			}
			buttons.push({
				onPress: () => {
					quick((s) => {
						trackEvent(`${mode()}.practice_all`);
						s.repertoireState.reviewState.startReview({
							side: activeSide()!,
							filter: "all",
							startLine: currentLine(),
							startPosition: currentEpd(),
						});
					});
				},
				text: "Practice ALL moves from here",
				style: "primary",
			});
		}
		console.log(`Mode is ${mode()}, buttons length: ${buttons.length}`);
		return buttons;
	};
	return (
		<div style={stylex(c.column, c.fullWidth)}>
			<Intersperse
				each={buttonsSig}
				separator={() => {
					return <Spacer height={10} />;
				}}
			>
				{(b, i) => <SidebarFullWidthButton action={b()} />}
			</Intersperse>
		</div>
	);
};
export const SidebarFullWidthButton = (props: {
	action: SidebarAction;
	first?: boolean;
}) => {
	const responsive = useResponsiveV2();
	const { hovering, hoveringProps } = useHovering();
	const styles = () => {
		let subtextColor = null;
		let textStyles = stylex();
		let py = 12;
		if (props.action.style === "focus") {
			subtextColor = c.gray[20];
		}
		if (props.action.style === "wide") {
			textStyles = stylex(textStyles, c.fontSize(18), c.weightBold);
			// subtextColor = c.gray[20];
			py = 20;
		}
		if (props.action.style === "tertiary") {
			subtextColor = c.gray[20];
		}
		if (props.action.style === "secondary") {
			subtextColor = c.gray[60];
		}
		if (props.action.style === "primary") {
			subtextColor = c.gray[70];
		}
		return {
			subtextColor,
			textStyles,
			py,
		};
	};
	return (
		<div
			onClick={() => {
				if (!props.action.disabled) {
					props.action.onPress?.();
				}
			}}
			{...(props.action.submitsForm
				? {
						type: "submit",
						form: props.action.submitsForm,
				  }
				: {})}
			{...hoveringProps}
			class={clsx(
				"cursor-pointer transition-colors",
				props.action.style !== "wide" && "min-h-sidebar-button",
				props.action.style === "secondary" &&
					clsx(
						"text-primary",
						!props.action.static && "&hover:bg-gray-18 &hover:text-primary",
					),
				props.action.style === "tertiary" &&
					"text-tertiary &hover:text-primary",
				props.action.style === "wide" &&
					"bg-sidebar_button_primary &hover:bg-sidebar_button_primary_hover",
				props.action.style === "focus" &&
					"bg-gray-82 &hover:bg-gray-86 text-gray-10",
				props.action.style === "primary" && " bg-sidebar_button_primary ",
				props.action.style === "primary" &&
					!props.action.disabled &&
					"&hover:bg-sidebar_button_primary_hover text-primary",
				props.action.disabled && "text-tertiary",
				(props.action.disabled || props.action.static) && " !cursor-default",
				props.action.class,
			)}
			style={stylex(
				c.fullWidth,
				c.row,
				c.justifyBetween,
				c.alignCenter,
				c.py(styles().py),
				c.px(c.getSidebarPadding(responsive())),
				props.action.style === "secondary" &&
					c.borderBottom(`1px solid ${c.colors.border}`),
				props.action.style === "secondary" &&
					props.first &&
					c.borderTop(`1px solid ${c.colors.border}`),
			)}
		>
			<div style={stylex(c.column, c.grow)}>
				<CMText
					style={stylex(
						props.action.style === "focus" ? c.weightBold : c.weightSemiBold,
						c.fontSize(14),
						styles().textStyles,
					)}
				>
					{props.action.text}
				</CMText>
				<Show when={props.action.subtext}>
					<>
						<Spacer height={4} />
						<CMText
							style={stylex(
								c.fg(styles().subtextColor),
								props.action.style === "focus"
									? c.weightBold
									: c.weightSemiBold,
								c.fontSize(14),
							)}
						>
							{props.action.subtext}
						</CMText>
					</>
				</Show>
			</div>
			<Spacer width={16} />
			<Show when={props.action.right}>
				<div style={stylex(c.row, c.center)}>
					{typeof props.action.right === "string" ? (
						<CMText
							style={stylex(
								props.action.style === "focus"
									? c.fg(c.colors.text.inverseSecondary)
									: c.fg(c.colors.text.secondary),
								props.action.style === "focus"
									? c.weightBold
									: c.weightSemiBold,
								props.action.style === "secondary" &&
									stylex(c.fg(c.colors.text.tertiary), c.weightBold),
								c.fontSize(12),
							)}
						>
							{props.action.right}
						</CMText>
					) : (
						<CMText
							style={stylex(c.fg(c.colors.text.tertiary), c.fontSize(14))}
						>
							{props.action.right}
						</CMText>
					)}
				</div>
			</Show>
		</div>
	);
};

export const SidebarActions = (props: {
	actions: SidebarAction[];
	header?: JSXElement;
}) => {
	return (
		<div style={stylex(c.column, c.fullWidth)}>
			{props.header}
			<Intersperse
				each={() => props.actions}
				separator={(action) => {
					return (
						<Switch>
							<Match when={action().style === "wide"}>
								<Spacer height={20} />
							</Match>
							<Match when={action().style === "focus"}>
								<Spacer height={12} />
							</Match>
							<Match when={action().style === "primary"}>
								<Spacer height={12} />
							</Match>
							<Match when={action().style === "secondary"}>
								<Spacer height={0} />
							</Match>
							<Match when={action().style === "tertiary"}>
								<Spacer height={0} />
							</Match>
						</Switch>
					);
				}}
			>
				{(a, i) => <SidebarFullWidthButton action={a()} first={i === 0} />}
			</Intersperse>
		</div>
	);
};

export const SeeMoreActions = (props: {
	onClick: () => void;
	text: string;
}) => {
	const responsive = useResponsiveV2();
	return (
		<div
			style={stylex(c.row, c.px(c.getSidebarPadding(responsive())))}
			class={clsx("pt-4")}
		>
			<div
				style={stylex(c.pb(2))}
				class="cursor-pointer"
				onClick={() => {
					props.onClick();
				}}
			>
				<CMText class="text-tertiary &hover:text-primary text-xs font-semibold transition-colors">
					{props.text}
				</CMText>
			</div>
		</div>
	);
};

export const SidebarSectionHeader = (props: {
	text: string;
	right?: JSXElement;
}) => {
	const responsive = useResponsiveV2();
	return (
		<div
			style={stylex(
				c.row,
				c.justifyBetween,
				c.alignCenter,
				c.px(c.getSidebarPadding(responsive())),
				c.pb(12),
				c.borderBottom(`1px solid ${c.colors.border}`),
			)}
		>
			<CMText style={stylex(c.fontSize(14), c.fg(c.colors.text.tertiary))}>
				{props.text}
			</CMText>
			{props.right}
		</div>
	);
};

export const useBiggestGapAction = (): SidebarAction | undefined => {
	let [addedLineState, currentEpd, nearestMiss, lineMiss, positionHistory] =
		useSidebarState(([s, bs]) => [
			s.addedLineState,
			s.chessboard.getCurrentEpd(),
			bs.getNearestMiss(),
			bs.getMissInThisLine(),
			s.chessboard.get((s) => s.positionHistory),
		]);
	const mode = useMode();
	positionHistory = positionHistory ?? [];
	const getBiggestGapAction = () => {
		let miss = null;
		if (addedLineState().visible) {
			miss = nearestMiss() ?? lineMiss();
		} else {
			miss = lineMiss();
		}
		if (isNil(miss)) {
			return;
		}
		const text = "Go to the next gap in your repertoire";
		const line = pgnToLine(miss.lines[0]);

		const isAtBiggestMiss = currentEpd() === miss.epd;
		if (miss && !isAtBiggestMiss) {
			const { name: ecoCodeName } = useLineEcoCode(line)() || {};
			return {
				onPress: () => {
					quick((s) => {
						trackEvent(`${mode()}.added_line_state.next_gap`);
						animateSidebar("right");
						s.repertoireState.browsingState.dismissTransientSidebarState();
						s.repertoireState.browsingState.chessboard.playLine(line, {
							animated: true,
						});
					});
				},
				text: text,
				right: ecoCodeName,
				style: "secondary",
			};
		}
	};
	// @ts-ignore
	return getBiggestGapAction!();
};
