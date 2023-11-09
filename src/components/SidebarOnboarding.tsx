import { c, stylex } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, first, noop } from "lodash-es";
import { CMText } from "./CMText";
import {
	getAppState,
	quick,
	useRepertoireState,
	useSidebarState,
	useUserState,
} from "~/utils/app_state";
import { SidebarOnboardingImportType } from "~/utils/browsing_state";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { SidebarAction } from "./SidebarActions";
import { useOutsideClick } from "./useOutsideClick";
import { SidebarTemplate } from "./SidebarTemplate";
import {
	Component,
	createEffect,
	createSignal,
	Match,
	Switch,
	For,
	onMount,
	JSX,
} from "solid-js";
import { Motion } from "@motionone/solid";
import { destructure } from "@solid-primitives/destructure";
import { clsx } from "~/utils/classes";
import { TextArea, TextInput } from "./TextInput";
import { pgnToLine, Side, SIDES } from "~/utils/repertoire";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { DEFAULT_ELO_RANGE } from "~/utils/repertoire_state";
import { Bullet } from "./Bullet";
import { LoginSidebar } from "./LoginSidebar";
import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-yup";
import * as yup from "yup";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { renderThreshold } from "~/utils/threshold";
import { RatingSelection } from "./RatingSelection";
import { animateSidebar } from "./SidebarContainer";
import { useLineEcoCode } from "~/utils/eco_codes";

export const OnboardingIntro = () => {
	const bullets = [
		"Adding your first moves",
		"Practicing them using spaced repetition",
	];
	return (
		<SidebarTemplate
			header="Let's start creating your repertoire!"
			bodyPadding={true}
			actions={[
				{
					onPress: () => {
						quick((s) => {
							s.repertoireState.ui.pushView(SetRatingOnboarding);
							trackEvent("onboarding.get_started");
						});
					},
					style: "primary",
					text: "Get started",
				},
			]}
		>
			<CMText class={"body-text"}>
				This setup process will introduce some of the key ideas behind
				Chessbook.
			</CMText>
			<Spacer height={12} />
			<p class={"body-text"}>This walkthrough will cover:</p>
			<div style={stylex(c.gridColumn({ gap: 8 }), c.pt(12))}>
				{bullets.map((bullet, i) => (
					<Bullet>{bullet}</Bullet>
				))}
			</div>
			<Spacer height={12} />
			<p class="body-text">It should only take a few minutes to complete.</p>
		</SidebarTemplate>
	);
};

export const SetRatingOnboarding = () => {
	const [user] = useUserState((s) => [s.user]);
	const setAndContinue = (range: string | null) => {
		quick((s) => {
			Promise.all([
				// this is dumb, but just so we get the latest elo range from the backend
				s.userState.setRatingRange(
					range ?? s.userState.user?.ratingRange ?? DEFAULT_ELO_RANGE.join("-"),
				),
			]).then(() => {
				quick((s) => {
					const recommendedThreshold = getRecommendedMissThreshold(
						s.userState.user?.eloRange ?? DEFAULT_ELO_RANGE.join("-"),
					);
					s.userState.setTargetDepth(recommendedThreshold);
					s.repertoireState.ui.pushView(AskAboutExistingRepertoireOnboarding);
				});
			});
		});
	};
	onMount(() => {
		trackEvent("onboarding.rating.shown");
	});
	return (
		<SidebarTemplate
			header={"What is your current rating?"}
			bodyPadding={true}
			actions={[
				{
					onPress: () => {
						trackEvent("onboarding.rating.set", {
							ratingRange: user()?.ratingRange,
							ratingSource: user()?.ratingSystem,
						});
						setAndContinue(null);
					},
					style: "primary",
					text: "Set rating and continue",
				},
				{
					onPress: () => {
						trackEvent("onboarding.rating.dont_know");
						setAndContinue("0-1100");
					},
					style: "primary",
					text: "I don't know, skip this step",
				},
			]}
		>
			<CMText class={"body-text"}>
				This is used to determine which moves your opponents are likely to play.
			</CMText>
			<Spacer height={24} />
			<RatingSelection />
		</SidebarTemplate>
	);
};

