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
import { CMText } from "./CMText";

export const OPENINGS_DESCRIPTION = `Create your own opening repertoire. Use spaced repetition to memorize it. Uses statistics from millions of games to find the biggest gaps in your repertoire.`;
export const CLIMB_DESCRIPTION = `Train your visualization! But with each solved puzzle the visualization and puzzle difficulty will increase. Solve puzzles quickly to get more points!`;
export const VISUALIZE_DESCRIPTION = `Visualize a series of moves, then find the tactic at the end. Strong play from both sides. Calculation, visualization, intuition; get a bit of everything. 150,000+ puzzles.`;
export const BLUNDER_DESCRIPTION =
  "Get better at identifying blunders, to avoid them in your own games. Adjustable difficulty. 100,000+ puzzles.";
export const COLOR_TRAINER_DESCRIPTION =
  "Quick, what color is a4? This little tool might help you get better at color awareness. Identify the color of each square as quickly as you can.";
export const GAME_SEARCH_DESCRIPTION =
  "Search for high-level games in your chosen openings. Over 5 million lichess games, searchable by player rating, opening, game result, and game length.";
export const BLINDFOLD_DESCRIPTION =
  "Get better at visualizing the board in your head. These puzzles will only tell you where the pieces are, without putting it on a board. Find the right continuation, then solve it on the board.";
export const navItems = [
  {
    path: "/openings",
    title: "Opening Builder",
    isNew: true,
    description: OPENINGS_DESCRIPTION,
  },
  {
    path: "/the_climb",
    title: "The Climb",
    description: CLIMB_DESCRIPTION,
  },
  {
    path: "/visualization",
    title: "Visualization",
    description: VISUALIZE_DESCRIPTION,
  },
  {
    path: "/blunder_recognition",
    title: "Blunder Spotting",
    description: BLUNDER_DESCRIPTION,
  },
  {
    path: "/color_trainer",
    title: "Colors",
    description: COLOR_TRAINER_DESCRIPTION,
  },
  {
    path: "/game-memorization",
    title: "Game Memorization",
    beta: true,
    description: <>TODO</>,
  },
  {
    path: "/games-search",
    title: "Game Search",
    description: GAME_SEARCH_DESCRIPTION,
  },
  {
    path: "/blindfold",
    title: "Blindfold Tactics",
    description: BLINDFOLD_DESCRIPTION,
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
  useOutsideClick(mobileDrawerRef, (e) => {
    setMobileNavOpen(false);
    e.preventDefault();
    e.stopPropagation();
    return false;
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
          <a>
            <CMText style={s(c.fontSize(18), c.clickable, c.px(12), c.py(12))}>
              <i
                style={s(c.fg(c.colors.textSecondary))}
                className="fas fa-house"
              ></i>
            </CMText>
          </a>
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
                  <CMText
                    style={s(
                      c.fg(c.colors.textPrimary),
                      c.weightBold,
                      c.fontSize(isMobile ? 14 : 16),
                      c.pb(isMobile ? 2 : 4),
                      isActive && s(c.borderBottom(`2px solid ${c.grays[60]}`))
                    )}
                  >
                    {navItem.title}
                  </CMText>
                </Pressable>
              );
            }),
          (i) => {
            return (
              <View
                key={i}
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
                <a>
                  <CMText
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
                  </CMText>
                </a>
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
        {authStatus === AuthStatus.Unauthenticated && (
          <>
            <Spacer width={0} grow />
            <Link href="/login">
              <a>
                <CMText
                  style={s(
                    c.buttons.basic,
                    c.bg(c.grays[20]),
                    c.px(12),
                    c.height(50),
                    c.br(4),
                    c.fg(c.primaries[70]),
                    c.weightBold,
                    c.fontSize(isMobile ? 14 : 16)
                  )}
                >
                  Log in / Register
                </CMText>
              </a>
            </Link>
          </>
        )}
      </View>
      <View
        style={s(
          c.fixed,
          c.top(0),
          c.left(0),
          c.fullHeight,
          c.fullWidth,
          c.bg("black"),
          c.opacity(mobileNavOpen ? 60 : 0.0),
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
          c.pl(8),
          c.py(8),
          c.zIndex(10)
        )}
        ref={mobileDrawerRef}
      >
        <View
          style={s(
            c.fullHeight,
            c.fullWidth,
            c.bg(c.grays[20]),
            c.br(2),
            c.px(12),
            c.py(16)
          )}
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
                    <CMText
                      style={s(
                        c.fg(isActive ? c.grays[90] : c.grays[80]),
                        c.weightSemiBold,
                        c.fontSize(18),
                        c.pb(isMobile ? 2 : 4),
                        isActive &&
                          s(c.borderBottom(`1px solid ${c.grays[80]}`)),
                        c.selfStart
                      )}
                    >
                      {navItem.title}
                    </CMText>
                  </Pressable>
                );
              }),
            (i) => {
              return <Spacer key={i} height={32} />;
            }
          )}
        </View>
      </View>
    </>
  );
};
