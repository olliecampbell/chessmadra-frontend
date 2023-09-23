import { useLocation } from "@solidjs/router";
import { Component, Match, Switch, createEffect, onMount } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import {
	getAppState,
	quick,
	useAppState,
	useRepertoireState,
} from "~/utils/app_state";
import { isIos } from "~/utils/env";
import { identify, identifyOnce } from "~/utils/user_properties";
import { AuthStatus } from "~/utils/user_state";
import { RepertoireBuilder } from "./RepertoireBuilder";
import { trackEvent } from "~/utils/trackEvent";
import { OnboardingIntro } from "./SidebarOnboarding";

export const PageWrapper = (props: { initialView?: Component }) => {
	const [userState] = useAppState((s) => [s.userState]);
	const token = () => getAppState().userState.token;
	const [repertoireLoading] = useRepertoireState((s) => [
		s.repertoire === undefined,
	]);
	const [authStatus] = useAppState((s) => [s.userState.authStatus]);
	const location = useLocation();

	onMount(() => {
		identifyOnce({ initial_page: location.pathname });
	});

	createEffect(() => {
		if (repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
			quick((s) => {
				s.repertoireState.initState();
			});
		}
	});
	onMount(() => {
		quick((s) => {
			if (props.initialView) {
				s.userState.pastLandingPage = true;
				s.repertoireState.onboarding.isOnboarding = false;
				s.repertoireState.browsingState.pushView(props.initialView);
			}
		});
	});
	const showLandingPage = () =>
		!(token().value || userState().pastLandingPage || repertoireLoading());
	createEffect(() => {
		if (showLandingPage() && isIos) {
			quick((s) => {
				trackEvent("onboarding.started");
				s.repertoireState.onboarding.isOnboarding = true;
				s.repertoireState.browsingState.pushView(OnboardingIntro);
				s.userState.pastLandingPage = true;
			});
		}
	});

	// return <SidebarLayout mode={mode()} />;
	return (
		<Switch fallback={<LandingPageWrapper />}>
			<Match when={!showLandingPage() || isIos}>
				<RepertoireBuilder />
			</Match>
		</Switch>
	);
};
