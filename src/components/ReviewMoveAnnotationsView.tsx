import { Chess } from "@lubert/chess.ts";
import { capitalize, filter, isEmpty, isNil, noop } from "lodash-es";
import {
	For,
	Match,
	Show,
	Switch,
	createEffect,
	createMemo,
	createSignal,
	onMount,
} from "solid-js";
import { Button } from "~/components/Button";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import {
	getAdminState,
	quick,
	useAdminState,
	useUserState,
} from "~/utils/app_state";
import { createStaticChessState } from "~/utils/chessboard_interface";
import { useIsMobileV2 } from "~/utils/isMobile";
import { MoveAnnotationReview } from "~/utils/models";
import { c, stylex } from "~/utils/styles";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { CMText } from "./CMText";
import { LazyLoad } from "./LazyLoad";
import { Dropdown } from "./SidebarOnboarding";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";

export const ReviewMoveAnnotationsView = (props: any) => {
	const [moveAnnotationReviewQueue] = useAdminState((s) => [
		s.moveAnnotationReviewQueue,
	]);
	onMount(() => {
		console.log("fetching communtiry review queue");
		getAdminState().fetchMoveAnnotationReviewQueue();
	});
	const userEmails = createMemo(() => {
		const emails = moveAnnotationReviewQueue()?.map(
			(review: MoveAnnotationReview) => review.userEmail,
		);
		const uniqueEmails = new Set(emails);
		return Array.from(uniqueEmails).sort();
	});
	const [selectedEmail, setSelectedEmail] = createSignal(null);
	const filteredAnnotations = createMemo(() => {
		return filter(moveAnnotationReviewQueue(), (review) => {
			if (selectedEmail()) {
				return review.userEmail === selectedEmail();
			} else {
				return true;
			}
		});
	});

	createEffect(() => {
		console.log("moveAnnotationReviewQueue", moveAnnotationReviewQueue());
	});
	return (
		<AdminPageLayout>
			<Switch>
				<Match when={isNil(moveAnnotationReviewQueue())}>
					<CMText style={stylex()}>Loading...</CMText>
				</Match>
				<Match when={isEmpty(moveAnnotationReviewQueue())}>
					<CMText style={stylex()}>Looks like there's nothing left to review</CMText>
				</Match>
				<Match when={true}>
					<div class="row pb-4 items-center">
						<p>Filtered user: </p>
						<Dropdown
							choices={userEmails()}
							choice={selectedEmail()}
							onSelect={(email) => {
								console.log("setting email to ", email);
								setSelectedEmail(email);
							}}
							renderChoice={(choice, inList, onPress) => {
								return <p onClick={onPress}>{choice ?? "No user selected"}</p>;
							}}
						/>
					</div>
					<Show when={selectedEmail() !== null}>
						<div class="row pb-4 items-center space-x-4">
							<div
								class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
								onClick={() => {
									quick((s) => {
										filteredAnnotations().forEach((annotation) => {
											s.adminState.acceptMoveAnnotation(
												annotation.epd,
												annotation.san,
												annotation.text,
											);
										});
										s.adminState.moveAnnotationReviewQueue =
											s.adminState.moveAnnotationReviewQueue!.filter(
												(review) => {
													return review.userEmail !== selectedEmail();
												},
											);
									});
								}}
							>
								Accept {filteredAnnotations().length} annotations
							</div>
							<div
								class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
								onClick={() => {
									quick((s) => {
										filteredAnnotations().forEach((annotation) => {
											s.adminState.rejectMoveAnnotations(
												annotation.epd,
												annotation.san,
											);
										});
										s.adminState.moveAnnotationReviewQueue =
											s.adminState.moveAnnotationReviewQueue!.filter(
												(review) => {
													return review.userEmail !== selectedEmail();
												},
											);
									});
								}}
							>
								Reject {filteredAnnotations().length} annotations
							</div>
						</div>
					</Show>
					<div style={stylex(c.gridColumn({ gap: 92 }))}>
						<For each={filteredAnnotations()}>
							{(review) => <MoveAnnotationsReview review={review} />}
						</For>
					</div>
				</Match>
			</Switch>
		</AdminPageLayout>
	);
};

