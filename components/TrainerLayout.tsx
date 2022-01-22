import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import React from "react";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { NavBar } from "app/components/NavBar";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "../utils/intersperse";

export const TrainerLayout = ({ chessboard, children }: any) => {
  const isMobile = useIsMobile();
  const icons = [
    {
      icon: "fa fa-twitter",
      link: "https://twitter.com/intent/tweet?url=https%3A%2F%2Fchessmadra.com&text=Check%20out%20this%20chess%20visualization%20site%20by%20%40marcusbuffett",
    },
    { icon: "fa fa-envelope", link: "mailto:me@mbuffett.com" },
    {
      icon: "fa fa-github",
      link: "https://github.com/marcusbuffett/chess-trainer-site",
    },
  ];
  return (
    <View style={s(c.column, c.minHeight("100vh"))}>
      <NavBar />
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignItems: "center",
          backgroundColor: "none",
        }}
      >
        <View
          style={s(
            c.fullWidth,
            !isMobile && c.center,
            !isMobile && c.minWidth("100vw"),
            !isMobile && c.my(48),
            isMobile && c.px(10),
            isMobile && c.pt(10)
          )}
        >
          {chessboard ? (
            <>
              <View
                style={s(
                  isMobile && s(c.alignCenter),
                  isMobile ? c.column : s(c.row, c.alignCenter)
                )}
              >
                <View style={s(c.width(500), c.maxWidth("100%"))}>
                  {chessboard}
                </View>
                <Spacer height={12} width={24} isMobile={isMobile} />
                <View
                  style={s(
                    c.column,
                    c.width(400),
                    c.maxWidth("100%"),
                    isMobile && s(c.fullWidth, c.width(500))
                  )}
                >
                  {children}
                </View>
              </View>
            </>
          ) : (
            <View style={s()}>{children}</View>
          )}
        </View>
      </View>
      <View
        style={s(
          c.fullWidth,
          c.row,
          c.minHeight(48),
          c.py(16),
          // c.bg(c.grays[40]),
          c.center
        )}
      >
        {intersperse(
          icons.map((icon) => {
            return (
              <a href={icon.link}>
                <i
                  style={s(c.fg(c.colors.textPrimary), c.fontSize(16))}
                  className={`fas ${icon.icon}`}
                ></i>
              </a>
            );
          }),
          (i) => {
            return <Spacer key={i} width={24} />;
          }
        )}
      </View>
    </View>
  );
};
