import { useState } from "react";
import { Modal } from "./Modal";
import { View, Text } from "react-native";
import { c, s } from "app/styles";

export const useModal = ({ content, isOpen }) => {
  const [open, setOpen] = useState(isOpen);
  return {
    open,
    setOpen,
    modal: (
      <Modal
        onClose={() => {
          setOpen(false);
        }}
        visible={open}
      >
        {content}
      </Modal>
    ),
  };
};
