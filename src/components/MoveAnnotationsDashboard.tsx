import { Chess } from "@lubert/chess.ts";
import { A } from "@solidjs/router";
import dayjs from "dayjs";
import { isEmpty, isNil, take } from "lodash-es";
import { For, Show, createEffect, createSignal } from "solid-js";
import { Button } from "~/components/Button";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { AdminMoveAnnotation } from "~/utils/admin_state";
import { quick, useAdminState } from "~/utils/app_state";
import { createStaticChessState } from "~/utils/chessboard_interface";
import { c, stylex } from "~/utils/styles";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { CMText } from "./CMText";
import { LazyLoad } from "./LazyLoad";
import { SelectOneOf } from "./SelectOneOf";

export const MoveAnnotationsDashboard = () => {
	const [dashboard] = useAdminState((s) => [s.moveAnnotationsDashboard]);
	createEffect(() => {
		console.log("dashboard", dashboard());
	});
	const [activeTab, setActiveTab] = createSignal("Needed");
	createEffect(() => {
		quick((s) => s.adminState.fetchMoveAnnotationDashboard());
	});
	return (
		<AdminPageLayout>
			{(() => {
				if (isNil(dashboard())) {
					return <CMText style={stylex()}>Loading...</CMText>;
				}
				if (isEmpty(dashboard())) {
					return (
						<CMText style={stylex()}>
							Looks like there's nothing left to review
						</CMText>
					);
				}
				return (
					<div style={stylex(c.column)}>
						<CMText style={stylex(c.weightSemiBold, c.selfEnd)}>
							<A
								href="/admin/move-annotations/community"
								class="row place-items-center"
							>
								Go to community review queue
								<Spacer width={8} />
								<i class="fa fa-arrow-right" style={stylex()} />
							</A>
						</CMText>
						<Spacer height={32} />
						<SelectOneOf
							tabStyle
							containerStyles={stylex(c.fullWidth, c.justifyBetween)}
							choices={["Needed", "Completed"]}
							activeChoice={activeTab()}
							horizontal
							onSelect={(tab) => {}}
							renderChoice={(tab, active) => {
								return (
									<div
										onClick={() => {
											quick((s) => {
												setActiveTab(tab);
											});
										}}
										style={stylex(
											c.column,
											c.grow,
											c.alignCenter,
											c.borderBottom(
												`2px solid ${active ? c.gray[90] : c.gray[20]}`,
											),
											c.zIndex(5),
											c.pb(8),
										)}
									>
										<CMText
											style={stylex(
												c.fg(
													active
														? c.colors.text.primary
														: c.colors.text.secondary,
												),
												c.fontSize(16),
												c.weightBold,
											)}
										>
											{tab === "Needed" ? "Most needed" : "Completed"}
										</CMText>
									</div>
								);
							}}
						/>
						<div style={stylex(c.gridColumn({ gap: 24 }))}>
							<Spacer height={24} />
							<For
								each={
									activeTab() === "Needed"
										? take(dashboard()!.needed, 100)
										: take(dashboard()!.completed, 100)
								}
							>
								{(ann) => (
									<MoveAnnotationRow
										completed={activeTab() === "Completed"}
										// @ts-ignore
										annotation={ann}
									/>
								)}
							</For>
						</div>
					</div>
				);
			})()}
		</AdminPageLayout>
	);
};

export const MoveAnnotationRow = (props: {
	annotation: AdminMoveAnnotation;
	completed: boolean;
}) => {
	const ann = () => props.annotation;
	const fen = `${ann().previousEpd} 0 1`;
	const position = new Chess(fen);
	const [annotation, setAnnotation] = createSignal(
		ann().annotation?.text ?? "",
	);
	const [saved, setSaved] = createSignal(false);
	const [loading, setLoading] = createSignal(false);
	const chessState = createStaticChessState({
		epd: props.annotation.previousEpd,
		side: position.turn() === "b" ? "black" : "white",
		nextMove: props.annotation.sanPlus,
	});
	return (
		<div style={stylex(c.bg(c.gray[30]), c.br(2), c.px(12), c.py(12), c.column)}>
			<div style={stylex(c.row)}>
				<div style={stylex(c.size(180))}>
					<LazyLoad>
						<ChessboardView chessboardInterface={chessState} />
					</LazyLoad>
				</div>

				<Spacer width={24} />
				<div style={stylex(c.width(400))}>
					<AnnotationEditor annotation={annotation} onUpdate={setAnnotation} />
				</div>
			</div>
			<Show when={props.completed}>
				<>
					<Spacer height={8} />
					<CMText style={stylex()}>
						Reviewer: {ann().reviewerEmail ?? "me@mbuffett.com"}
					</CMText>
				</>
			</Show>
			<Spacer height={8} />
			<div style={stylex(c.row, c.justifyEnd)}>
				<div>
					<p style={stylex()}>{ann().games.toLocaleString()} games</p>
					{ann().createdAt && (
						<p style={stylex()}>
							Created at: {dayjs(ann().createdAt).format(
								"YYYY-MM-DD HH:mm",
							)}{" "}
						</p>
					)}
				</div>
				<Spacer grow />
				<Button
					style={stylex(c.buttons.basic, c.selfEnd)}
					onPress={() => {
						quick((s) =>
							s.repertoireState.analyzeMoveOnLichess(
								fen,
								ann().sanPlus,
								position.turn() === "b" ? "black" : "white",
							),
						);
					}}
				>
					Analyze on lichess
				</Button>
				<Spacer width={12} />
				<Button
					style={stylex(c.buttons.primary, c.selfEnd)}
					onPress={() => {
						setLoading(true);
						quick((s) =>
							s.adminState
								.acceptMoveAnnotation(
									ann().previousEpd,
									ann().sanPlus,
									annotation(),
								)
								.then(() => {
									setSaved(true);
									setLoading(false);
								}),
						);
					}}
				>
					<CMText style={stylex(c.buttons.primary.textStyles)}>
						<Show when={saved}>
							<i class="fa fa-check" style={stylex(c.fg(c.gray[90]), c.mr(4))} />
						</Show>
						{loading() ? "Loading.." : saved() ? "Saved" : "Save"}
					</CMText>
				</Button>
			</div>
		</div>
	);
};
