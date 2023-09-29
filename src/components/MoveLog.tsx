import { createElementBounds } from "@solid-primitives/bounds";
import { cloneDeep, find, forEach } from "lodash-es";
import {
	Accessor,
	For,
	JSXElement,
	Show,
	createEffect,
	createMemo,
	createRenderEffect,
	createSignal,
} from "solid-js";
import { getAppState, quick, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { c, s } from "~/utils/styles";
import {
	BOARD_THEMES_BY_ID,
	BoardTheme,
	COMBINED_THEMES_BY_ID,
	CombinedTheme,
	combinedThemes,
} from "~/utils/theming";
import { AnalyzeOnLichessButton } from "./AnalyzeOnLichessButton";
import { debugElementBounds } from "~/utils/debug_element_bounds";

export const MoveLog = (props: {hideLeftDivider?: boolean}) => {
	const [mode] = useSidebarState(([s]) => [s.mode]);
	const currentLine = () => {
		return (
			getAppState()
				.repertoireState.getChessboard()
				?.get((s) => s.moveHistory) ?? []
		);
	};
	const forwardLine = () => {
		return (
			getAppState()
				.repertoireState.getChessboard()
				?.get((s) => s.forwardMoveHistory) ?? []
		);
	};
	const userState = getAppState().userState;
	const user = () => userState.user;
	const combinedTheme: Accessor<CombinedTheme> = createMemo(
		() =>
			find(combinedThemes, (theme) => theme.boardTheme === user()?.theme) ||
			COMBINED_THEMES_BY_ID.default,
	);
	const theme: Accessor<BoardTheme> = () =>
		BOARD_THEMES_BY_ID[combinedTheme().boardTheme];
	const currentLineElements = () => {
		const elems: JSXElement[] = [];
		const moves: string[] = [];
		forEach([...currentLine(), ...forwardLine()], (e, i) => {
			moves.push(e.san);
			const theseMoves = cloneDeep(moves);
			const last = i === currentLine().length - 1;
			if (i % 2 === 0) {
				elems.push(
					<p
						class={
							"text-gray-40 pl-1 lg:pl-1  font-semibold leading-5 tracking-wider"
						}
					>
						{Math.round(i / 2) + 1}.
					</p>,
				);
			}
			elems.push(
				<p
					class={clsx(
						"&hover:text-primary  cursor-pointer whitespace-nowrap rounded-sm px-0.5 lg:px-1 font-bold  leading-5 tracking-wider transition-all ml-0.5",
						last ? "text-primary" : "text-tertiary",
					)}
					style={s(last && s(c.bg(theme().highlightLastMove)))}
					onClick={() => {
						if (mode() !== "review") {
							quick((s) => {
								if (theseMoves.length < currentLine().length) {
									s.repertoireState
										.getChessboard()
										?.backN(currentLine().length - theseMoves.length);
								} else {
									s.repertoireState.browsingState.chessboard.forwardN(
										theseMoves.length - currentLine().length,
									);
								}
							});
						}
					}}
				>
					{e.san}
				</p>,
			);
		});
		return elems;
	};
	const maskImage =
		"linear-gradient(to left, black calc(100% - 48px), transparent 100%)";
	const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
	const [movesRef, setMovesRef] = createSignal<HTMLDivElement>();
	createRenderEffect(() => {
		currentLine().length;
		// scroll to right of container ref, smoothly
		requestAnimationFrame(() => {
			if (containerRef()) {
				containerRef()!.scrollTo({
					left: containerRef()!.scrollWidth,
					behavior: "smooth",
				});
			}
		});
	});
	const containerLayout = createElementBounds(containerRef, {
		trackMutation: false,
	});
	const movesLayout = createElementBounds(movesRef, { trackMutation: false });
	const overflowing = () => {
		if (movesLayout && containerLayout) {
			return movesLayout.width! > containerLayout.width!;
		}
		return false;
	};
	return (
		<div class={"row  shrink-1  min-w-0 items-center text-xs lg:text-sm grow justify-end"}>
      <Show when={!props.hideLeftDivider}>
        <Divider overflowing={overflowing()} class="ml-[0.7rem] mr-[0.65rem]"/>
      </Show>
      <div class="grow"/>
			<div class="col gap-2 items-end min-w-0 shrink justify-end">
				<div
					class="row align-center no-scrollbar h-full overflow-x-scroll max-w-full"
					ref={setContainerRef}
					style={s(
						overflowing() && {
							"mask-image": maskImage,
							"-webkit-mask-image": maskImage,
						},
					)}
				>
					<div class={clsx("row items-center")} ref={setMovesRef}>
						<For each={currentLineElements()}>{(e) => e}</For>
					</div>
				</div>
			</div>
			<div class=" row justify-end shrink-0 <md:hidden self-stretch items-center">
        <Divider overflowing={true} class=" <md:hidden ml-[0.75rem] mr[0.6rem]" />
				<AnalyzeOnLichessButton short />
			</div>
		</div>
	);
};

const Divider = (props: { class?: string; overflowing?: boolean }) => {
	return (
		<div
			class={clsx(
				"self-stretch w-px shrink-0",
				props.overflowing ? "bg-gray-16" : "bg-transparent",
				props.class,
			)}
		/>
	);
};
