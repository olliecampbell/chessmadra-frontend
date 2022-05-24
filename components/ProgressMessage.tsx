import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Text,
  Pressable,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";
import { useIsMobile } from "app/utils/isMobile";

export const ProgressMessageView = ({
  progressMessage,
}: {
  progressMessage: ProgressMessage;
}) => {
  const isMobile = useIsMobile();
  return (
    <View style={s(c.br(4), c.fullWidth)}>
      <Text
        style={s(
          c.fg(
            progressMessage.type === ProgressMessageType.Error
              ? c.colors.failureLight
              : c.primaries[60]
          ),
          c.weightBold,
          c.fontSize(isMobile ? 14 : 16)
        )}
      >
        {progressMessage.message}
      </Text>
    </View>
  );
};
