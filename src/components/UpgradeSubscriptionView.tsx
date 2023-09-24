import { Bullet } from "./Bullet";
import { SidebarTemplate } from "./SidebarTemplate";
import { For, createSignal, onMount } from "solid-js";
import { getAppState, quick, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { isIos } from "~/utils/env";
import {
	PRODUCT_CHESSBOOK_PRO_ANNUAL,
	PRODUCT_CHESSBOOK_PRO_MONTHLY,
} from "~/utils/in_app_purchases";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { trackEvent } from "~/utils/trackEvent";

export const UpgradeSubscriptionView = (props: { pastLimit: boolean }) => {
	const [loading, setLoading] = createSignal(false);
	const products = () => getAppState().inAppPurchaseState.products;
	const requestProPlan = (annual: boolean) => {
		setLoading(true);
		trackEvent("upgrade.subscribe", {
			type: annual ? "annual" : "monthly",
		});
		quick((s) => {
			if (isIos) {
				const product =
					products()[
						annual
							? PRODUCT_CHESSBOOK_PRO_ANNUAL
							: PRODUCT_CHESSBOOK_PRO_MONTHLY
					];
				product
					.getOffer()!
					.order()
					.then((x) => {
						console.log("ordered!", x);
						if (!x?.isError) {
							console.log("should subscribe user");
						}
					});
			} else {
				s.userState.getCheckoutLink(annual).then((url) => {
					window.location.href = url;
				});
			}
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
								subtext: isIos
									? `${
											products()[PRODUCT_CHESSBOOK_PRO_MONTHLY].pricing!.price
									  }/month`
									: "$5/month",
								style: "primary",
							},
							{
								onPress: () => {
									requestProPlan(true);
								},
								text: "Upgrade to Chessbook Pro - Annual",
								subtext: isIos
									? `${
											products()[PRODUCT_CHESSBOOK_PRO_ANNUAL].pricing!.price
									  }/year (save ${Math.round(
											(1 -
												products()[PRODUCT_CHESSBOOK_PRO_ANNUAL].pricing!
													.priceMicros /
													products()[PRODUCT_CHESSBOOK_PRO_MONTHLY].pricing!
														.priceMicros) *
												100,
									  )}%)`
									: "$4/month (save 20%)",
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
				Free users can add {MAX_MOVES_FREE_TIER} moves per color. Upgrade to add
				unlimited moves.
			</p>
			<div class={"space-y-2"}>
				<For each={bullets}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
			</div>
		</SidebarTemplate>
	);
};
