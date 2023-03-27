import { Spacer } from "~/components/Space";
import { s, c } from "~/utils/styles";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { View } from "./View";
import { Pressable } from "./Pressable";

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
    <div
      style={s(
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
          const rendered = renderChoice(choice, active, i);
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
            return rendered;
          }
        }),
        (i) => {
          if (separator) {
            return separator();
          }
          return <Spacer key={`space-${i}`} height={0} />;
        }
      )}
    </div>
  );
};
