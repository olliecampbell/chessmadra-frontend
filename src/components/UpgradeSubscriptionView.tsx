import { isEmpty } from "lodash-es";
import { Bullet } from "./Bullet";
import { SidebarTemplate } from "./SidebarTemplate";
import { For, createSignal, onMount } from "solid-js";
import { getAppState, quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { isNative } from "~/utils/env";
import {
	PRODUCT_CHESSBOOK_ANNUAL,
	PRODUCT_CHESSBOOK_MONTHLY,
} from "~/utils/in_app_purchases";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { trackEvent } from "~/utils/trackEvent";
import { animateSidebar } from "./SidebarContainer";

export const UpgradeSubscriptionView = (props: { pastLimit: boolean }) => {
	const [loading, setLoading] = createSignal(false);
	const products = () => getAppState().inAppPurchaseState.products;
	const loadingProducts = () => isNative && isEmpty(products());
	const requestProPlan = (annual: boolean) => {
		setLoading(true);
		trackEvent("upgrade.subscribe", {
			type: annual ? "annual" : "monthly",
		});
		quick((s) => {
			if (isNative) {
				const product =
					products()[
						annual ? PRODUCT_CHESSBOOK_ANNUAL : PRODUCT_CHESSBOOK_MONTHLY
					];
				product
					.getOffer()!
					.order()
					.catch(() => {
						quick((s) => {
							s.repertoireState.ui.popView();
							animateSidebar("left");
						});
					})
					.then((x) => {
						quick((s) => {
							s.userState.user!.subscribed = true;
							s.repertoireState.ui.popView();
							animateSidebar("left");
						});
					});
			} else {
				s.userState.getCheckoutLink(annual).then((url) => {
					window.location.href = url;
				});
			}
		});
	};
	onMount(() => {
		trackEvent("upgrade.shown");
	});
	const bullets = ["Cancel any time (and keep any moves you've added"];
	return (
		<SidebarTemplate
			actions={
				loading() || loadingProducts()
					? []
					: [
							{
								onPress: () => {
									requestProPlan(false);
								},
								text: "Upgrade to Chessbook Pro - Monthly",
								subtext: isNative
									? `${
											products()[PRODUCT_CHESSBOOK_MONTHLY].pricing!.price
									  }/month`
									: "$5/month",
								style: "primary",
							},
							{
								onPress: () => {
									requestProPlan(true);
								},
								text: "Upgrade to Chessbook Pro - Annual",
								subtext: isNative
									? `${
											products()[PRODUCT_CHESSBOOK_ANNUAL].pricing!.price
									  }/year (save ${Math.round(
											(1 -
												products()[PRODUCT_CHESSBOOK_ANNUAL].pricing!
													.priceMicros /
													(products()[PRODUCT_CHESSBOOK_MONTHLY].pricing!
														.priceMicros *
														12)) *
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
