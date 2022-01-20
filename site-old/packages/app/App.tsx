import React from "react";
import { Pressable, View } from "react-native";
// import { ChessboardView } from "./src/chessboard/Chessboard";
// import { ExchangeRates } from "app/ExchangeRate";
import { s, c } from "app/styles";
import { VisualizationTraining } from "app/components/VisualizationTraining";
import { Helmet } from "react-helmet";

const config = {
  screens: {
    AuthSuccess: "lichess_oauth_success",
  },
};

const linking = {
  prefixes: [],
  config,
};

// const Stack = createNativeStackNavigator();
// <Stack.Screen name="Streak" component={Streak} />

export default () => <>VisualizationTraining</>;
