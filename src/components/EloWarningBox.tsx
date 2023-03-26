import { Spacer } from "~/components/Space";
import { s, c } from "~/utils/styles";
import { CMText } from "./CMText";
import { View } from "react-native";
import { DEFAULT_ELO_RANGE } from "~/utils/repertoire_state";
import { Button } from "./Button";
import { useRepertoireState } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";

export const EloWarningBox = ({ onDismiss, onUpdateElo }) => {
  let [] = useRepertoireState((s) => []);
  let buttonStyles = s(c.fontSize(14));
  return (
    <div
      style={s(
        c.px(12),
        c.py(12),
        // c.border(`1px solid ${c.grays[20]}`),
        c.bg(c.colors.cardBackground),
        c.borderLeft(`4px solid ${c.yellows[50]}`),
        c.br(2),
        c.fillNoExpand
      )}
    >
      <CMText
        style={s(
          c.fg(c.grays[90]),
          c.weightSemiBold,
          c.lineHeight("1.1rem"),
          c.fontSize(13)
        )}
      >
        Using the default elo range of {DEFAULT_ELO_RANGE[0]}-
        {DEFAULT_ELO_RANGE[1]} Lichess. You can change this to better reflect
        your level.
      </CMText>
      <Spacer height={12} />
      <div style={s(c.row, c.fullWidth, c.justifyEnd, c.alignCenter)}>
        <Button
          style={s(buttonStyles)}
          onPress={() => {
            trackEvent(`elo_range_warning.dismiss`);
            onDismiss();
          }}
        >
          <CMText style={s(c.fg(c.grays[95]))}>Sounds right</CMText>
        </Button>
        <Spacer width={16} />
        <Button
          style={s(buttonStyles, c.weightSemiBold)}
          onPress={() => {
            trackEvent(`elo_range_warning.update`);
            onUpdateElo();
          }}
        >
          <CMText
            style={s(
              c.weightSemiBold,
              c.fg(c.grays[10]),
              c.bg(c.grays[90]),
              c.py(6),
              c.br(2),
              c.px(12)
            )}
          >
            Update
          </CMText>
        </Button>
      </div>
    </div>
  );
};
