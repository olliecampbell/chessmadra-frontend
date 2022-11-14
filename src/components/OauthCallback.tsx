import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { CMText } from "./CMText";
import { SimplePageLayout } from "./SimplePageLayout";
import { useSearchParams } from "react-router-dom";
import { GridLoader } from "react-spinners";
import client from "app/client";
import { LichessOauthData } from "app/utils/repertoire_state";

enum Stage {
  Initial,
  ObtainingAccessToken,
  FetchingLichessProfile,
  Redirecting,
}

export const OauthCallback = ({ type }: { type: "lichess" }) => {
  let [searchParams] = useSearchParams();
  let [stage, setStage] = useState(Stage.Initial);
  let oauthCode = searchParams.get("code");
  let lichessOauthData = useRef(
    JSON.parse(
      window.sessionStorage.getItem("lichess-oauth-data") ?? "{}"
    ) as LichessOauthData
  ).current;
  console.log({ lichessOauthData });
  useEffect(() => {
    if (stage === Stage.Initial && lichessOauthData) {
      client
        .post("https://lichess.org/api/token", {
          grant_type: "authorization_code",
          code: oauthCode,
          code_verifier: lichessOauthData.codeVerifier,
          // TODO: remove search params
          redirect_uri: lichessOauthData.redirectUri,
          client_id: lichessOauthData.clientId,
        })
        .then((data) => {
          console.log(data);
        });
    }
  }, [stage]);
  return (
    <SimplePageLayout>
      <View style={s(c.maxWidth(600), c.column, c.center)}>
        <CMText style={s(c.fontSize(18))}>Authenticating...</CMText>
        <Spacer height={24} />
        <GridLoader color={c.grays[80]} size={20} />
      </View>
    </SimplePageLayout>
  );
};
