import { PushNotifications } from "@capacitor/push-notifications";
import { getAppState } from "./app_state";

export namespace Notifications {
	export const addListeners = async () => {
		await PushNotifications.addListener("registration", (token) => {
			console.log("Got a device token!");
			// todo: don't send if same as current token
			getAppState().userState.updateUserSettings({
				iosDeviceToken: token.value,
			});
		});

		await PushNotifications.addListener("registrationError", (err) => {
			console.error("Registration error: ", err.error);
		});

		await PushNotifications.addListener(
			"pushNotificationReceived",
			(notification) => {
				console.log("Push notification received: ", notification);
			},
		);

		await PushNotifications.addListener(
			"pushNotificationActionPerformed",
			(notification) => {
				console.log(
					"Push notification action performed",
					notification.actionId,
					notification.inputValue,
				);
			},
		);
	};

	export const registerNotifications = async () => {
		let permStatus = await PushNotifications.checkPermissions();

		if (permStatus.receive === "prompt") {
			permStatus = await PushNotifications.requestPermissions();
		}

		if (permStatus.receive !== "granted") {
			throw new Error("User denied permissions!");
		}

		await PushNotifications.register();
	};

	const getDeliveredNotifications = async () => {
		const notificationList =
			await PushNotifications.getDeliveredNotifications();
		console.log("delivered notifications", notificationList);
	};
}