export const ChooseToCreateAccountOnboarding = () => {
	onMount(() => {
		trackEvent("onboarding.create_account.shown");
	});
	return (
		<SidebarTemplate
			header={"Would you like to create an account?"}
			bodyPadding={true}
			actions={[
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.create_account.yes");
							s.repertoireState.ui.pushView(LoginSidebar, {
								props: { authType: "register" },
							});
						});
					},
					style: "primary",
					text: "Create account",
				},
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.create_account.skip");
							s.repertoireState.ui.pushView(OnboardingComplete);
						});
					},
					style: "primary",
					text: "Skip this step for now",
				},
			]}
		>
			<CMText class={"body-text"}>
				Creating an account will let you access your repertoire from other
				devices and prevent you from losing it if you clear your browser
				history.
			</CMText>
		</SidebarTemplate>
	);
};

type TFake = any;
export const Dropdown: Component<{
	choice: TFake;
	choices: TFake[];
	title?: string;
	onSelect: (_: TFake) => void;
	renderChoice: (
		_: TFake,
		inDropdown: boolean,
		onPress: (e: MouseEvent) => void,
	) => JSX.Element;
}> = (props) => {
	const [isOpen, setIsOpen] = createSignal(false);
	const [ref, setRef] = createSignal(null);

	useOutsideClick(ref, (e: MouseEvent) => {
		if (isOpen()) {
			setIsOpen(false);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	});
	return (
		<div style={stylex(c.zIndex(10), c.relative)} class={"col"}>
			<p class={"text-secondary pb-2 text-sm font-bold"}>{props.title}</p>
			<div
				class={clsx(
					"bg-gray-4 row cursor-pointer items-center rounded-sm px-4",
				)}
				ref={setRef}
				onClick={() => {
					setIsOpen(!isOpen());
				}}
			>
				<div class={clsx("pointer-events-none")}>
					{props.renderChoice(props.choice, false, noop)}
				</div>
				<Spacer width={8} />
				<i
					class="fas fa-angle-down"
					style={stylex(c.fontSize(18), c.fg(c.gray[80]))}
				/>
				<Motion
					animate={{ opacity: isOpen() ? 1 : 0 }}
					style={stylex(c.top("calc(100% + 8px)"), c.gridColumn({ gap: 0 }))}
					class={clsx(
						"bg-gray-4  p-2 absolute min-w-fit z-100 inset-x-0 rounded-[4px] items-stretch border border-solid border-gray-26",
						!isOpen() && "pointer-events-none",
					)}
				>
					<For each={props.choices}>
						{(c) => (
							<div class={clsx("&hover:bg-gray-16 ")}>
								{props.renderChoice(c, true, (e) => {
									props.onSelect(c);
									setIsOpen(false);
									e?.preventDefault();
									e?.stopPropagation();
								})}
							</div>
						)}
					</For>
				</Motion>
			</div>
		</div>
	);
};

const ChooseColorOnboarding = () => {
	onMount(() => {
		trackEvent("onboarding.choose_color.shown");
	});
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Which color would you like to import?"
			actions={SIDES.map((side) => ({
				onPress: () => {
					quick((s) => {
						trackEvent("onboarding.choose_color", { color: side });
						s.repertoireState.onboarding.side = side;
						s.repertoireState.ui.pushView(PGNImportOnboarding, {
							props: { side },
						});
					});
				},
				text: capitalize(side),
				style: "primary",
			}))}
		/>
	);
};

export const OnboardingComplete = () => {
	const responsive = useResponsiveV2();
	const bullets = () => {
		const bullets = [];
		bullets.push("Keep adding moves to your repertoire to get to 100%");
		bullets.push(
			<>
				Practice every day{" "}
				{!responsive().isMobile &&
					"(visit Chessbook.com on your phone to practice on the go)"}
			</>,
		);

		return bullets;
	};
	onMount(() => {
		trackEvent("onboarding.complete.shown");
	});
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Your Chessbook is ready to go!"
			actions={[
				{
					text: "Continue",
					style: "primary",
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.complete.continue");
							s.repertoireState.onboarding.isOnboarding = false;
							animateSidebar("left");
							s.repertoireState.backToOverview();
						});
					},
				},
			]}
		>
			<p class={"body-text"}>
				You've made a great start towards mastering the opening!
			</p>
			<Spacer height={16} />
			<p class={"body-text font-bold"}>Recommended next steps:</p>
			<Spacer height={8} />
			<div class={"space-y-2"}>
				<For each={bullets()}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
			</div>
		</SidebarTemplate>
	);
};

