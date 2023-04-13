import client from "~/utils/client";
import { AuthStatus as GlobalAuthStatus } from "~/utils/user_state";
import { PageContainer } from "~/components/PageContainer";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "~/components/CMText";
import { quick } from "~/utils/app_state";
import { A, useSearchParams } from "solid-start";
import { trackEvent } from "~/utils/trackEvent";
import { createEffect, createSignal } from "solid-js";
import { Puff } from "solid-spinner";

enum AuthStatus {
  Initial,
  Loading,
  Failed,
  SuccessWaiting,
  Success,
}

const Authenticate = (props) => {
  const [authStatus, setAuthStatus] = createSignal(AuthStatus.Initial);
  const [searchParams] = useSearchParams();
  createEffect(() => {
    const t = searchParams.t;
    if (t && authStatus() === AuthStatus.Initial) {
      setAuthStatus(AuthStatus.Loading);
      (async () => {
        client
          .post("/api/authenticate", {
            token: t,
          })
          .then(({ data }) => {
            const { token, user, firstAuthentication } = data as any;

            if (firstAuthentication) {
              trackEvent("login.first_login");
            }
            quick((s) => {
              const userState = s.userState;
              userState.token = token;
              userState.setUser(user);
              userState.authStatus = GlobalAuthStatus.Authenticated;
            });
            trackEvent("login.authenticated");
            setAuthStatus(AuthStatus.SuccessWaiting);
            setTimeout(() => {
              quick((s) => {
                s.navigationState.push("/", { removeParams: true });
              });
            }, 1000);
          })
          .catch((e) => {
            trackEvent("login.auth_failed");
            setAuthStatus(AuthStatus.Failed);
          });
      })();
    }
  });
  return (
    <PageContainer centered>
      <div style={s(c.column, c.alignCenter)}>
        {authStatus() === AuthStatus.Failed ? null : (
          <Puff color={c.primaries[65]} />
        )}
        <Spacer height={12} />
        <CMText
          style={s(
            c.weightSemiBold,
            c.fontSize(18),
            c.fg(c.colors.textSecondary)
          )}
        >
          {authStatus() === AuthStatus.SuccessWaiting ? (
            "Redirecting..."
          ) : authStatus() === AuthStatus.Failed ? (
            <>
              Failed to authenticate. Your link may have expired. Try{" "}
              <A href="/login">
                <CMText
                  style={s(c.clickable, c.weightBold, c.fg(c.primaries[60]))}
                >
                  logging in again
                </CMText>
              </A>
              .
            </>
          ) : (
            "Authenticating..."
          )}
        </CMText>
      </div>
    </PageContainer>
  );
};

export default Authenticate;
