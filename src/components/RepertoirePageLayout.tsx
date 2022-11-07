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
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { BP, useResponsive } from "app/utils/useResponsive";
import { SelectOneOf } from "./SelectOneOf";
import { useOutsideClick } from "app/components/useOutsideClick";
import { ProfileModal } from "./ProfileModal";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { SideSettingsModal } from "./SideSettingsModal";
import { Link } from "react-router-dom";
import { AuthStatus } from "app/utils/user_state";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";

export const RepertoirePageLayout = ({
  children,
  bottom,
  centered,
  fullHeight,
  flushTop,
  lighterBackground,
}: {
  children: any;
  bottom?: any;
  flushTop?: boolean;
  lighterBackground?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
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
  const backgroundColor = c.grays[10];
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
      <DeleteMoveConfirmationModal />
      <ProfileModal />
      <ShareRepertoireModal />
      <SideSettingsModal />
      <ConfirmMoveConflictModal />
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
        <View
          style={s(
            c.fullWidth,
            c.height(64),
            c.bg(navColor),
            c.lightCardShadow,
            c.zIndex(10)
            // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
          )}
        >
          <View
            style={s(
              c.containerStyles(responsive.bp),
              c.alignEnd,
              c.justifyBetween,
              c.row,
              c.fullHeight,
              c.alignCenter,
              c.pt(4)
            )}
          >
            <RepertoireNavBreadcrumbs />
            <Spacer width={12} grow />
            <Pressable
              style={s(c.row, c.alignCenter)}
              onPress={() => {
                quick((s) => {
                  s.userState.profileModalOpen = true;
                });
              }}
            >
              {needsLogin ? (
                <Link to="/login">
                  <CMText
                    style={s(
                      c.mr(8),
                      c.clickable,
                      c.br(4),
                      // c.fg(c.primaries[70]),
                      c.weightBold,
                      c.fontSize(isMobile ? 14 : 16)
                    )}
                  >
                    Log in
                  </CMText>
                </Link>
              ) : (
                !shortUserUI && (
                  <>
                    <CMText
                      style={s(
                        c.weightSemiBold,
                        c.fg(c.grays[20]),
                        c.fontSize(14)
                      )}
                    >
                      {ratingDescription}
                    </CMText>
                    <Spacer width={12} />
                  </>
                )
              )}

              <span
                style={s(c.fontSize(shortUserUI ? 14 : 18))}
                className={shortUserUI ? `fa-stack` : ""}
              >
                {shortUserUI && (
                  <i
                    style={s(c.fg(c.grays[20]))}
                    className="fa fa-circle fa-stack-2x"
                  />
                )}
                <i
                  style={s(
                    c.fg(c.grays[shortUserUI ? 80 : 20]),
                    c.fontSize(shortUserUI ? 14 : 18)
                  )}
                  className={`fa-sharp fa-user ${
                    shortUserUI ? "fa-stack-1x" : ""
                  }`}
                ></i>
              </span>
            </Pressable>
          </View>
        </View>
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
              !flushTop && c.pt(isMobile ? 24 : 48),
              centered && s(c.grow, c.justifyCenter)
            )}
          >
            <View
              style={s(
                !fullHeight && c.pb(isMobile ? 92 : 180),
                c.center,
                fullHeight && c.grow
              )}
            >
              {children}
            </View>
            {isMobile && <Spacer height={100} />}
          </View>
        )}
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

export const RepertoireNavBreadcrumbs = () => {
  const [breadcrumbs] = useRepertoireState((s) => [s.breadcrumbs]);
  const responsive = useResponsive();
  return (
    <View style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth)}>
      {intersperse(
        breadcrumbs.map((breadcrumb, i) => {
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              style={s(breadcrumb.onPress ? c.clickable : c.unclickable)}
              onPress={() => {
                breadcrumb.onPress?.();
              }}
            >
              <View style={s()}>
                <CMText
                  style={s(
                    breadcrumb.onPress ? c.weightHeavy : c.weightSemiBold,
                    c.fg(c.colors.textInverse)
                  )}
                >
                  {breadcrumb.text}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <View key={i} style={s(c.mx(responsive.switch(6, [BP.lg, 8])))}>
              <CMText style={s(c.fg(c.grays[30]))}>
                <i className="fa-light fa-angle-right" />
              </CMText>
            </View>
          );
        }
      )}
    </View>
  );
};