const MoveAnnotationsReview = (props: { review: MoveAnnotationReview }) => {
	const fen = `${props.review.epd} 0 1`;
	const position = new Chess(fen);
	const isMobile = useIsMobileV2();
	const [user] = useUserState((s) => [s.user]);
	const [acceptMoveAnnotation, rejectMoveAnnotations] = useAdminState((s) => [
		s.acceptMoveAnnotation,
		s.rejectMoveAnnotations,
	]);
	const [reviewed, setReviewed] = createSignal(false);
	return (
		<div style={stylex(isMobile() ? c.column : c.row, c.constrainWidth, c.relative)}>
			<Show when={reviewed()}>
				<div
					style={stylex(
						c.absoluteFull,
						c.bg(c.gray[20]),
						c.opacity(95),
						c.center,
						c.zIndex(2),
					)}
				>
					<CMText style={stylex()}>Reviewed!</CMText>
				</div>
			</Show>
			<div style={stylex(c.width(400), c.constrainWidth)}>
				<LazyLoad style={stylex(c.pb("100%"), c.height(0), c.width("100%"))}>
					<ChessboardView
						onSquarePress={noop}
						chessboardInterface={createStaticChessState({
							epd: props.review.epd,
							side: "white",
							nextMove: undefined,
						})}
					/>
				</LazyLoad>
				<Button
					class="cursor-pointer bg-gray-30 py-2 mt-2"
					onPress={() => {
						const windowReference = window.open("about:blank", "_blank");
						if (windowReference) {
							windowReference.location = `https://lichess.org/analysis/${props.review.epd}`;
						}
					}}
				>
					<div style={stylex(c.size(isMobile() ? 20 : 22))}>
						<LichessLogoIcon color={"white"} />
					</div>
					<Spacer width={8} />
					<CMText
						style={stylex(
							c.buttons.darkFloater.textStyles,
							c.fg("white"),
							c.weightRegular,
							c.fontSize(14),
						)}
					>
						Analyze on Lichess
					</CMText>
				</Button>
			</div>
			<Spacer width={24} />
			<div style={stylex(c.column, c.flexShrink(1))}>
				<CMText style={stylex(c.fontSize(24), c.weightBold)}>
					{capitalize(position.turn() === "b" ? "Black" : "White")} plays{" "}
					{props.review.san}
				</CMText>
				<Spacer height={12} />
				<div style={stylex(c.pb(12), c.fullWidth, c.width(300), c.bg(c.gray[80]))}>
					<div style={stylex(c.height(120))}>
						<AnnotationEditor
							annotation={() => props.review.text}
							onUpdate={(v) => {
								quick((s) => {
									s.adminState.editMoveAnnotation({
										epd: props.review.epd,
										san: props.review.san,
										userId: props.review.userId,
										text: v,
									});
								});
							}}
						/>
					</div>
					<Spacer height={12} />
					<div style={stylex(c.row, c.alignCenter, c.justifyBetween)}>
						{props.review?.userId === user()?.id ? (
							<>
								<CMText style={stylex(c.fg(c.gray[0]), c.px(12), c.caps)}>
									mine
								</CMText>
								<Spacer height={12} />
							</>
						) : (
							<>
								<CMText style={stylex(c.fg(c.gray[0]), c.px(12))}>
									{props.review?.userEmail ?? "Anonymous"}
								</CMText>
							</>
						)}
					</div>
				</div>
				<Spacer height={14} />
				<Button
					style={stylex(
						c.buttons.primary,
						c.py(8),
						c.bg(c.red[45]),
						c.px(16),
						{
							textStyles: stylex(
								c.buttons.basicSecondary.textStyles,
								c.fontSize(14),
								c.fg(c.gray[90]),
							),
						},
						c.selfEnd,
					)}
					onPress={() => {
						rejectMoveAnnotations()(props.review.epd, props.review.san);
						setReviewed(true);
					}}
				>
					Reject this annotation
				</Button>
				<Spacer height={14} />
				<Button
					style={stylex(
						c.buttons.primary,
						c.py(8),
						c.bg(c.green[45]),
						c.px(16),
						{
							textStyles: stylex(
								c.buttons.basicSecondary.textStyles,
								c.fontSize(14),
								c.fg(c.gray[90]),
							),
						},
						c.selfEnd,
					)}
					onPress={() => {
						acceptMoveAnnotation()(
							// @ts-ignore
							props.review.epd,
							props.review.san,
							props.review.text,
						);
						setReviewed(true);
					}}
				>
					Accept this annotation
				</Button>
			</div>
		</div>
	);
};
