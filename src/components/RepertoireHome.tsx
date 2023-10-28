import {
	capitalize,
	filter,
	find,
	isEmpty,
	isNil,
	noop,
	upperFirst,
} from "lodash-es";
import { Accessor, For, Show, createSignal, onMount } from "solid-js";
import { Spacer } from "~/components/Space";
import {
	getAppState,
	quick,
	useBrowsingState,
	useRepertoireState,
} from "~/utils/app_state";
import { START_EPD } from "~/utils/chess";
import { clsx } from "~/utils/classes";
import client from "~/utils/client";
import { isDevelopment, isNative } from "~/utils/env";
import { SETTINGS } from "~/utils/frontend_settings";
import { LichessMistake } from "~/utils/models";
import { pluralize } from "~/utils/pluralize";
import { SIDES } from "~/utils/repertoire";
import { bySide } from "~/utils/repertoire";
import { LOTS_DUE_MINIMUM } from "~/utils/review";
import { c, stylex } from "~/utils/styles";
import { COMBINED_THEMES_BY_ID, combinedThemes } from "~/utils/theming";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import {
	ConnectAccountsSetting,
	ConnectedAccountIconAndText,
} from "./ConnectedAccounts";
import { FeedbackView } from "./FeedbackView";
import { LoadingSpinner } from "./LoadingSpinner";
import { PreReview } from "./PreReview";
import { ReviewText } from "./ReviewText";
import {
	SeeMoreActions,
	SidebarAction,
	SidebarFullWidthButton,
	SidebarSectionHeader,
} from "./SidebarActions";
import {
	BetaFeaturesSettings,
	CoverageSettings,
	FrontendSettingView,
	RatingSettings,
	ThemeSettings,
} from "./SidebarSettings";
import { SidebarTemplate } from "./SidebarTemplate";
import { UpgradeSubscriptionView } from "./UpgradeSubscriptionView";
import { DeleteAccountView } from "./DeleteAccountView";
import { PrivacyPolicyAndTermsView } from "./PrivacyPolicyAndTermsView";
import { animateSidebar } from "./SidebarContainer";
import { Notifications } from "~/utils/notifications";

