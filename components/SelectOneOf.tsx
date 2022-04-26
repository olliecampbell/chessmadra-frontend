import { Spacer } from "app/Space";
import { s, c } from "app/styles";
import { intersperse } from "app/utils/intersperse";
import { View, Text, Pressable } from "react-native";

export const SelectOneOf = <T,>({
  choices,
  onSelect,
  renderChoice,
  activeChoice,
}: {
  choices: T[];
  activeChoice: T;
  onSelect: (_: T) => void;
  renderChoice: (_: T) => JSX.Element;
}) => {
  return (
    <View style={s(c.ml(12))}>
      {intersperse(
        choices.map((choice, i) => {
          const active = choice === activeChoice;
          return (
            <Pressable
              onPress={() => {
                onSelect(choice);
              }}
              key={i}
              style={s(c.row)}
            >
              <i
                style={s(c.fg(c.colors.textPrimary))}
                className={active ? `fas fa-circle` : `fa-regular fa-circle`}
              ></i>
              <Spacer width={12} />
              <Text style={s(c.fg(c.colors.textSecondary), c.weightSemiBold)}>
                {renderChoice(choice)}
              </Text>
            </Pressable>
          );
        }),
        (i) => {
          return <Spacer key={`space-${i}`} height={12} />;
        }
      )}
    </View>
  );
};