export const ImportSuccessOnboarding = () => {
	const responsive = useResponsiveV2();
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [progressState] = useRepertoireState((s) => [
		s.browsingState.repertoireProgressState[onboarding().side as Side],
	]);
	onMount(() => {
		trackEvent("onboarding.import_success.shown");
	});
	const missName = () => {
		const biggestMiss =
			getAppState().repertoireState.repertoireGrades[onboarding().side!]
				?.biggestMiss;
		if (!biggestMiss) {
			return null;
		}
		const { name } =
			useLineEcoCode(pgnToLine(first(biggestMiss?.lines)!))() ?? {};
		return name;
	};
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Import successful"
			actions={[
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.import_success.continue");
							animateSidebar("right");
							s.repertoireState.browsingState.goToBuildOnboarding();
						});
					},
					text: "Go to the biggest gap in your repertoire",
					right: missName(),
					style: "primary",
				},
			]}
		>
			<RepertoireCompletion side={onboarding().side!} />
			<Spacer height={24} />
			<HowToComplete />
		</SidebarTemplate>
	);
};

export const HowToComplete = (props: {
	miss?: { name: string; incidence: number } | null | undefined;
}) => {
	const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
	const bullets = () => [
		<>
			Your goal is to cover any positions which occur in at least{" "}
			<b>{renderThreshold(threshold())} games </b>.
		</>,
		props.miss ? (
			<>
				Your biggest gap is in the <b>{props.miss.name}</b>, which you’ll see in{" "}
				<b>{renderThreshold(threshold())} games </b>
			</>
		) : (
			<>
				This goal was set based on your rating but you can always change it
				later.
			</>
		),
	];
	return (
		<>
			<CMText class={"body-text font-bold"}>
				How to complete your repertoire:
			</CMText>
			<div style={stylex(c.gridColumn({ gap: 8 }), c.pt(12))}>
				{bullets().map((bullet, i) => (
					<Bullet>{bullet}</Bullet>
				))}
			</div>
		</>
	);
};

export const FirstLineSavedOnboarding = () => {
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	onMount(() => {
		trackEvent("onboarding.first_line_saved.shown");
	});
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="You've added your first moves!"
			actions={[
				{
					onPress: () => {
						trackEvent("onboarding.first_line_saved.continue");
						quick((s) => {
							s.repertoireState.ui.pushView(PracticeIntroOnboarding);
						});
					},
					text: "Ok, got it",
					style: "primary",
				},
			]}
		>
			<RepertoireCompletion side={onboarding().side!} />
			<Spacer height={32} />
			<HowToComplete />
		</SidebarTemplate>
	);
};

const PracticeIntroOnboarding = () => {
	const [currentLine] = useSidebarState(([s]) => [s.chessboard.getMoveLog()]);
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	onMount(() => {
		trackEvent("onboarding.practice_intro.shown");
	});
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Now let's practice the moves you've added…"
			actions={[
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.practice_intro.continue");
							s.repertoireState.reviewState.reviewLine(
								currentLine(),
								onboarding().side!,
							);
						});
					},
					text: "Practice these moves",
					style: "primary",
				},
			]}
		>
			<CMText class="body-text">
				Chessbook uses spaced repetition, a scientifically proven technique to
				memorize openings quickly and thoroughly.
			</CMText>
		</SidebarTemplate>
	);
};

const AskAboutExistingRepertoireOnboarding = () => {
	onMount(() => {
		trackEvent("onboarding.ask_about_existing_repertoire.shown");
	});
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Do you want to import an existing repertoire?"
			actions={[
				{
					onPress: () => {
						trackEvent("onboarding.ask_about_existing_repertoire.has_existing");
						quick((s) => {
							s.repertoireState.ui.pushView(ChooseImportSourceOnboarding);
						});
					},
					text: "Yes, import an existing repertoire",
					style: "primary",
				},
				{
					onPress: () => {
						trackEvent("onboarding.ask_about_existing_repertoire.no_existing");
						quick((s) => {
							animateSidebar("right");
							s.repertoireState.browsingState.goToBuildOnboarding();
						});
					},
					text: "No, I'll start from scratch",
					style: "primary",
				},
			]}
		>
			<CMText class="body-text">
				You can upload a PGN, or connect your Lichess account to add the
				openings you play automatically.
			</CMText>
		</SidebarTemplate>
	);
};