export const RepertoireHome = () => {
	const userState = () => getAppState().userState;
	const lichessMistakes = () => {
		if (isDevelopment) {
			// return [];
		}
		return getAppState().repertoireState.lichessMistakes;
	};
	const loadingMistakes = () => isNil(lichessMistakes());
	const themeId = () => userState().user?.theme;
	const theme = () =>
		find(combinedThemes, (theme) => theme.boardTheme === themeId()) ||
		COMBINED_THEMES_BY_ID.default;
	const [numMovesDueBySide, numMyMoves, earliestDueDate] = useRepertoireState(
		(s) => [
			bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
			bySide((side) => s.numMyMoves?.[side] ?? 0),
			bySide((side) => s.earliestReviewDueFromEpd[side][START_EPD]),
		],
	);
	const responsive = useResponsiveV2();
	const [progressState] = useBrowsingState(([s]) => {
		return [bySide((side) => s.repertoireProgressState[side])];
	});
	const overallEarliest = () => {
		const white = earliestDueDate().white;
		const black = earliestDueDate().black;
		if (white && !black) {
			return white;
		}
		if (!white && black) {
			return black;
		}
		if (white < black) {
			return white;
		} else {
			return black;
		}
	};
	onMount(() => {
		if (isDevelopment) {
			Notifications.registerNotifications();
		}
	});
	const overallActions: Accessor<SidebarAction[]> = () => {
		const totalDue =
			(numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
		const actions = [];
		console.log({ earliest: overallEarliest(), numDue: totalDue });

		actions.push({
			text: "Practice your repertoire",
			right: <ReviewText date={overallEarliest()} numDue={totalDue} />,
			style: "primary",
			disabled: totalDue === 0,
			onPress: () => {
				trackEvent("home.practice_all_due");
				quick((s) => {
					if (totalDue > LOTS_DUE_MINIMUM) {
						s.repertoireState.ui.pushView(PreReview, {
							props: { side: null },
						});
						return;
					}
					s.repertoireState.reviewState.startReview({
						side: null,
						filter: "due",
					});
				});
				return;
			},
		} as SidebarAction);
		return actions;
	};
	const [settingsExpanded, setSettingsExpanded] = createSignal(false);
	return (
		<Show when={userState().user}>
			<SidebarTemplate header={null} actions={[]} bodyPadding={false}>
				<div style={stylex(c.column, c.fullWidth, c.gap("10px"))}>
					<For each={SIDES}>
						{(side) => {
							return (
								<SidebarFullWidthButton
									action={{
										style: "wide",
										text: `${capitalize(side)} repertoire`,
										right: (
											<CMText style={stylex(c.fg(c.colors.text.secondary))}>
												{numMyMoves()[side] > 0
													? `${Math.round(
															progressState()[side].percentComplete * 100,
													  )}% complete`
													: "Not started"}
											</CMText>
										),
										onPress: () => {
											quick((s) => {
												trackEvent("home.select_side", { side });
												if (numMyMoves()[side] > 0) {
													animateSidebar("right");
													s.repertoireState.startBrowsing(side, "overview");
												} else {
													animateSidebar("right");
													s.repertoireState.startBrowsing(side, "overview");
												}
											});
										},
									}}
								/>
							);
						}}
					</For>
				</div>

				<Spacer height={46} />
				<Show when={!isEmpty(overallActions())}>
					<For each={overallActions()}>
						{(action) => <SidebarFullWidthButton action={action} />}
					</For>
				</Show>
				<Show when={userState().isConnectedToExternal()}>
					<Spacer height={12} />
					<div style={stylex(c.column, c.fullWidth, c.gap("10px"))}>
						<SidebarFullWidthButton
							action={{
								style: "primary",
								text: "Review your online games",
								disabled: isEmpty(lichessMistakes()),
								right: loadingMistakes() ? (
									<LoadingSpinner class="text-[12px]" />
								) : (
									<div
										class={clsx(
											"flex row text-xs font-semibold",
											isEmpty(lichessMistakes())
												? "text-tertiary"
												: "text-orange-60 ",
										)}
									>
										<CMText class={clsx("")}>
											{lichessMistakes()?.length
												? `${pluralize(lichessMistakes()!.length, "Mistake")}`
												: "No mistakes"}
										</CMText>
										<i
											class={clsx(
												"fa ml-2",
												isEmpty(lichessMistakes())
													? "fa-circle-check"
													: "fa-circle-x",
											)}
										/>
									</div>
								),
								onPress: () => {
									quick((s) => {
										s.repertoireState.reviewState.startReview({
											lichessMistakes: lichessMistakes() as LichessMistake[],
											side: null,
										});
									});
								},
							}}
						/>
					</div>
				</Show>
				<Show when={!userState().isConnectedToExternal()}>
					<Spacer height={10} />
					<div style={stylex(c.column, c.fullWidth, c.gap("10px"))}>
						<SidebarFullWidthButton
							action={{
								style: "primary",
								text: "Review your online games",
								right: (
									<CMText class="text-secondary text-xs">
										{responsive().isMobile ? "Connect" : "Connect account"}…
									</CMText>
								),
								onPress: () => {
									quick((s) => {
										s.repertoireState.ui.pushView(ConnectAccountsSetting);
									});
								},
							}}
						/>
					</div>
				</Show>
				<Spacer height={46} />
				<>
					<SidebarSectionHeader text="Settings" />
					<div style={stylex()}>
						<For
							each={filter(
								[
									{
										onPress: () => {
											quick((s) => {
												trackEvent("home.settings.coverage");
												s.repertoireState.ui.pushView(CoverageSettings);
											});
										},
										text: "Cover positions seen in",
										right: `1 in ${Math.round(
											1 / userState().getCurrentThreshold(),
										)} games`,
										style: "secondary",
									} as SidebarAction,
									{
										onPress: () => {
											quick((s) => {
												trackEvent("home.settings.rating");
												s.repertoireState.ui.pushView(RatingSettings);
											});
										},
										text: "Your rating",
										right: `${userState().user?.ratingRange} ${
											userState().user?.ratingSystem
										}`,
										style: "secondary",
									} as SidebarAction,
									{
										onPress: () => {
											quick((s) => {
												s.repertoireState.ui.pushView(ConnectAccountsSetting);
											});
										},
										// todo: enable handling of xs breakpoint stuff
										text: "Connected to",
										right: (
											<div class="flex row space-x-4">
												<ConnectedAccountIconAndText
													text="Lichess"
													connected={!!userState().user?.lichessUsername}
												/>
												<ConnectedAccountIconAndText
													text="Chess.com"
													connected={!!userState().user?.chesscomUsername}
												/>
											</div>
										),
										style: "secondary",
									} as SidebarAction,
									{
										onPress: () => {
											quick((s) => {
												trackEvent("home.settings.theme");
												s.repertoireState.ui.pushView(ThemeSettings);
											});
										},
										text: "Board appearance",
										right: `${upperFirst(theme().name)}`,
										style: "secondary",
									} as SidebarAction,

									{
										onPress: () => {
											quick((s) => {
												trackEvent("home.settings.pieceAnimationSpeed");
												s.repertoireState.ui.pushView(FrontendSettingView, {
													props: { setting: SETTINGS.pieceAnimation },
												});
											});
										},
										hidden: !settingsExpanded(),
										text: SETTINGS.pieceAnimation.title,
										right:
											userState().getFrontendSetting("pieceAnimation").label,
										style: "secondary",
									} as SidebarAction,
									{
										onPress: () => {
											quick((s) => {
												trackEvent("home.settings.beta_features");
												s.repertoireState.ui.pushView(BetaFeaturesSettings);
											});
										},
										text: "Beta features",
										hidden: !settingsExpanded() || isNative,
										right: `${
											(userState().getEnabledFlags()?.length ?? 0) > 0
												? `${userState().getEnabledFlags()?.length} enabled`
												: "None enabled"
										}`,
										style: "secondary",
									} as SidebarAction,
									{
										hidden:
											!settingsExpanded() ||
											(userState().user?.subscribed && isNative),
										onPress: () => {
											quick((s) => {
												if (!userState().user?.subscribed) {
													trackEvent("home.settings.subscribe");
													s.repertoireState.ui.pushView(
														UpgradeSubscriptionView,
													);
												} else {
													trackEvent("home.settings.manage_subscription");
													return client
														.post("/api/stripe/create-billing-portal-link")
														.then(({ data }: { data: { url: string } }) => {
															if (!window.open(data.url, "_blank")) {
																window.location.href = data.url;
															}
														})
														.finally(noop);
												}
											});
										},
										text: userState().user?.subscribed
											? "Manage your subscription"
											: "Upgrade to add unlimited moves",
										style: "secondary",
									} as SidebarAction,
									{
										hidden:
											!settingsExpanded() || (!isDevelopment && !isNative),
										onPress: () => {
											quick((s) => {
												trackEvent("home.privacy_and_terms");
												s.repertoireState.ui.pushView(
													PrivacyPolicyAndTermsView,
												);
											});
										},
										text: "Privacy Policy / Terms of Use",
										style: "secondary",
									} as SidebarAction,
									{
										hidden:
											!settingsExpanded() ||
											(!isDevelopment &&
												(!isNative || !userState().user?.email)),
										onPress: () => {
											quick((s) => {
												trackEvent("home.delete_account");
												s.repertoireState.ui.pushView(DeleteAccountView);
											});
										},
										text: "Delete your account",
										style: "secondary",
									} as SidebarAction,
								],
								// @ts-ignore
								(a) => !a.hidden,
							)}
						>
							{(action, i) => <SidebarFullWidthButton action={action} />}
						</For>
						<SeeMoreActions
							text={settingsExpanded() ? "Hide" : "More options..."}
							onClick={() => {
								setSettingsExpanded(!settingsExpanded());
							}}
						/>
					</div>
					<Spacer height={46} />
				</>
				<>
					<SidebarSectionHeader text="Contact us" />
					<div style={stylex()}>
						<For
							each={[
								{
									onPress: () => {
										quick((s) => {
											trackEvent("home.contact.discord");
											window.open("https://discord.gg/vNzfu5VetQ", "_blank");
										});
									},
									text: "Join our Discord",
									style: "secondary",
								} as SidebarAction,
								{
									onPress: () => {
										quick((s) => {
											trackEvent("home.contact.twitter");
											window.open("https://twitter.com/chessbookcom", "_blank");
										});
									},
									text: "Follow us on Twitter",
									style: "secondary",
								} as SidebarAction,
								{
									onPress: () => {
										quick((s) => {
											trackEvent("home.contact.feedback");
											s.repertoireState.ui.pushView(FeedbackView);
										});
									},
									text: "Share your feedback",
									style: "secondary",
								} as SidebarAction,
							]}
						>
							{(action) => <SidebarFullWidthButton action={action} />}
						</For>
					</div>
					<Spacer height={46} />
				</>
			</SidebarTemplate>
		</Show>
	);
};
