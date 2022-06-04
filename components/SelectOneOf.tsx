import { Spacer } from "app/Space";
import { s, c } from "app/styles";
import { intersperse } from "app/utils/intersperse";
import { View, Text, Pressable } from "react-native";

export const SelectOneOf = <T,>({
  choices,
  onSelect,
  renderChoice,
  activeChoice,
  containerStyles,
  cellStyles,
  horizontal,
}: {
  choices: T[];
  activeChoice: T;
  onSelect: (_: T) => void;
  horizontal?: boolean;
  renderChoice: (x: T) => JSX.Element | string;
  containerStyles?: any;
  cellStyles?: any;
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
          const active = choice === activeChoice;
          const isLast = i == choices.length - 1;
          return (
            <Pressable
              onPress={() => {
                onSelect(choice);
              }}
              key={i}
              style={s(
                c.row,
                c.bg(active ? c.grays[80] : c.grays[25]),
                c.py(12),
                c.px(18),
                !isLast &&
                  (horizontal ? c.borderRight : c.borderBottom)(
                    `1px solid ${c.grays[15]}`
                  ),
                cellStyles
              )}
            >
              <Text
                style={s(
                  c.fg(active ? c.colors.textInverse : c.colors.textSecondary),
                  c.weightBold
                )}
              >
                {renderChoice(choice)}
              </Text>
            </Pressable>
          );
        }),
        (i) => {
          return <Spacer key={`space-${i}`} height={0} />;
        }
      )}
    </View>
  );
};
