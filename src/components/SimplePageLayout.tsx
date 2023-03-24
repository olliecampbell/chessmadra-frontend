import { View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { useIsMobile } from "~/utils/isMobile";
import { useAppState } from "~/utils/app_state";
import React from "react";
import { AuthStatus } from "~/utils/user_state";

export const SimplePageLayout = ({ children }: { children: any }) => {
  const isMobile = useIsMobile();
  const [user, authStatus] = useAppState((s) => [
    s.userState.user,
    s.userState.authStatus,
  ]);
  const needsLogin =
    authStatus === AuthStatus.Unauthenticated ||
    (authStatus === AuthStatus.Authenticated && user?.temporary);
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(c.grays[10]),
        c.grow,
        c.center,
        s(c.minHeight("100vh"))
      )}
    >
      {children}
    </View>
  );
};
