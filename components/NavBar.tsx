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
import { useHasBetaAccess } from "app/utils/useHasBetaAccess";

export const navItems = [
  {
    path: "/visualization",
    title: "Visualization",
    description: (
      <>
        Visualize a series of moves, then find the tactic at the end. Carefully
        curated to only feature strong play from "your" side. Calculation,
        visualization, intuition, this trains a bit of everything. Adjustable
        puzzle difficulty and visualization depth. 150,000+ puzzles.
      </>
    ),
  },
  {
    path: "/the_climb",
    title: "The Climb",
    description: (
      <>
        Exactly like the visualization trainer, but with each solved puzzle the
        visualization and puzzle difficulty will increase. Solve puzzles quickly
        to get more points!
      </>
    ),
  },
  {
    path: "/blunder_recognition",
    title: "Blunder Spotting",
    description: (
      <>
        Get better at spotting your opponent's threats and avoiding mistakes, by
        determining whether a move is a blunder or not. Adjustable difficulty,
        10,000+ positions.
      </>
    ),
  },
  {
    path: "/color_trainer",
    title: "Colors",
    description: (
      <>
        Quick, what color is a4? This little tool might help you get better at
        color awareness. Identify the color of each square as quickly as you
        can.
      </>
    ),
  },
  // {
  //   path: "/openings",
  //   title: "Opening Builder",
  // },
  {
    path: "/game-memorization",
    title: "Game Memorization",
    beta: true,
    description: <>TODO</>,
  },
  {
    path: "/games-search",
    title: "Game Search",
    description: (
      <>
        Searching for high-level games in your chosen opening can be very
        educational. Search through over 5 million lichess games, by player
        rating, opening, game result, and game length.
      </>
    ),
  },
  {
    path: "/blindfold",
    title: "Blindfold Tactics",
    description: (
      <>
        Get better at visualizing the board in your head. These puzzles will
        only tell you where the pieces are, but without putting it on a board.
        Find the right continuation, then solve it on the board.
      </>
    ),
  },
];
export const NavBar = (props: {}) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const authStatus = AppStore.useState((s) => s.auth.authStatus);
  const padding = 16;
  const hasBetaAccess = useHasBetaAccess();
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
        <Link href="/">
          <Text style={s(c.fontSize(18), c.clickable, c.px(12), c.py(12))}>
            <i
              style={s(c.fg(c.colors.textSecondary))}
              className="fas fa-house"
            ></i>
          </Text>
        </Link>
        <Spacer width={12} />
        {intersperse(
          navItems
            .filter((n) => !n.beta || hasBetaAccess)
            .map((navItem) => {
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
            return (
              <View
                style={s(c.width(1), c.height(34), c.bg(c.grays[30]), c.mx(12))}
              ></View>
            );
          }
        )}
        {true && (
          <View
            style={
              s(c.pl(24))
              // c.absolute,
              // c.top("50%"),
              // c.transform("translate(0%, -50%)"),
              // c.right(padding)
            }
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
            {/*authStatus === AuthStatus.Authenticated && (
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
            )*/}
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
          navItems
            .filter((n) => !n.beta || hasBetaAccess)
            .map((navItem) => {
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
