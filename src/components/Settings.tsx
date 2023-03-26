import { Modal } from "./Modal";
import Cookies from "js-cookie";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "~/components/Space";
import { AuthStatus, getRecommendedMissThreshold } from "~/utils/user_state";
import {
  getAppState,
  useAppState,
  useUserState,
  quick,
  useSidebarState,
} from "~/utils/app_state";
import { BP, useResponsive } from "~/utils/useResponsive";
import { cloneDeep } from "lodash-es";
import { SidebarSetting } from "./SidebarSettings";
import { clearCookies, JWT_COOKIE_KEY, TEMP_USER_UUID } from "~/utils/auth";
import { View } from "./View";
import { Pressable } from "./Pressable";
import { trackEvent } from "~/utils/trackEvent";
import { useHovering } from "~/mocks";
import { Show } from "solid-js";

export const SettingsButtons = () => {
  const [user, ratingDescription, authStatus] = useAppState((s) => [
    s.userState.user,
    s.userState.getUserRatingDescription(),
    s.userState.authStatus,
  ]);
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const needsLogin =
    authStatus === AuthStatus.Unauthenticated ||
    (authStatus === AuthStatus.Authenticated && user?.temporary);
  let responsive = useResponsive();
  return (
    <div style={s(c.row, c.gap(responsive.switch(12, [BP.md, 16])))}>
      <Show when={mode() === "home"}>
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
      {needsLogin ? (
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
      ) : (
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
      )}
    </div>
  );
};

export const SettingButton = ({ title, icon, onPress }) => {
  const { hovering, hoveringProps } = useHovering();
  let responsive = useResponsive();
  let color = c.colors.textTertiary;
  if (hovering) {
    color = c.colors.textSecondary;
  }
  return (
    <Pressable
      onPress={onPress}
      style={s(
        c.row,
        c.alignCenter,
        c.px(responsive.switch(0, [BP.md, 8])),
        c.py(8)
        // c.bg(hovering ? c.grays[14] : c.grays[6])
      )}
      {...hoveringProps}
    >
      <i style={s(c.fg(color), c.fontSize(12))} className={icon}></i>
      <Spacer width={responsive.switch(4, [BP.md, 8])} />
      <CMText style={s(c.fg(color), c.weightSemiBold)}>{title}</CMText>
    </Pressable>
  );
};
