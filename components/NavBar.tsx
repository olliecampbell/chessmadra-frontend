import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import React, { useRef, useState } from "react";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { useRouter } from "next/router";
import { intersperse } from "app/utils/intersperse";
import { useIsMobile } from "../utils/isMobile";
import Link from "next/link";
import { AppStore, AuthStatus } from "app/store";
import KnightWhiteIcon from "./chessboard/pieces/KnightWhiteIcon";
import KnightBlackIcon from "./chessboard/pieces/KnightBlackIcon";
import { Button } from "./Button";
import { useOutsideClick } from "./useOutsideClick";
import { failOnTrue } from "../utils/test_settings";

const navItems = [
  {
    path: "/the_climb",
    title: "The Climb",
  },
  {
    path: "/blunder_recognition",
    title: "Blunder Spotting",
  },
  {
    path: "/",
    title: "Visualization",
  },
  {
    path: "/color_trainer",
    title: "Colors",
  },
  // {
  //   path: "/openings",
  //   title: "Opening Builder",
  // },
  {
    path: "/games-search",
    title: "Search Games",
  },
  {
    path: "/blindfold",
    title: "Blindfold Tactics",
  },
];
export const NavBar = (props: {}) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const authStatus = AppStore.useState((s) => s.auth.authStatus);
  const padding = 16;
  const mobileDrawerRef = useRef(null);
  useOutsideClick(mobileDrawerRef, () => {
    setMobileNavOpen(false);
  });
  if (!isMobile) {
    return (
      <View
        style={s(
          c.row,
          c.px(padding),
          c.alignCenter,
          c.justifyCenter,
          c.height(isMobile ? 64 : 72),
          c.relative
        )}
      >
        {intersperse(
          navItems.map((navItem) => {
            const isActive = router.asPath == navItem.path;
            return (
              <Pressable
                key={navItem.title}
                style={s(c.clickable)}
                onPress={() => {
                  router.push(navItem.path);
                }}
              >
                <Text
                  style={s(
                    c.fg(c.colors.textPrimary),
                    c.weightBold,
                    c.fontSize(isMobile ? 14 : 16),
                    c.pb(isMobile ? 2 : 4),
                    isActive && s(c.borderBottom(`2px solid ${c.grays[60]}`))
                  )}
                >
                  {navItem.title}
                </Text>
              </Pressable>
            );
          }),
          (i) => {
            return <Spacer key={i} width={isMobile ? 24 : 24} />;
          }
        )}
        {false && (
          <View
            style={s(
              c.absolute,
              c.top("50%"),
              c.transform("translate(0%, -50%)"),
              c.right(padding)
            )}
          >
            {authStatus === AuthStatus.Unauthenticated && (
              <Link href="/login">
                <Text
                  style={s(
                    c.buttons.basic,
                    c.bg(c.grays[20]),
                    c.px(12),
                    c.py(12),
                    c.br(4),
                    c.fg(c.primaries[70]),
                    c.weightBold,
                    c.fontSize(isMobile ? 14 : 16)
                  )}
                >
                  Log in / Register
                </Text>
              </Link>
            )}
            {authStatus === AuthStatus.Authenticated && (
              <Link href="/login">
                <View style={s(c.row, c.alignCenter)}>
                  <Text
                    style={s(
                      // c.buttons.basic,
                      // c.bg(c.grays[20]),
                      c.br(4),
                      c.fg(c.colors.textSecondary),
                      c.weightBold,
                      c.fontSize(12)
                    )}
                  >
                    Log Out
                  </Text>
                </View>
              </Link>
            )}
          </View>
        )}
      </View>
    );
  }
  const mobileDrawerWidth = 240;
  return (
    <>
      <View
        style={s(
          c.row,
          c.center,
          c.justifyStart,
          c.fullWidth,
          c.height(80),
          c.px(12)
        )}
      >
        <Button
          style={s(c.buttons.squareBasicButtons)}
          onPress={() => {
            setMobileNavOpen(true);
          }}
        >
          <i style={s(c.fg(c.colors.textInverse))} className="fas fa-bars"></i>
        </Button>
      </View>
      <View
        style={s(
          c.fixed,
          c.top(0),
          c.left(0),
          c.fullHeight,
          c.fullWidth,
          c.bg("black"),
          c.opacity(mobileNavOpen ? 40 : 0.0),
          c.transition("opacity"),
          c.noPointerEvents,
          c.zIndex(8)
        )}
      ></View>
      <View
        style={s(
          c.fixed,
          c.left(mobileNavOpen ? 0 : -mobileDrawerWidth),
          c.transition("left"),
          c.width(mobileDrawerWidth),
          c.bg(c.grays[80]),
          c.fullHeight,
          c.px(12),
          c.py(12),
          c.zIndex(10)
        )}
        ref={mobileDrawerRef}
      >
        {intersperse(
          navItems.map((navItem) => {
            const isActive = router.asPath == navItem.path;
            return (
              <Pressable
                key={navItem.title}
                style={s(c.clickable)}
                onPress={() => {
                  console.log("THIS?");
                  router.push(navItem.path);
                }}
              >
                <Text
                  style={s(
                    c.fg(c.colors.textInverse),
                    c.weightBold,
                    c.fontSize(18),
                    c.pb(isMobile ? 2 : 4),
                    isActive && s(c.borderBottom(`2px solid ${c.grays[60]}`)),
                    c.selfStart
                  )}
                >
                  {navItem.title}
                </Text>
              </Pressable>
            );
          }),
          (i) => {
            return <Spacer key={i} height={24} />;
          }
        )}
      </View>
    </>
  );
};
