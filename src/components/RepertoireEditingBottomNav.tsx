import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  isEmpty,
} from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { useRepertoireState } from "app/utils/app_state";
import React from "react";
import { Animated } from "react-native";

export const RepertoireEditingBottomNav = ({}: {}) => {
  const isMobile = useIsMobile();
  const [moveLogPgn, hasPendingLineToAdd] = useRepertoireState((s) => [
    s.chessboardState.moveLogPgn,
    s.hasPendingLineToAdd,
  ]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const visible = !isEmpty(moveLogPgn);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  return (
    <View
      style={s(
        c.absolute,
        c.left(0),
        c.right(0),
        c.bottom(0),
        !visible && c.noPointerEvents
      )}
    >
      <Animated.View
        style={s(
          c.fullWidth,
          c.bg(c.grays[10]),
          c.opacity(fadeAnim),
          c.borderTop(`2px solid ${c.grays[8]}`)
        )}
      >
        <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
          <View
            style={s(
              c.row,
              c.fullWidth,
              c.justifyStart,
              c.alignCenter,
              c.py(24),
              c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
            )}
          >
            <View style={s(c.column, c.flexShrink(1))}>
              <CMText
                style={s(
                  c.fontSize(16),
                  c.fg(c.colors.textPrimary),
                  c.weightSemiBold
                )}
              >
                Current line
              </CMText>
              <Spacer height={12} />
              <CMText
                style={s(
                  c.fontSize(14),
                  c.fg(c.colors.textSecondary),
                  c.height(16)
                )}
              >
                {moveLogPgn}
              </CMText>
            </View>
            <Spacer width={24} grow />
            {hasPendingLineToAdd && <AddPendingLineButton />}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const AddPendingLineButton = () => {
  const [
    isAddingPendingLine,
    addPendingLine,
    pendingLineHasConflictingMoves,
    quick,
  ] = useRepertoireState((s) => [
    s.isAddingPendingLine,
    s.addPendingLine,
    s.pendingLineHasConflictingMoves,
    s.quick,
  ]);
  const isMobile = useIsMobile();
  return (
    <Button
      style={s(
        c.buttons.primary,
        c.height(isMobile ? 36 : 54),
        c.selfStretch,
        c.bg(c.purples[45])
      )}
      isLoading={isAddingPendingLine}
      loaderProps={{ color: c.grays[75] }}
      onPress={() => {
        if (pendingLineHasConflictingMoves) {
          quick((s) => {
            s.editingState.addConflictingMoveModalOpen = true;
          });
        } else {
          addPendingLine();
        }
      }}
    >
      <CMText style={s(c.buttons.primary.textStyles, c.row, c.alignCenter)}>
        <i
          className="fas fa-check"
          style={s(c.fg(c.grays[90]), c.fontSize(20))}
        />
        <Spacer width={8} />
        <CMText
          style={s(c.weightBold, c.fg(c.colors.textPrimary), c.fontSize(14))}
        >
          Save{!isMobile && " to repertoire"}
        </CMText>
      </CMText>
    </Button>
  );
};