export const ChooseImportSourceOnboarding = (props: { side?: Side }) => {
	onMount(() => {
		trackEvent("onboarding.choose_import_source.shown");
	});

	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	return (
		<SidebarTemplate
			header="How do you want to import your repertoire? "
			actions={[
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.choose_import_source.pgn");
							if (props.side) {
								s.repertoireState.ui.pushView(PGNImportOnboarding, {
									props: { side: props.side },
								});
							} else {
								s.repertoireState.ui.pushView(ChooseColorOnboarding, {});
							}
						});
					},
					text: "From a PGN file",
					style: "primary",
				},
				{
					onPress: () => {
						trackEvent("onboarding.choose_import_source.lichess");
						quick((s) => {
							if (s.userState.user?.lichessUsername) {
								s.repertoireState.ui.pushView(FetchingLichessGames, {});
							} else {
								s.userState.authWithLichess({
									source: onboarding().isOnboarding ? "onboarding" : "import",
									side: props.side,
								});
							}
						});
					},
					text: "From my Lichess games",
					style: "primary",
				},
				// {
				// 	onPress: () => {
				// 		trackEvent("onboarding.choose_import_source.chesscom");
				// 		quick((s) => {
				// 			s.repertoireState.ui.pushView(ImportOnboarding, {
				// 				props: {
				// 					importType: SidebarOnboardingImportType.ChesscomUsername,
				// 				},
				// 			});
				// 		});
				// 	},
				// 	text: "From my chess.com games",
				// 	style: "primary",
				// },
				...(onboarding().isOnboarding
					? [
							{
								onPress: () => {
									trackEvent("onboarding.choose_import_source.nevermind");
									quick((s) => {
										animateSidebar("right");
										s.repertoireState.browsingState.goToBuildOnboarding();
									});
								},
								text: "Nevermind, skip this for now",
								style: "primary",
							} as SidebarAction,
					  ]
					: []),
			]}
		/>
	);
};

export const ChooseGameImportSourceOnboarding = () => {
	onMount(() => {
		trackEvent("onboarding.choose_game_import_source.shown");
	});
	return (
		<SidebarTemplate
			header="How do you want to import your repertoire? "
			actions={[
				{
					onPress: () => {
						quick((s) => {
							trackEvent("onboarding.choose_import_source.pgn");
							s.repertoireState.ui.pushView(PGNImportOnboarding);
						});
					},
					text: "From a PGN file",
					style: "primary",
				},
				{
					onPress: () => {
						trackEvent("onboarding.choose_import_source.lichess");
						quick((s) => {
							s.userState.authWithLichess({ source: "onboarding" });
						});
					},
					text: "From my Lichess games",
					style: "primary",
				},
				{
					onPress: () => {
						trackEvent("onboarding.choose_import_source.nevermind");
						quick((s) => {
							animateSidebar("right");
							s.repertoireState.browsingState.goToBuildOnboarding();
						});
					},
					text: "Nevermind, skip this for now",
					style: "primary",
				},
			]}
		/>
	);
};

export const FetchingLichessGames = () => {
	const user = () => getAppState().userState?.user;
	createEffect(() => {
		if (user()?.lichessUsername) {
			quick((s) => {
				s.repertoireState.initializeRepertoire({
					lichessUsername: user()!.lichessUsername,
				});
			});
		}
	});
	return (
		<SidebarTemplate
			actions={[]}
			bodyPadding={true}
			header={"Fetching your Lichess games..."}
			loading={true}
		></SidebarTemplate>
	);
};

export const PGNImportOnboarding = (props: {
	importType: SidebarOnboardingImportType;
	side: Side;
	comingFromOauth?: boolean;
}) => {
	const responsive = useResponsiveV2();
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const side = () => activeSide() || onboarding().side;

	const importType = () => props.importType;
	const [loading, setLoading] = createSignal(null as string | boolean | null);
	const [pgn, setPgn] = createSignal("");

	onMount(() => {
		trackEvent(`onboarding.import_${importType()}.shown`);
	});
	const { header, actions } = destructure(() => {
		let header = null;
		let actions: SidebarAction[] = [];
		header = `Please upload your ${side()} repertoire`;
		if (pgn()) {
			actions.push({
				text: "Submit",
				onPress: () => {
					importFromPgn();
					onMount(() => {
						trackEvent(`onboarding.import_${importType()}.submit`);
					});
				},
				style: "primary",
			});
		}
		if (loading()) {
			actions = [];
		}
		return { header, actions };
	});

	const importFromPgn = () => {
		setLoading("Importing");
		quick((s) => {
			const params = {} as any;
			if (side() === "white") {
				params.whitePgn = pgn();
			} else {
				params.blackPgn = pgn();
			}
			s.repertoireState.initializeRepertoire({ ...params, responsive });
			trackEvent("import.from_pgns");
		});
	};

	return (
		<SidebarTemplate
			bodyPadding={true}
			header={header()}
			actions={actions()}
			loading={loading()}
		>
			<div class={"flex flex-col space-y-8"}>
				<PGNUpload onChange={setPgn} side={props.side} />
			</div>
		</SidebarTemplate>
	);
};

