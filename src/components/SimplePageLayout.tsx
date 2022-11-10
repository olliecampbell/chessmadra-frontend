import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import {
  getAppState,
  useAppState,
  useRepertoireState,
  quick,
} from "app/utils/app_state";
import React, { useEffect, useRef, useState } from "react";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { BeatLoader, GridLoader } from "react-spinners";
import { Spacer } from "app/Space";
import { Helmet } from "react-helmet";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { BP, useResponsive } from "app/utils/useResponsive";
import { SelectOneOf } from "./SelectOneOf";
import { useOutsideClick } from "app/components/useOutsideClick";
import { ProfileModal } from "./ProfileModal";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { SideSettingsModal } from "./SideSettingsModal";
import { Link } from "react-router-dom";
import { AuthStatus } from "app/utils/user_state";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";

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
