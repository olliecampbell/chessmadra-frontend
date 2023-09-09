import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chessbook",
  appName: "Chessbook",
  webDir: "dist",
  server: {
    androidScheme: "https",
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