export const TrimRepertoireOnboarding = () => {
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const side = () => activeSide() || onboarding().side;
	const [getNumResponsesBelowThreshold] = useRepertoireState((s) => [
		s.getNumResponsesBelowThreshold,
	]);
	const [userThreshold] = useUserState((s) => [s.getCurrentThreshold()]);
	onMount(() => {
		trackEvent("onboarding.trim_repertoire.shown");
	});
	const header = "Do you want to trim your repertoire?";
	const body = (
		<CMText class="body-text">
			We can trim your repertoire to only the moves you're likely to see. This
			can be a good option if you have a large repertoire from other software.
		</CMText>
	);
	const [loading, setLoading] = createSignal(false);

	const trimToThreshold = (threshold: number) => {
		trackEvent("onboarding.trim_repertoire.trimmed", { threshold });
		setLoading(true);
		quick((s) => {
			s.repertoireState.trimRepertoire(threshold, [side()!]).then(() => {
				if (onboarding().isOnboarding) {
					s.repertoireState.ui.pushView(ImportSuccessOnboarding);
				} else {
					s.repertoireState.backToOverview();
				}
			});
		});
	};

	const actions = () => {
		let actions: SidebarAction[] = [];
		// TODO: this isn't quite accurate since danger isn't accounted for,
		// should have the same formula on the frontend, and include danger in
		// repertoire response
		const numMoves = getNumResponsesBelowThreshold()(userThreshold(), side()!);
		actions.push({
			text: "Trim rare lines below your coverage goal",
			subtext: `${numMoves} moves will be trimmed`,
			onPress: () => {
				trimToThreshold(userThreshold());
			},
			style: "primary",
		});
		actions.push({
			text: `No thanks, I'll keep my whole repertoire`,
			onPress: () => {
				trackEvent("onboarding.trim_repertoire.skip");
				quick((s) => {
					if (onboarding().isOnboarding) {
						s.repertoireState.ui.pushView(ImportSuccessOnboarding);
					} else {
						s.repertoireState.ui.clearViews();
						s.repertoireState.startBrowsing(side()!, "overview");
					}
				});
			},
			style: "primary",
		});
		if (loading()) {
			actions = [];
		}
		return actions;
	};
	return (
		<SidebarTemplate
			bodyPadding
			header={header}
			actions={actions()}
			loading={loading()}
		>
			{body}
		</SidebarTemplate>
	);
};

const PGNUpload = (props: { onChange: (pgn: string) => void; side: Side }) => {
	const [textInputPgn, setTextInputPgn] = createSignal<string | null>("");
	const [pgnUploadRef, setPgnUploadRef] = createSignal(
		null as HTMLInputElement | null,
	);
	const [hasUploaded, setHasUploaded] = createSignal(false);
	createEffect(() => {
		const input = pgnUploadRef();
		if (input) {
			input.addEventListener("change", async (e) => {
				const file = input.files?.[0];
				if (file) {
					const body = await file.text();
					setTextInputPgn(null);
					props.onChange(body);
					setHasUploaded(true);
					return true;
				}
				e.preventDefault();
			});
		}
	});
	return (
		<div>
			<div class={"bg-gray-6 rounded-sm p-4"}>
				<div
					class={
						"border-gray-24 border-1 &hover:bg-gray-12 row relative h-20 w-full items-center justify-center rounded-sm border-dashed transition-colors"
					}
				>
					<i
						class={clsx("fas mr-2", hasUploaded() ? "fa-check" : "fa-upload")}
					/>
					{hasUploaded() ? "Uploaded" : "Upload"}
					<input
						type="file"
						ref={setPgnUploadRef}
						class={"absolute z-10 h-24 h-full w-full cursor-pointer opacity-0"}
					/>
				</div>
				<div class={"row my-4 items-center space-x-2"}>
					<div class={"bg-gray-18 h-1px grow"} />
					<p class={"text-secondary  ext-xs font-semibold"}>Or</p>
					<div class={"bg-gray-18 h-1px grow"} />
				</div>
				<TextArea
					placeholder="Paste your PGN here"
					onInput={(v) => {
						setTextInputPgn(v.target.value);
						props.onChange(v.target.value);
						setHasUploaded(false);
					}}
					class=" mt-2 w-full rounded-sm border border-gray-400"
					inputClass={"bg-gray-16"}
					// @ts-ignore
					value={textInputPgn()}
				/>
			</div>
		</div>
	);
};
