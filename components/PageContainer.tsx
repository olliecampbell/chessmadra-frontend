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

export const PageContainer = ({ children, centered }: any) => {
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
      <View style={s(c.grow, centered && c.center)}>{children}</View>
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
