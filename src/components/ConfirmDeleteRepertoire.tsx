// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isNil } from "lodash-es";
import { CMText } from "./CMText";
import { quick, useRepertoireState, useSidebarState } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { SidebarTemplate } from "./SidebarTemplate";
import { trackEvent } from "~/utils/trackEvent";

export const ConfirmDeleteRepertoire = function DeleteLineView() {
  const responsive = useResponsive();
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  return (
    <SidebarTemplate
      header="Are you sure?"
      actions={[
        {
          text: `Yes, delete my ${side} repertoire`,
          style: "primary",
          onPress: () => {
            quick((s) => {
              s.repertoireState.deleteRepertoire(side);
              s.repertoireState.browsingState.popView();
              trackEvent("repertoire.delete_side");
            });
          },
        },
      ]}
    >
      <CMText style={s(c.px(c.getSidebarPadding(responsive)))}>
        This will permanently delete your {side} repertoire. This cannot be
        undone.
      </CMText>
    </SidebarTemplate>
  );
};
