import { Modal } from "./Modal";
import { View } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { useIsMobile } from "app/utils/isMobile";
import shallow from "zustand/shallow";
import { useRepertoireState } from "app/utils/app_state";

export const ConfirmMoveConflictModal = () => {
  let [open, isAddingPendingLine, addPendingLine, quick] = useRepertoireState(
    (s) => [
      s.editingState.addConflictingMoveModalOpen,
      s.isAddingPendingLine,
      s.addPendingLine,
      s.quick,
    ]
  );

  const isMobile = useIsMobile();
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
          <View
            style={s(
              c.column,
              c.alignStart,
              c.px(isMobile ? 8 : 16),
              c.py(isMobile ? 8 : 16),
              c.br(8)
            )}
          >
            <CMText
              style={s(
                c.fg(c.colors.textInverse),
                c.flexShrink(1),
                c.fontSize(14),
                c.weightSemiBold,
                c.lineHeight("1.7em")
              )}
            >
              You're adding a line that conflicts with a move already in your
              repertoire. Do you want to replace your old move, or include both
              in your repertoire?
            </CMText>
            <Spacer height={18} />
            <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
              <Button
                style={s(
                  c.buttons.outlineDark,
                  c.height(36),
                  c.selfEnd,
                  c.border("none"),
                  c.pl(0)
                )}
                onPress={() => {
                  quick((s) => {
                    s.editingState.addConflictingMoveModalOpen = false;
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
                  c.border(`1px solid ${c.failureShades[50]}`),
                  c.height(36),
                  c.selfEnd,
                  c.bg("none")
                )}
                isLoading={isAddingPendingLine}
                loaderProps={{ color: c.failureShades[55] }}
                onPress={() => {
                  addPendingLine({ replace: true });
                }}
              >
                <CMText
                  style={s(
                    c.buttons.primary.textStyles,
                    c.fg(c.failureShades[50])
                  )}
                >
                  Replace
                </CMText>
              </Button>
              <Spacer width={8} />
              <Button
                style={s(c.buttons.basicInverse, c.height(36), c.selfEnd)}
                isLoading={isAddingPendingLine}
                loaderProps={{ color: c.grays[75] }}
                onPress={() => {
                  addPendingLine({ replace: false });
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>
                  Include both
                </CMText>
              </Button>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};
