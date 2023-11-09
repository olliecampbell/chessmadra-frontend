import { quick } from "~/utils/app_state";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS = "chessbook_pro.monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS = "chessbook_pro.annual";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY_ANDROID = "chessbook-pro-monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL_ANDROID = "chessbook-pro-annual";
import client from "./client";
import { isIos } from "./env";

export type InAppProductId =
	| typeof PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS
	| typeof PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS
	| typeof PRODUCT_CHESSBOOK_PRO_MONTHLY_ANDROID
	| typeof PRODUCT_CHESSBOOK_PRO_ANNUAL_ANDROID;

const getSubscription = (period: "monthly" | "annual"): InAppProductId => {
	if (isIos) {
		return period === "monthly"
			? PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS
			: PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS;
	} else {
		return period === "monthly"
			? PRODUCT_CHESSBOOK_PRO_MONTHLY_ANDROID
			: PRODUCT_CHESSBOOK_PRO_ANNUAL_ANDROID;
	}
};

export const PRODUCT_CHESSBOOK_MONTHLY = getSubscription("monthly");
export const PRODUCT_CHESSBOOK_ANNUAL = getSubscription("annual");

const ALL_PRODUCTS = [getSubscription("monthly"), getSubscription("annual")];

export namespace InAppPurchases {
	export async function loadProducts() {
		// @ts-ignore
		await import("cordova-plugin-purchase");
		console.log({ CdvPurchase });

		const { store } = CdvPurchase;
		const platform = isIos
			? CdvPurchase.Platform.APPLE_APPSTORE
			: CdvPurchase.Platform.GOOGLE_PLAY;

		store.register([
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_MONTHLY,
				platform: platform,
			},
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_ANNUAL,
				platform: platform,
			},
		]);
		store
			.when()
			.productUpdated((x) => {
				console.log("updated? ", x);
				quick((s) => {
					s.inAppPurchaseState.products[x.id as InAppProductId] = x;
				});
			})
			.approved((x) => {
				console.log("approved?", x);
				const productId = x.products[0].id as InAppProductId;
				if (ALL_PRODUCTS.includes(productId)) {
					x.verify();
				}
			})
			.verified((x) => x.finish())
			.finished((x) => {
				const {
					transactionId,
					products,
					platform,
					currency,
					purchaseId,
					amountMicros,
					parentReceipt,
				} = x;
				client
					.post("/api/apple/purchase", {
						transactionId,
						products,
						platform,
						currency,
						purchaseId,
						amountMicros,
						receipt: parentReceipt,
					})
					.then(({ data }) => {
						if (data?.user) {
							quick((s) => {
								s.userState.handleAuthResponse(data);
							});
						}
					});
			});

		store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
	}
}
