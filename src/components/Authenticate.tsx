import client from "~/utils/client";
import { View } from "react-native";
import React, { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { AuthStatus as GlobalAuthStatus } from "~/utils/user_state";
import { PageContainer } from "~/components/PageContainer";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "~/components/CMText";
import { Link, useSearchParams } from "react-router-dom";
import { useAppState } from "~/utils/app_state";
import { useTrack } from "~/hooks/useTrackEvent";

enum AuthStatus {
  Initial,
  Loading,
  Failed,
  SuccessWaiting,
  Success,
}

const Authenticate = (props) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Initial);
  const [searchParams, setSearchParams] = useSearchParams();
  const [navigate] = useAppState((s) => [s.navigationState.push]);
  const track = useTrack();
  const [user, quick] = useAppState((s) => [
    s.userState.user,
    s.userState.quick,
  ]);
  let t = searchParams.get("t");
  useEffect(() => {
    if (t && authStatus === AuthStatus.Initial) {
      setAuthStatus(AuthStatus.Loading);
      (async () => {
        client
          .post("/api/authenticate", {
            token: t,
          })
          .then(({ data }) => {
            let { token, user, firstAuthentication } = data as any;

            if (firstAuthentication) {
              track("login.first_login");
            }
            quick((s) => {
              s.token = token;
              s.setUser(user);
              s.authStatus = GlobalAuthStatus.Authenticated;
            });
            track("login.authenticated");
            setAuthStatus(AuthStatus.SuccessWaiting);
            setTimeout(() => {
              navigate("/", { removeParams: true });
            }, 1000);
          })
          .catch((e) => {
            console.log("e:", e);
            track("login.auth_failed");
            setAuthStatus(AuthStatus.Failed);
          });
      })();
    }
  }, [t]);
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
              <Link to="/login">
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
