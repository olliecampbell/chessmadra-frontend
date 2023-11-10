import { CapacitorConfig } from "@capacitor/cli";

const server: CapacitorConfig["server"] = {
	androidScheme: "https",
} as object;
console.log("Env?: ", process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
	// const interfaces = networkInterfaces();
	// const ip = interfaces.eth0[0].address;
	//
	// console.log("IP: ", ip);
	// server = {
	// 	url: `http://${ip}:3000`,
	// 	cleartext: true,
	// };
} else {
	// server.url = "https://chessbook.com";
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
