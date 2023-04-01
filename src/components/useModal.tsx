import { useState } from "react";
import { Modal } from "./Modal";

export const useModal = ({ content, isOpen }) => {
  const [open, setOpen] = createSignal(isOpen);
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
