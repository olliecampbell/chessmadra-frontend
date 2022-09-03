import { Modal } from "./Modal";
import { View } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { useIsMobile } from "app/utils/isMobile";
import shallow from "zustand/shallow";
import { useRepertoireState } from "app/utils/app_state";

export const DeleteMoveConfirmationModal = () => {
  let [open, isDeletingMove, deleteMoveConfirmed, quick] = useRepertoireState(
    (s) => [
      s.deleteMoveState.modalOpen,
      s.deleteMoveState.isDeletingMove,
      s.deleteMoveConfirmed,
      s.quick,
    ]
  );

  const isMobile = useIsMobile();
  console.log({ open });
  return (
    <Modal onClose={() => {}} visible={open}>
      <View
        style={s(
          c.column,
          c.bg(c.grays[90]),
          c.br(4),
          c.px(isMobile ? 8 : 16),
          c.py(16),
          c.width(400),
          c.maxWidth("calc(100vw - 16px)")
        )}
      >
        {open && (
          <View style={s(c.column, c.alignStart, c.px(16), c.py(16), c.br(8))}>
            <CMText
              style={s(
                c.fg(c.colors.textInverse),
                c.flexShrink(1),
                c.fontSize(14),
                c.weightSemiBold,
                c.lineHeight("1.7em")
              )}
            >
              Are you sure you want to delete this move? Any moves after will
              also be deleted
            </CMText>
            <Spacer height={18} />
            <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
              <Button
                style={s(c.buttons.outlineDark, c.height(36), c.selfEnd)}
                onPress={() => {
                  quick((s) => {
                    s.deleteMoveState.modalOpen = false;
                  });
                }}
              >
                <CMText style={s(c.buttons.outlineDark.textStyles)}>
                  Cancel
                </CMText>
              </Button>
              <Spacer width={12} grow />
              <Button
                style={s(
                  c.buttons.primary,
                  c.height(36),
                  c.selfEnd,
                  c.bg(c.failureShades[50])
                )}
                isLoading={isDeletingMove}
                loaderProps={{ color: c.grays[75] }}
                onPress={() => {
                  deleteMoveConfirmed();
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
              </Button>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};
