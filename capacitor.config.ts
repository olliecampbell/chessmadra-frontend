import { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

let server: CapacitorConfig["server"] = {
	androidScheme: "https",
} as object;
if (process.env.DEV) {
	const interfaces = networkInterfaces();
	const ip = interfaces.eth0[0].address;

	console.log("IP: ", ip);
	server = {
		url: `http://${ip}:3000`,
		cleartext: true,
	};
}

const config: CapacitorConfig = {
	appId: "com.chessbook",
	appName: "Chessbook",
	backgroundColor: "#131516",
	webDir: "dist",
	server,
	plugins: {
		PushNotifications: {
			presentationOptions: ["sound", "alert"],
		},
	},
	// plugins: {
	//   SplashScreen: {
	//     launchShowDuration: 500,
	//     launchAutoHide: true,
	//     launchFadeOutDuration: 3000,
	//     backgroundColor: "#ffffffff",
	//     androidSplashResourceName: "splash",
	//     androidScaleType: "CENTER_CROP",
	//     showSpinner: true,
	//     androidSpinnerStyle: "large",
	//     iosSpinnerStyle: "small",
	//     spinnerColor: "#999999",
	//     splashFullScreen: true,
	//     splashImmersive: true,
	//     layoutName: "launch_screen",
	//     useDialog: true,
	//   },
	// },
};

export default config;
