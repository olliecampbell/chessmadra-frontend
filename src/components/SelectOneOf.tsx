import { Spacer } from "app/Space";
import { s, c } from "app/styles";
import { intersperse } from "app/utils/intersperse";
import React from "react";
import { View, Pressable } from "react-native";
import { CMText } from "./CMText";

export const SelectOneOf = <T,>({
  choices,
  onSelect,
  equality,
  renderChoice,
  activeChoice,
  containerStyles,
  cellStyles,
  textStyles,
  separator,
  tabStyle,
  horizontal,
}: {
  choices: T[];
  tabStyle?: boolean;
  activeChoice: T;
  onSelect: (_: T, i?: number) => void;
  equality?: (x: T, y: T) => boolean;
  horizontal?: boolean;
  separator?: () => JSX.Element;
  renderChoice: (x: T, active: boolean, i: number) => JSX.Element | string;
  containerStyles?: any;
  cellStyles?: any;
  textStyles?: any;
}) => {
  return (
    <View
      style={s(
        c.br(2),
        c.overflowHidden,
        horizontal ? c.row : c.column,
        containerStyles
      )}
    >
      {intersperse(
        choices.map((choice, i) => {
          const active = equality
            ? equality(choice, activeChoice)
            : choice === activeChoice;
          const isLast = i == choices.length - 1;
          let rendered = renderChoice(choice, active, i);
          if (typeof rendered === "string") {
            return (
              <Pressable
                onPress={() => {
                  onSelect(choice, i);
                }}
                key={i}
                style={s(
                  active &&
                    tabStyle &&
                    c.borderBottom(`2px solid ${c.grays[90]}`),
                  c.row,
                  !tabStyle && c.bg(active ? c.grays[80] : c.grays[25]),
                  !tabStyle && c.py(8),
                  tabStyle && c.pb(4),
                  c.px(12),
                  !isLast &&
                    !tabStyle &&
                    (horizontal ? c.borderRight : c.borderBottom)(
                      `1px solid ${c.grays[15]}`
                    ),
                  cellStyles
                )}
              >
                <CMText
                  style={s(
                    tabStyle
                      ? c.fg(active ? c.colors.textPrimary : c.grays[80])
                      : c.fg(
                          active ? c.colors.textInverse : c.colors.textSecondary
                        ),
                    c.weightBold,
                    textStyles
                  )}
                >
                  {rendered}
                </CMText>
              </Pressable>
            );
          } else {
            return (
              <React.Fragment key={`space-${i}`}>{rendered}</React.Fragment>
            );
          }
        }),
        (i) => {
          if (separator) {
            return (
              <React.Fragment key={`space-${i}`}>{separator()}</React.Fragment>
            );
          }
          return <Spacer key={`space-${i}`} height={0} />;
        }
      )}
    </View>
  );
};
