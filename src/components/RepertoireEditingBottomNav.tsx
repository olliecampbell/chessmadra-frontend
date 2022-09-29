import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { useBrowsingState, useRepertoireState } from "app/utils/app_state";
import React from "react";
import { Animated } from "react-native";
import { trackEvent } from "app/hooks/useTrackEvent";
import { useResponsive } from "app/utils/useResponsive";

export const RepertoireEditingBottomNav = ({}: {}) => {
  const [moveLogPgn, hasPendingLineToAdd] = useBrowsingState(([s]) => [
    s.chessboardState.moveLogPgn,
    s.hasPendingLineToAdd,
  ]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const visible = !isEmpty(moveLogPgn);
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;

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
        c.fixed,
        c.left(0),
        c.right(0),
        c.bottom(0),
        !visible && c.noPointerEvents
      )}
    >
      <Animated.View
        style={s(
          c.fullWidth,
          c.bg(c.colors.cardBackground),
          c.shadow(0, 0, 24, 0, "rgba(0, 0, 0, 0.8)"),
          c.opacity(fadeAnim)
        )}
      >
        <View style={s(c.containerStyles(responsive.bp), c.alignCenter)}>
          <View
            style={s(
              c.row,
              c.fullWidth,
              c.justifyStart,
              c.alignCenter,
              c.py(isMobile ? 12 : 24)
              // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
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
                  c.minHeight(16)
                )}
              >
                {moveLogPgn}
              </CMText>
            </View>
            <Spacer width={24} grow />
            {<AddPendingLineButton />}
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
    hasPendingLineToAdd,
    pendingLineHasConflictingMoves,
    currentLineIncidence,
    quick,
  ] = useBrowsingState(([s]) => [
    s.isAddingPendingLine,
    s.addPendingLine,
    s.hasPendingLineToAdd,
    s.pendingLineHasConflictingMoves,
    s.getIncidenceOfCurrentLine(),
    s.quick,
  ]);
  const isMobile = useIsMobile();
  if (
    !hasPendingLineToAdd &&
    currentLineIncidence &&
    currentLineIncidence < 1
  ) {
    return (
      <View style={s(c.column, c.alignStart)}>
        <CMText
          style={s(
            c.fontSize(16),
            c.fg(c.colors.textPrimary),
            c.weightSemiBold
          )}
        >
          Expected in
        </CMText>
        <Spacer height={12} />
        <CMText
          style={s(
            c.fontSize(14),
            c.fg(c.colors.textSecondary),
            c.minHeight(16)
          )}
        >
          {(currentLineIncidence * 100).toFixed(1)}% of games
        </CMText>
      </View>
    );
  }
  if (hasPendingLineToAdd) {
    return (
      <Button
        style={s(
          c.buttons.primary,
          c.height(isMobile ? 36 : 54),
          c.selfStretch,
          hasPendingLineToAdd
            ? c.bg(c.purples[45])
            : s(c.border(`2px solid ${c.purples[45]}`), c.bg("transparent"))
        )}
        isLoading={isAddingPendingLine}
        loaderProps={{ color: c.grays[75] }}
        onPress={() => {
          if (pendingLineHasConflictingMoves) {
            quick((s) => {
              s.editingState.addConflictingMoveModalOpen = true;
            });
          } else {
            trackEvent("repertoire.add_pending_line");
            addPendingLine();
          }
        }}
      >
        <CMText style={s(c.buttons.primary.textStyles, c.row, c.alignCenter)}>
          <i
            className="fa-sharp fa-check"
            style={s(
              c.fg(hasPendingLineToAdd ? c.grays[90] : c.purples[45]),
              c.fontSize(20)
            )}
          />
          <Spacer width={8} />
          <CMText
            style={s(
              c.weightBold,
              c.fg(hasPendingLineToAdd ? c.colors.textPrimary : c.purples[45]),
              c.fontSize(14)
            )}
          >
            <>Save{!isMobile && " to repertoire"}</>
          </CMText>
        </CMText>
      </Button>
    );
  }
  return null;
};
