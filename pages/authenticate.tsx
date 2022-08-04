import client from "app/client";
import { View, Text } from "react-native";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { AuthStatus as GlobalAuthStatus, AppStore } from "app/store";
import { PageContainer } from "app/components/PageContainer";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { CMText } from "app/components/CMText";

enum AuthStatus {
  Initial,
  Loading,
  Failed,
  SuccessWaiting,
  Success,
}

const Authenticate = (props) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Initial);
  const router = useRouter();
  const { t } = router.query;
  useEffect(() => {
    if (t && authStatus === AuthStatus.Initial) {
      setAuthStatus(AuthStatus.Loading);
      (async () => {
        client
          .post("/api/authenticate", {
            token: t,
          })
          .then(({ data }) => {
            let { token, user } = data as any;
            AppStore.update((s) => {
              s.auth.token = token;
              s.auth.user = user;
              s.auth.authStatus = GlobalAuthStatus.Authenticated;
            });
            setAuthStatus(AuthStatus.SuccessWaiting);
            setTimeout(() => {
              router.push("/");
            }, 1000);
          })
          .catch((e) => {
            console.log("e:", e);
            setAuthStatus(AuthStatus.Failed);
          });
      })();
    }
  });
  return (
    <PageContainer centered>
      <View style={s(c.column, c.alignCenter)}>
        {authStatus === AuthStatus.Failed ? null : (
          <BeatLoader color={c.grays[100]} size={20} />
        )}
        <Spacer height={12} />
        <CMText
          style={s(
            c.weightSemiBold,
            c.fontSize(18),
            c.fg(c.colors.textSecondary)
          )}
        >
          {authStatus === AuthStatus.SuccessWaiting ? (
            "Redirecting..."
          ) : authStatus === AuthStatus.Failed ? (
            <>
              Failed to authenticate. Your link may have expired. Try{" "}
              <Link href="/login">
                <a>
                  <CMText
                    style={s(c.clickable, c.weightBold, c.fg(c.primaries[60]))}
                  >
                    logging in again
                  </CMText>
                </a>
              </Link>
              .
            </>
          ) : (
            "Authenticating..."
          )}
        </CMText>
      </View>
    </PageContainer>
  );
};

export default Authenticate;
