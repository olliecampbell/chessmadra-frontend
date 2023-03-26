import { useState } from "react";
import { Modal } from "./Modal";
import { View } from "react-native";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";

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
        <div style={s(c.row, c.px(12), c.py(12), c.alignCenter)}>
          <CMText
            style={s(
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.lineHeight(22)
            )}
          >
            {copy}
          </CMText>
        </div>
      </Modal>
    ),
  };
};
