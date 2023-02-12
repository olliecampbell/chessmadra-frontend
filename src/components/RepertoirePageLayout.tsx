import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import { useAppState, useRepertoireState, quick } from "app/utils/app_state";
import React, { useEffect, useRef, useState } from "react";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { GridLoader } from "react-spinners";
import { Spacer } from "app/Space";
import { Helmet } from "react-helmet";
import { BP, useResponsive } from "app/utils/useResponsive";
import { useOutsideClick } from "app/components/useOutsideClick";
import { ProfileModal } from "./ProfileModal";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { SideSettingsModal } from "./SideSettingsModal";
import { Link } from "react-router-dom";
import { AuthStatus } from "app/utils/user_state";

export const RepertoirePageLayout = ({
  children,
  bottom,
  centered,
  fullHeight,
  flushTop,
  naked,
  lighterBackground,
}: {
  children: any;
  bottom?: any;
  flushTop?: boolean;
  lighterBackground?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
  naked?: boolean;
}) => {
  const isMobile = useIsMobile();
  let [repertoireLoading, initState] = useRepertoireState((s) => [
    s.repertoire === undefined,
    s.initState,
  ]);

  useEffect(() => {
    if (repertoireLoading) {
      initState();
    }
  }, []);
  const [user, ratingDescription, authStatus] = useAppState((s) => [
    s.userState.user,
    s.userState.getUserRatingDescription(),
    s.userState.authStatus,
  ]);
  const needsLogin =
    authStatus === AuthStatus.Unauthenticated ||
    (authStatus === AuthStatus.Authenticated && user?.temporary);
  const navColor = c.grays[90];
  const backgroundColor = c.grays[6];
  const responsive = useResponsive();
  const shortUserUI = responsive.bp < BP.md;
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(backgroundColor),
        c.grow,
        s(c.minHeight("100vh"))
      )}
    >
      <Helmet>
        <meta name="theme-color" content={backgroundColor} />
      </Helmet>
      <ProfileModal />
      <ShareRepertoireModal />
      <SideSettingsModal />
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <View
        style={s(
          isMobile ? s(c.grow) : c.flexShrink(1),
          centered && c.grow,
          fullHeight && c.grow,
          repertoireLoading && c.grow
        )}
      >
        <>
          {repertoireLoading ? (
            <View style={s(c.grow, c.center)}>
              <GridLoader color={c.purples[55]} size={20} />
            </View>
          ) : (
            <View
              style={s(
                !isMobile && s(c.scrollY),
                isMobile && s(c.grow),
                c.center,
                c.justifyStart,
                c.flexShrink(1),
                fullHeight && s(c.grow),
                !flushTop && !naked && c.pt(isMobile ? 24 : 48),
                centered && s(c.grow, c.justifyCenter)
              )}
            >
              <View
                style={s(
                  !fullHeight && c.pb(isMobile ? 92 : 180),
                  c.center,
                  c.fullWidth,
                  fullHeight && c.grow
                )}
              >
                {children}
              </View>
            </View>
          )}
        </>
      </View>
      {repertoireLoading ? null : bottom}
    </View>
  );
};

export const NavDropdown = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);
  useOutsideClick(ref, (e) => {
    if (isOpen) {
      setIsOpen(false);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  return (
    <Pressable
      ref={ref}
      style={s(c.row, c.alignCenter, c.noUserSelect)}
      onPress={() => {
        setIsOpen(!isOpen);
      }}
    >
      <CMText style={s(c.weightSemiBold)}>{title}</CMText>
      <Spacer width={4} />
      <i
        className="fas fa-angle-down"
        style={s(c.fontSize(14), c.fg(c.grays[40]))}
      />
      <Animated.View
        style={s(
          c.absolute,
          c.opacity(fadeAnim),
          !isOpen && c.noPointerEvents,
          // c.right(c.min(c.calc("100vw - 24px"), 20)),
          c.zIndex(4),
          c.right(0),
          c.top("calc(100% + 8px)"),
          c.bg(c.grays[10]),
          c.br(4),
          c.cardShadow,
          c.px(12),
          c.py(12),
          c.minWidth(300)
        )}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
