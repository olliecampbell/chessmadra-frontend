
import {
  Pressable,
  View,
} from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import {
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";
import { useIsMobile } from "app/utils/isMobile";
import { CMText } from "./CMText";

export const ProgressMessageView = ({
  progressMessage,
}: {
  progressMessage: ProgressMessage;
}) => {
  const isMobile = useIsMobile();
  return (
    <View style={s(c.br(4), c.fullWidth)}>
      <CMText
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
      </CMText>
      {progressMessage.prompt && (
        <Pressable
          onPress={() => {
            progressMessage.onPromptPress();
          }}
        >
          <CMText
            style={s(
              c.selfStart,
              c.fg(
                progressMessage.type === ProgressMessageType.Error
                  ? c.colors.failureLight
                  : c.primaries[60]
              ),
              c.weightBold,
              c.borderBottom(`1px solid ${c.failureShades[60]}`),
              c.fontSize(isMobile ? 14 : 16)
            )}
          >
            {progressMessage.prompt}
          </CMText>
        </Pressable>
      )}
    </View>
  );
};
