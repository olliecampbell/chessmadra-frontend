import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import { useAppState } from "app/utils/app_state";
import React from "react";
import { AuthStatus } from "app/utils/user_state";

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
