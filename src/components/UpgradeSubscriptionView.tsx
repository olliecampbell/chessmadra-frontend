import { createSignal, onMount, For } from "solid-js";
import { useSidebarState, quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { SidebarTemplate } from "./SidebarTemplate";
import { trackEvent } from "~/utils/trackEvent";
import { Bullet } from "./Bullet";
import { isIos } from "~/utils/env";

export const UpgradeSubscriptionView = (props: { pastLimit: boolean }) => {
	const [loading, setLoading] = createSignal(false);
	const requestProPlan = (annual: boolean) => {
		setLoading(true);
		trackEvent("upgrade.subscribe", {
			type: annual ? "annual" : "monthly",
		});
		quick((s) => {
			s.userState.getCheckoutLink(annual).then((url) => {
				window.location.href = url;
			});
		});
	};
	console.log("re-rendering!");
	onMount(() => {
		trackEvent("upgrade.shown");
	});
	const bullets = isIos
		? []
		: [<>Cancel any time (and keep any moves you've added).</>];
	return (
		<SidebarTemplate
			actions={
				loading() || isIos
					? []
					: [
							{
								onPress: () => {
									requestProPlan(false);
								},
								text: "Upgrade to Chessbook Pro - Monthly",
								subtext: "$5/month",
								style: "primary",
							},
							{
								onPress: () => {
									requestProPlan(true);
								},
								text: "Upgrade to Chessbook Pro - Annual",
								subtext: "$4/month (save 20%)",
								style: "primary",
							},
					  ]
			}
			header={
				props.pastLimit
					? `You've reached the limit on the free plan`
					: "Upgrade your account"
			}
			bodyPadding={true}
			loading={loading()}
		>
			<p class={clsx("text-secondary leading-5 pb-2")}>
				Free users can add {MAX_MOVES_FREE_TIER} moves per color.{" "}
				{!isIos && <>Upgrade to add unlimited moves.</>}
			</p>
			<div class={"space-y-2"}>
				<For each={bullets}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
			</div>
		</SidebarTemplate>
	);
};
