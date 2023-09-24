import { quick } from "~/utils/app_state";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY = "pro.monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL = "pro.annual";
import { isServer } from "solid-js/web";

export type InAppProductId =
	| typeof PRODUCT_CHESSBOOK_PRO_MONTHLY
	| typeof PRODUCT_CHESSBOOK_PRO_ANNUAL;

export namespace InAppPurchases {
	export async function loadProducts() {
		const CdvPurchase = await import("cordova-plugin-purchase");
    console.log({CdvPurchase});

		const { store } = CdvPurchase;

		store.register([
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_PRO_MONTHLY,
				platform: CdvPurchase.Platform.APPLE_APPSTORE,
			},
		]);
		store
			.when()
			.productUpdated((x) => {
				quick((s) => {
					s.inAppPurchaseState.products[x.id as InAppProductId] = x;
				});
			})
			.approved((x) => {
				console.log("approved", x);
			});
		store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
	}
}
