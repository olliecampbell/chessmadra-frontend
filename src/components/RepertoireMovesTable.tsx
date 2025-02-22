import { destructure } from "@solid-primitives/destructure";
import {
	cloneDeep,
	filter,
	includes,
	isEmpty,
	isNil,
	last,
	map,
	max,
	noop,
	reverse,
	some,
} from "lodash-es";
import {
	Accessor,
	For,
	JSXElement,
	Show,
	createEffect,
	createMemo,
	createSignal,
	onMount,
} from "solid-js";
import { Spacer } from "~/components/Space";
import { useHovering } from "~/mocks";
import {
	getAppState,
	useBrowsingState,
	useMode,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import { useIsMobileV2 } from "~/utils/isMobile";
import { MoveTag, SuggestedMove } from "~/utils/models";
import { MoveRating, getMoveRatingIcon } from "~/utils/move_inaccuracy";
import { RepertoireMiss, RepertoireMove, Side } from "~/utils/repertoire";
import { c, stylex } from "~/utils/styles";
import { TableResponseScoreSource } from "~/utils/table_scoring";
import { renderThreshold } from "~/utils/threshold";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { TableMeta, useSections } from "~/utils/useSections";
import { AnnotationEditor } from "./AnnotationEditor";
import { CMText } from "./CMText";
import { Intersperse } from "./Intersperse";
import { Pressable } from "./Pressable";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { initTooltip } from "./Tooltip";
import { createPrevious } from "~/utils/signals/createPrevious";
import { animateSidebar } from "./SidebarContainer";

const DELETE_WIDTH = 30;

export interface TableResponse {
	reviewInfo?: { earliestDue: string; due: number };
	transposes?: boolean;
	lowConfidence?: boolean;
	biggestMiss?: RepertoireMiss;
	coverage?: number;
	moveRating?: MoveRating;
	repertoireMove?: RepertoireMove;
	suggestedMove?: Readonly<SuggestedMove>;
	score?: number;
	scoreTable?: ScoreTable;
	side: Side;
	tags: MoveTag[];
}

export interface ScoreTable {
	factors: ScoreFactor[];
	notes: string[];
}

export interface ScoreFactor {
	weight?: number;
	max?: number;
	value: number;
	source: TableResponseScoreSource;
	total?: number;
}

export const RepertoireMovesTable = (props: {
	header: Accessor<string | undefined | null>;
	body?: string;
	activeSide: Side;
	showOtherMoves?: Accessor<boolean>;
	usePeerRates: Accessor<boolean>;
	side: Side;
	responses: Accessor<TableResponse[]>;
}) => {
	const responsive = useResponsiveV2();
	const isMobile = useIsMobileV2();
	const mode = useMode();
	const [expandedLength, setExpandedLength] = createSignal(0);
	const [editingAnnotations, setEditingAnnotations] = createSignal(false);
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const { trimmedResponses, sections, anyMine, truncated, mine, myTurn } =
		destructure(() => {
			const anyMine = some(props.responses(), (m) => m.repertoireMove?.mine);
			const mine = filter(props.responses(), (m) => m.repertoireMove?.mine);
			const anyNeeded = some(props.responses(), (m) => m.suggestedMove?.needed);
			const myTurn = props.side === props.activeSide;
			const sections = useSections({
				myTurn,
				usePeerRates: props.usePeerRates(),
				isMobile: isMobile(),
			});
			const MIN_TRUNCATED = 1;
			const MAX_ONBOARDING_OTHER_SIDE = 3;
			const MAX_ONBOARDING_MY_SIDE = 6;
			const trimmedResponses = filter(props.responses(), (r, i) => {
				if (mode() === "browse") {
					return r.repertoireMove;
				}
				if (
					onboarding().isOnboarding &&
					((myTurn && i >= MAX_ONBOARDING_MY_SIDE) ||
						(!myTurn && i >= MAX_ONBOARDING_OTHER_SIDE))
				) {
					return false;
				}
				if (i < expandedLength()) {
					return true;
				}
				if (r.repertoireMove) {
					return true;
				}
				if (anyNeeded && !r.suggestedMove?.needed) {
					return false;
				}
				if (anyMine) {
					return false;
				}
				if (r.suggestedMove?.needed && !myTurn) {
					return true;
				}
				return (
					i < MIN_TRUNCATED ||
					r.repertoireMove ||
					(myTurn && r.score && r.score > 0) ||
					moveHasTag(r, MoveTag.RareDangerous) ||
					(myTurn && moveHasTag(r, MoveTag.Transposes))
				);
			}) as TableResponse[];
			const numTruncated = props.responses().length - trimmedResponses.length;
			const truncated = numTruncated > 0;
			return {
				trimmedResponses,
				sections,
				mine,
				myTurn,
				anyMine,
				truncated,
			};
		});
	const widths: Record<string, number | null> = {};
	createEffect(() => {
		console.log("trimmedResponses", trimmedResponses());
	});

	const [currentLine] = useBrowsingState(([s, rs]) => [
		s.chessboard.get((v) => v).moveLog,
	]);
	const previousLineLength = createPrevious(() => currentLine().length);
	createEffect(() => {
		if (previousLineLength() !== currentLine().length) {
			setExpandedLength(0);
		}
	});
	const moveNumber = () => Math.floor(currentLine().length / 2) + 1;
	const firstWhiteMove = () =>
		moveNumber() === 1 && props.side === "white" && myTurn() && !anyMine();
	const [moveMaxWidth, setMoveMaxWidth] = createSignal(40);
	const [currentEcoCode] = useSidebarState(([s, rs]) => [s.lastEcoCode]);
	const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
	// @ts-ignore
	const onMoveRender = (sanPlus, e) => {
		if (isNil(e)) {
			// TODO: better deletion, decrease widths
			widths[sanPlus] = null;
			return;
		}
		requestAnimationFrame(() => {
			const width = e.getBoundingClientRect().width;
			widths[sanPlus] = width;
			if (width > moveMaxWidth()) {
				setMoveMaxWidth(width);
			}
		});
	};
	// @ts-ignore
	const tableMeta: Accessor<TableMeta> = () => {
		return {
			highestIncidence: max(
				map(props.responses(), (r) => r.suggestedMove?.incidence ?? 1.0),
			),
		};
	};
	let includeOpeningName = false;
	const openingNames = createMemo(() =>
		reverse(
			map(reverse(cloneDeep(trimmedResponses())), (tr) => {
				const newOpeningName = null;
				const [currentOpeningName, currentVariations] = currentEcoCode()
					? // @ts-ignore
					  getAppropriateEcoName(currentEcoCode()?.fullName)
					: [];
				// @ts-ignore
				const nextEcoCode = ecoCodeLookup()[tr.suggestedMove?.epdAfter];
				if (nextEcoCode) {
					const [name, variations] = getAppropriateEcoName(
						nextEcoCode.fullName,
					);
					if (name !== currentOpeningName) {
						includeOpeningName = true;
						return name;
					}
					const lastVariation = last(variations);

					if (
						name === currentOpeningName &&
						lastVariation !== last(currentVariations)
					) {
						includeOpeningName = true;
						return last(variations);
					}
					if (includeOpeningName) {
						return last(variations);
					}
				}
			}),
		),
	);
	return (
		<div style={stylex(c.column)}>
			<Show when={props.header()}>
				<>
					<div class="padding-sidebar">
						<SidebarHeader>{props.header()}</SidebarHeader>
					</div>
					<Spacer height={responsive().switch(20, [BP.md, 24])} />
				</>
			</Show>
			<Show when={props.body}>
				<>
					<p class="body-text padding-sidebar">{props.body}</p>
					<Spacer height={24} />
				</>
			</Show>
			<div style={stylex(c.height(16))}>
				<Show when={!editingAnnotations()}>
					<TableHeader anyMine={anyMine()} sections={sections} />
				</Show>
			</div>
			<Spacer height={responsive().switch(6, [BP.md, 12])} />
			<div
				style={stylex(
					c.column,
					!editingAnnotations() &&
						stylex(
							c.borderTop(`1px solid ${c.colors.sidebarBorder}`),
							c.borderBottom(`1px solid ${c.colors.sidebarBorder}`),
						),
				)}
			>
				<Intersperse
					each={trimmedResponses}
					separator={(i) => (
						<div
							style={stylex(
								c.height(editingAnnotations() ? 12 : 1),
								!editingAnnotations() && c.bg(c.gray[30]),
							)}
						/>
					)}
				>
					{(tableResponse, i) => {
						const openingName = () => openingNames()[i];
						return (
							<Response
								openingName={openingName()}
								tableMeta={tableMeta()}
								moveNumber={moveNumber()}
								myTurn={myTurn()}
								anyMine={anyMine()}
								sections={sections()}
								editing={editingAnnotations()}
								tableResponse={tableResponse()}
								moveMinWidth={moveMaxWidth()}
								// @ts-ignore
								moveRef={(e) => {
									onMoveRender(
										tableResponse().suggestedMove?.sanPlus ||
											tableResponse().repertoireMove?.sanPlus,
										e,
									);
								}}
							/>
						);
					}}
				</Intersperse>
			</div>
			<div
				style={stylex(c.row, c.px(c.getSidebarPadding(responsive())))}
				class={clsx("pt-4")}
			>
				<Show
					when={
						truncated() &&
						mode() === "build" &&
						!(onboarding().isOnboarding && !myTurn())
					}
				>
					<Pressable
						onPress={() => {
							setExpandedLength(trimmedResponses().length + 5);
							trackEvent("browsing.moves_table.show_more");
						}}
						class={clsx("pb-1")}
					>
						<CMText
							class="text-tertiary &hover:text-primary transition-colors"
							style={stylex(c.fontSize(12), c.weightSemiBold)}
						>
							{firstWhiteMove() ? "Something else..." : "Show more moves"}
						</CMText>
					</Pressable>
					<Spacer width={16} />
				</Show>
				{moveNumber() !== 1 &&
					mode() === "build" &&
					!onboarding().isOnboarding && (
						<>
							<Pressable
								class={clsx("pb-1")}
								onPress={() => {
									if (!editingAnnotations()) {
										trackEvent(`${mode()}.moves_table.edit_annotations`);
									}
									setEditingAnnotations(!editingAnnotations());
								}}
							>
								<CMText
									style={stylex(c.fontSize(12), c.weightSemiBold)}
									class="text-tertiary &hover:text-primary transition-colors"
								>
									{editingAnnotations()
										? "Stop editing annotations"
										: "Edit annotations"}
								</CMText>
							</Pressable>
							<Spacer width={16} />
						</>
					)}
				<Show when={anyMine() && mode() === "build"}>
					<Pressable
						class={clsx("pb-1")}
						onPress={() => {
							trackEvent(`${mode()}.moves_table.delete_move`);
							quick((s) => {
								animateSidebar("right");
								s.repertoireState.browsingState.deleteLineState.visible = true;
							});
						}}
					>
						<CMText
							style={stylex(c.fontSize(12), c.weightSemiBold)}
							class="text-tertiary &hover:text-primary transition-colors"
						>
							{`Remove ${mine().length > 1 ? "a" : "this"} move`}
						</CMText>
					</Pressable>
					<Spacer width={12} />
				</Show>
			</div>
		</div>
	);
};

const Response = (props: {
	tableResponse: TableResponse;
	anyMine: boolean;
	sections: any[];
	moveNumber: number;
	myTurn: boolean;
	moveMinWidth: number;
	moveRef: any;
	openingName: string | undefined;
	editing: boolean;
	tableMeta: TableMeta;
}) => {
	const [currentEpd, activeSide] = useSidebarState(([s]) => [
		s.chessboard.getCurrentEpd(),
		s.activeSide,
	]);
	const [positionReport] = useBrowsingState(([s, rs]) => [
		rs.positionReports?.[activeSide()!]?.[currentEpd()],
	]);
	const [moveWidthRef, setMoveWidthRef] = createSignal(
		null as HTMLElement | null,
	);
	onMount(() => {
		if (moveWidthRef) {
			props.moveRef(moveWidthRef());
		}
	});

	const [numMovesDueFromHere, earliestDueDate] = useBrowsingState(([s, rs]) => {
		const epdAfter = props.tableResponse.repertoireMove?.epdAfter;
		if (!epdAfter) {
			return [0, 0];
		}
		return [
			rs.numMovesDueFromEpd[activeSide()!][epdAfter],
			rs.earliestReviewDueFromEpd[activeSide()!][epdAfter],
		];
	});
	const [currentLine, currentSide] = useSidebarState(([s, rs]) => [
		s.chessboard.get((s) => s.moveLog),
		s.currentSide,
	]);
	const isMobile = useIsMobileV2();
	const moveNumber = () => Math.floor(currentLine().length / 2) + 1;
	const sanPlus = () =>
		props.tableResponse.suggestedMove?.sanPlus ??
		props.tableResponse?.repertoireMove?.sanPlus;
	const mine = () => props.tableResponse.repertoireMove?.mine;
	const moveRating = () => props.tableResponse.moveRating;
	const hideAnnotations = () => props.moveNumber === 1 && props.openingName;

	const userState = getAppState().userState;
	const user = () => userState.user;
	const responsive = useResponsiveV2();
	const { hoveringProps: responseHoverProps, hoveringRef } = useHovering(
		() => {
			getAppState().repertoireState.browsingState.chessboard?.previewMove(
				// @ts-ignore
				sanPlus(),
			);
		},
		() => {
			getAppState().repertoireState.browsingState.chessboard?.previewMove(null);
		},
	);
	const mode = useMode();
	const annotation = createMemo(() => {
		if (hideAnnotations()) {
			return null;
		}
		// @ts-ignore
		return renderAnnotation(props.tableResponse.suggestedMove?.annotation);
	});
	const tags = () => {
		const tags = [];
		if (moveHasTag(props.tableResponse, MoveTag.BestMove)) {
			tags.push(
				<MoveTagView
					tip={
						<p>
							This is the best move according to masters, the computer, and
							results at your level
						</p>
					}
					text="Clear best move"
					icon="fa-duotone fa-trophy"
					style={stylex(c.fg(c.yellow[60]), c.fontSize(14))}
				/>,
			);
		}
		if (moveHasTag(props.tableResponse, MoveTag.Transposes)) {
			tags.push(
				<MoveTagView
					tip={
						<p>
							This move is an alternative way to reach an existing position in
							your repertoire
						</p>
					}
					text="Transposes to your repertoire"
					icon="fa-solid fa-merge"
					style={stylex(c.fg(c.colors.success), c.fontSize(14), c.rotate(-90))}
				/>,
			);
		}
		if (moveHasTag(props.tableResponse, MoveTag.TheoryHeavy)) {
			tags.push(
				<MoveTagView
					tip={
						<p>
							This opening requires a lot of memorization so is not recommended
							for beginners
						</p>
					}
					text="Warning: heavy theory"
					icon="fa-solid fa-triangle-exclamation"
					style={stylex(c.fg(c.red[60]), c.fontSize(14))}
				/>,
			);
		}
		if (moveHasTag(props.tableResponse, MoveTag.RareDangerous)) {
			tags.push(
				<MoveTagView
					tip={
						<p>
							This move is seen in less than{" "}
							<b>{renderThreshold(userState.getCurrentThreshold())} games </b>
							but the high win-rate for {currentSide()} means you should still
							prepare for it
						</p>
					}
					text="Rare but dangerous"
					icon="fa fa-radiation"
					style={stylex(c.fg(c.red[65]), c.fontSize(18))}
				/>,
			);
		}
		if (moveHasTag(props.tableResponse, MoveTag.CommonMistake)) {
			tags.push(
				<MoveTagView
					tip={
						<p>
							This is a bad move that's common at your level, so you should be
							prepared to punish it
						</p>
					}
					text="Common mistake"
					icon="fa fa-person-falling"
					style={stylex(c.fg(c.gray[80]), c.fontSize(14))}
				/>,
			);
		}
		return tags;
	};

	const hasInlineAnnotationOrOpeningName = () =>
		props.openingName || (!isMobile() && annotation());

	const tagsRow = () =>
		!isEmpty(tags()) && (
			<div
				style={stylex(c.grow, c.row, c.flexWrap, c.justifyStart, c.gap(4))}
				class="gap-4"
			>
				<For each={tags()}>
					{(tag, i) => {
						return tag;
					}}
				</For>
			</div>
		);
	return (
		<>
			<Show when={props.editing}>
				<div style={stylex(c.row, c.alignCenter)}>
					<Pressable
						onPress={noop}
						class={clsx("bg-gray-12 row h-[128px] grow rounded-sm")}
						style={stylex(
							c.lightCardShadow,
							c.mx(c.getSidebarPadding(responsive())),
						)}
					>
						<div
							style={stylex(
								c.width(120),
								c.selfStretch,
								c.row,
								c.px(12),
								c.py(12),
							)}
						>
							<CMText
								style={stylex(
									c.fg(c.colors.text.secondary),
									c.weightSemiBold,
									c.fontSize(18),
								)}
							>
								{moveNumber}
								{currentSide() === "black" ? "... " : "."}
							</CMText>
							<Spacer width={2} />
							<CMText
								key={sanPlus}
								style={stylex(
									c.fg(c.colors.text.secondary),
									c.fontSize(18),
									c.weightSemiBold,
									c.keyedProp("letter-spacing")("0.04rem"),
								)}
							>
								{sanPlus}
							</CMText>
						</div>
						<AnnotationEditor
							annotation={() =>
								props.tableResponse.suggestedMove?.annotation ?? ""
							}
							onUpdate={(annotation) => {
								quick((s) => {
									s.repertoireState.uploadMoveAnnotation({
										epd: currentEpd(),
										// @ts-ignore
										san: sanPlus(),
										text: annotation,
									});
								});
							}}
						/>
					</Pressable>
				</div>
			</Show>
			<Show when={!props.editing}>
				<div
					style={stylex(c.row, c.alignStart)}
					{...responseHoverProps}
					ref={(ref) => {
						hoveringRef(ref);
					}}
				>
					<Pressable
						onPress={() => {
							quick((s) => {
								trackEvent(`${mode()}.moves_table.select_move`);
								animateSidebar("right");
								if (props.tableResponse.transposes) {
									s.repertoireState.browsingState.chessboard.makeMove(
										// @ts-ignore
										sanPlus(),
										{ animate: true },
									);
									s.repertoireState.browsingState.transposedState.visible = true;
									s.repertoireState.browsingState.chessboard.set((s) => {
										s.showPlans = true;
									});
								} else {
									s.repertoireState.browsingState.chessboard.makeMove(
										// @ts-ignore
										sanPlus(),
										{ animate: true },
									);
								}
							});
						}}
						class={clsx(
							"&hover:bg-gray-18 flexible row cursor-pointer rounded-sm py-3 transition-colors",
						)}
						style={stylex(c.px(c.getSidebarPadding(responsive())))}
					>
						<div style={stylex(c.column, c.grow, c.constrainWidth)}>
							<div style={stylex(c.row, c.fullWidth, c.alignStart)}>
								<div style={stylex(c.row, c.alignCenter)}>
									<div style={stylex(c.minWidth(props.moveMinWidth))}>
										<div
											style={stylex(c.row, c.alignCenter)}
											ref={(e) => {
												setMoveWidthRef(e);
											}}
										>
											<CMText
												class={
													"text-gray-60 font-semibold leading-5 tracking-wider"
												}
											>
												{moveNumber}
												{currentSide() === "black" ? "…" : "."}
											</CMText>
											<Spacer width={4} />
											<p
												class={
													"text-gray-85 font-bold leading-5 tracking-wider"
												}
											>
												{sanPlus()}
											</p>
											{!isNil(moveRating()) && (
												<>
													<Spacer width={4} />
													{() => getMoveRatingIcon(moveRating()!)}
												</>
											)}
										</div>
									</div>
								</div>
								<Spacer width={12} />

								<div
									class={clsx("pr-4")}
									style={stylex(
										c.width(0),
										c.grow,
										c.column,

										!hasInlineAnnotationOrOpeningName() && c.selfCenter,
									)}
								>
									<CMText
										style={stylex(
											c.fg(c.gray[80]),
											c.fontSize(12),
											c.lineHeight("1.3rem"),
										)}
									>
										<Show when={props.openingName}>
											<b>{props.openingName}</b>
											<Show when={!isMobile() && annotation()}>
												<>
													. <Spacer width={2} />
												</>
											</Show>
										</Show>
										<Show when={!isMobile()}>
											<p>{annotation()}</p>
										</Show>
									</CMText>
									{tagsRow() && (
										<>
											{hasInlineAnnotationOrOpeningName() && (
												<Spacer height={12} />
											)}
											{tagsRow()}
										</>
									)}
								</div>

								<div style={stylex(c.row, c.alignCenter)} class="space-x-4">
									<For each={props.sections}>
										{(section) => {
											return (
												<div
													style={stylex(
														c.width(section.width),
														c.center,
														section.alignLeft && c.justifyStart,
														section.alignRight && c.justifyEnd,
														c.row,
													)}
													id={`section-${section.header}`}
												>
													{section.content({
														numMovesDueFromHere,
														earliestDueDate,
														suggestedMove: props.tableResponse.suggestedMove,
														positionReport: positionReport(),
														tableResponse: props.tableResponse,
														side: currentSide(),
														tableMeta: props.tableMeta,
													})}
												</div>
											);
										}}
									</For>
								</div>
							</div>
							<div style={stylex(c.column, c.maxWidth(400))}>
								<Show when={isMobile() && annotation()}>
									<CMText style={stylex(c.grow, c.pt(8), c.minWidth(0))}>
										<CMText style={stylex(c.fg(c.gray[70]), c.fontSize(12))}>
											{annotation()}
										</CMText>
									</CMText>
								</Show>
							</div>
						</div>
					</Pressable>
				</div>
			</Show>
		</>
	);
};

const TableHeader = (props: {
	sections: Accessor<any[]>;
	anyMine: boolean;
}) => {
	const responsive = useResponsiveV2();
	return (
		<div
			style={stylex(
				c.row,
				c.fullWidth,
				c.pl(14),
				c.px(c.getSidebarPadding(responsive())),
			)}
		>
			<Spacer width={12} grow />
			<div style={stylex(c.row, c.alignCenter)} class="space-x-4">
				<For each={props.sections()}>
					{(section, i) => {
						return (
							<div
								style={stylex(
									c.width(section.width),
									section.alignRight
										? c.justifyEnd
										: section.alignLeft
										? c.justifyStart
										: c.center,
									c.row,
									c.textAlign("center"),
								)}
							>
								<CMText
									style={stylex(
										c.fg(c.colors.text.tertiary),
										c.fontSize(12),
										c.whitespace("nowrap"),
									)}
								>
									{section.header}
								</CMText>
							</div>
						);
					}}
				</For>
			</div>
			{props.anyMine && false && <Spacer width={DELETE_WIDTH} />}
		</div>
	);
};

function renderAnnotation(_annotation: string) {
	const annotation = _annotation?.trim();
	const stops = ["!", "?", "."];
	if (annotation) {
		if (some(stops, (stop) => annotation.endsWith(stop))) {
			return annotation;
		} else {
			return `${annotation}.`;
		}
	}
}

const MoveTagView = (props: {
	icon: string;
	text: string;
	style: any;
	tip: JSXElement;
}) => {
	return (
		<p
			style={stylex(
				c.fg(c.gray[80]),
				c.fontSize(10),
				c.weightBold,
				c.row,
				c.alignCenter,
			)}
			ref={(ref) => {
				initTooltip({
					ref,
					content: () => {
						return props.tip;
					},
					maxWidth: 200,
				});
			}}
		>
			<i class={props.icon} style={stylex(props.style)} />
			<Spacer width={8} />
			{props.text}
		</p>
	);
};

const moveHasTag = (m: TableResponse, tag: MoveTag): boolean => {
	return includes(m.tags, tag);
};
