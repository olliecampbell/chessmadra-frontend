// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { Button } from "~/components/Button";
import { useIsMobileV2 } from "~/utils/isMobile";
import { Puff } from "solid-spinner";
import { CMText } from "./CMText";
import { quick, useAppState } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { CMTextInput } from "./CMTextInput";
import { isNil } from "lodash-es";
import { createSignal, JSXElement } from "solid-js";
import { A } from "solid-start";

export const AdminPageLayout = (props: { children: JSXElement }) => {
  const isMobile = useIsMobileV2();
  const [password, setPassword] = createSignal("");
  const [authStatus, user] = useAppState((s) => [
    s.userState.authStatus,
    s.userState.user,
  ]);
  const _inner = () => {
    let inner = props.children;
    if (
      authStatus() === AuthStatus.Initial ||
      authStatus() === AuthStatus.Authenticating
    ) {
      inner = <Puff color={c.gray[100]} />;
    }
    console.log("user email", user);
    if (user && isNil(user()?.email)) {
      inner = (
        <div style={s()}>
          <CMText style={s()}>
            Looks like you're not logged in, go
            <CMText style={s(c.fg(c.blue[55]), c.weightSemiBold, c.px(4))}>
              <A href="/login">log in</A>
            </CMText>
            first and then come back here:{" "}
          </CMText>
        </div>
      );
    } else if (user && !user()?.isAdmin) {
      inner = (
        <div style={s(c.oldContainerStyles(isMobile()))}>
          <CMText style={s()}>
            You don't seem to be an admin. Do you have the password?
          </CMText>
          <Spacer height={12} />
          <CMTextInput
            value={password()}
            setValue={setPassword}
            style={s()}
            placeholder="Password"
          />
          <Spacer height={12} />
          <Button
            style={s()}
            onPress={() => {
              quick((s) => {
                s.adminState.becomeAdmin(password());
              });
            }}
          >
            Become admin
          </Button>
        </div>
      );
    }
    return inner;
  };
  return (
    <div style={s(c.oldContainerStyles(isMobile()), c.pt(48), c.px(24))}>
      {_inner()}
    </div>
  );
};
