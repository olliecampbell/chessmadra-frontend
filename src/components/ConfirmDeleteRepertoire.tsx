import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isNil } from "lodash-es";
import { CMText } from "./CMText";
import {
  quick,
  useRepertoireState,
  useSidebarState,
} from "app/utils/app_state";
import { useResponsive } from "app/utils/useResponsive";
import { SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import React from "react";
import { SidebarTemplate } from "./SidebarTemplate";
import { trackEvent } from "app/hooks/useTrackEvent";

export const ConfirmDeleteRepertoire = React.memo(function DeleteLineView() {
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
              s.repertoireState.browsingState.popView()
              trackEvent("repertoire.delete_side");
            });
          },
        },
      ]}
    >
      <CMText style={s(c.px(getSidebarPadding(responsive)))}>
        This will permanently delete your {side} repertoire. This cannot be
        undone.
      </CMText>
    </SidebarTemplate>
  );
});
