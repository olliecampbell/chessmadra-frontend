// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { Puff } from "solid-spinner";
import { CMText } from "./CMText";
import { quick, useAppState } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { CMTextInput } from "./TextInput";
import { isNil } from "lodash-es";
import { createSignal } from "solid-js";
import { Link } from "solid-start";

export const AdminPageLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const [password, setPassword] = createSignal("");
  const [authStatus, user] = useAppState((s) => [
    s.userState.authStatus,
    s.userState.user,
  ]);
  let inner = children;
  if (
    authStatus() === AuthStatus.Initial ||
    authStatus() === AuthStatus.Authenticating
  ) {
    inner = <Puff color={c.grays[100]} size={20} />;
  }
  console.log("user email", user);
  if (user && isNil(user()?.email)) {
    inner = (
      <div style={s()}>
        <CMText style={s()}>
          Looks like you're not logged in, go
          <CMText style={s(c.fg(c.blues[55]), c.weightSemiBold, c.px(4))}>
            <Link href="/login">log in</Link>
          </CMText>
          first and then come back here:{" "}
        </CMText>
      </div>
    );
  } else if (user && !user()?.isAdmin) {
    inner = (
      <div style={s(c.oldContainerStyles(isMobile))}>
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
          style={s(c.buttons.primary)}
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

  return (
    <div style={s(c.oldContainerStyles(isMobile), c.center, c.pt(48))}>
      {inner}
    </div>
  );
};
