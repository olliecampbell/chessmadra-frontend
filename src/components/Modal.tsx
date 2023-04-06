// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";

export const Modal = ({
  onClose,
  visible,
  children,
}: {
  onClose: () => void;
  visible;
  children: any;
}) => {
  // TODO: solid
  return null;
  return (
    <NativeModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onClose();
      }}
    >
      <Pressable
        onPress={() => {
          onClose();
        }}
        style={s(c.center, { flex: 1 }, c.bg("hsla(0, 0%, 0%, .5)"), c.br(2))}
      >
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
          }}
          style={s(
            c.bg(c.grays[15]),
            c.br(2),
            c.column,
            c.unclickable,
            c.maxWidth("calc(100% - 16px)")
          )}
        >
          {children}
        </Pressable>
      </Pressable>
    </NativeModal>
  );
};
