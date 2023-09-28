import { quick } from "~/utils/app_state";
export const PRODUCT_CHESSBOOK_PRO_MONTHLY = "pro.monthly";
export const PRODUCT_CHESSBOOK_PRO_ANNUAL = "pro.annual";
import { isServer } from "solid-js/web";
import client from "./client";

export type InAppProductId =
	| typeof PRODUCT_CHESSBOOK_PRO_MONTHLY
	| typeof PRODUCT_CHESSBOOK_PRO_ANNUAL;

export namespace InAppPurchases {
	export async function loadProducts() {
		await import("cordova-plugin-purchase");
    console.log({CdvPurchase});

		const { store } = CdvPurchase;

		store.register([
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_PRO_MONTHLY,
				platform: CdvPurchase.Platform.APPLE_APPSTORE,
			},
			{
				type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
				id: PRODUCT_CHESSBOOK_PRO_ANNUAL,
				platform: CdvPurchase.Platform.APPLE_APPSTORE,
			},
		]);
		store
			.when()
			.productUpdated((x) => {
        console.log("updated? ", x)
				quick((s) => {
					s.inAppPurchaseState.products[x.id as InAppProductId] = x;
				});
			})
			.approved((x) => x.verify())
      .verified((x) => x.finish())
      .finished((x) => {
        const {transactionId, products, platform, currency, purchaseId, amountMicros, parentReceipt} = x
				client.post("/api/apple/purchase", {
          transactionId,
          products,
          platform,
          currency,
          purchaseId,
          amountMicros,
          receipt: parentReceipt
        }).then(({data}) => {
          if (data?.user) {
            quick((s) => {
              s.userState.handleAuthResponse(data)
            })
          }
        })
      })

		store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
	}
}
