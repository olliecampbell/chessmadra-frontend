import Cookies from "js-cookie";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { AuthStatus } from "~/utils/user_state";
import { useAppState, quick, useSidebarState } from "~/utils/app_state";
import { BP, useResponsive } from "~/utils/useResponsive";
import { JWT_COOKIE_KEY, TEMP_USER_UUID } from "~/utils/auth";
import { Pressable } from "./Pressable";
import { trackEvent } from "~/utils/trackEvent";
import { useHovering } from "~/mocks";
import { createEffect, Match, Show, Switch } from "solid-js";

export const SettingsButtons = () => {
  console.log("SettingsButtons");
  const [user, ratingDescription, authStatus] = useAppState((s) => [
    s.userState.user,
    s.userState.getUserRatingDescription(),
    s.userState.authStatus,
  ]);
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const needsLogin = () =>
    authStatus() === AuthStatus.Unauthenticated ||
    (authStatus() === AuthStatus.Authenticated && user()?.temporary);
  createEffect(() => {
    console.log("needsLogin:", needsLogin(), authStatus());
  });
  const responsive = useResponsive();
  return (
    <div style={s(c.row, c.gap(responsive.switch(12, [BP.md, 16])))}>
      <Show when={mode() === "home" && false}>
        <SettingButton
          title={"Other tools"}
          icon={"fa-sharp fa-bars"}
          onPress={() => {
            quick((s) => {
              trackEvent("top_buttons.other_tools.clicked");
              s.navigationState.push("/directory");
            });
          }}
        />
      </Show>
      <Switch>
        <Match when={needsLogin()}>
          <SettingButton
            title={"Log in"}
            icon={"fa-sharp fa-user"}
            onPress={() => {
              quick((s) => {
                trackEvent("top_buttons.log_in.clicked");
                s.navigationState.push("/login");
              });
            }}
          />
        </Match>
        <Match when={!needsLogin()}>
          <SettingButton
            title={"Log out"}
            icon={"fa-sharp fa-sign-out-alt"}
            onPress={() => {
              quick((s) => {
                trackEvent("top_buttons.log_out.clicked");
                Cookies.remove(JWT_COOKIE_KEY);
                Cookies.remove(TEMP_USER_UUID);
                window.location.reload();
              });
            }}
          />
        </Match>
      </Switch>
    </div>
  );
};

export const SettingButton = (props) => {
  const { hovering, hoveringProps } = useHovering();
  const responsive = useResponsive();
  let color = () => {
    if (hovering()) {
      return c.colors.textSecondary;
    }
    return c.colors.textTertiary;
  };
  return (
    <Pressable
      onPress={props.onPress}
      style={s(
        c.row,
        c.alignCenter,
        c.px(responsive.switch(0, [BP.md, 8])),
        c.mx(responsive.switch(0, [BP.md, -8])),
        c.py(8)
        // c.bg(hovering ? c.grays[14] : c.grays[6])
      )}
      {...hoveringProps}
    >
      <i style={s(c.fg(color()), c.fontSize(12))} class={props.icon}></i>
      <Spacer width={responsive.switch(4, [BP.md, 8])} />
      <CMText style={s(c.fg(color()), c.weightSemiBold)}>{props.title}</CMText>
    </Pressable>
  );
};
