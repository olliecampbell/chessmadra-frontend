import { Button } from "./components/Button";
import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { Spacer } from "./Space";
import { s, c } from "./styles";
import { CMText } from "./components/CMText";

export const NewPuzzleButton = ({ onPress }) => {
  return (
    <Button
      style={s(c.buttons.primary)}
      onPress={() => {
        onPress();
      }}
    >
      <CMText style={s(c.buttons.primary.textStyles)}>
        <i style={s(c.fg(c.colors.textPrimary))} className="fas fa-random"></i>
        <Spacer width={8} />
        New puzzle
      </CMText>
    </Button>
  );
};
