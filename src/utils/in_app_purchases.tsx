import { quick } from "~/utils/app_state";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS = "chessbook_pro.monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS = "chessbook_pro.annual";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY_ANDROID = "chessbook-pro-monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL_ANDROID = "chessbook-pro-annual";
import client from "./client";

export type InAppProductId =
	| typeof PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS
	| typeof PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS;

const PRODUCTS = [
	PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS,
	PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS,
];

export namespace InAppPurchases {
	export async function loadProducts() {
		// @ts-ignore
		await import("cordova-plugin-purchase");
		console.log({ CdvPurchase });

		const { store } = CdvPurchase;

		store.register([
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_PRO_MONTHLY_IOS,
				platform: CdvPurchase.Platform.APPLE_APPSTORE,
			},
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_PRO_ANNUAL_IOS,
				platform: CdvPurchase.Platform.APPLE_APPSTORE,
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
				const productId = x.products[0].id;
				if (PRODUCTS.includes(productId)) {
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
