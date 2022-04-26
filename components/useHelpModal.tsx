import { useState } from "react";
import { Modal } from "./Modal";
import { View, Text } from "react-native";
import { c, s } from "app/styles";

export const useHelpModal = ({ copy }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  return {
    helpOpen,
    setHelpOpen,
    helpModal: (
      <Modal
        onClose={() => {
          setHelpOpen(false);
        }}
        visible={helpOpen}
      >
        <View style={s(c.row, c.px(12), c.py(12), c.alignCenter)}>
          <Text
            style={s(
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.lineHeight(22)
            )}
          >
            {copy}
          </Text>
        </View>
      </Modal>
    ),
  };
};
