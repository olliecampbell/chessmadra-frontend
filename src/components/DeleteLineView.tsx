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

export const DeleteLineView = React.memo(function DeleteLineView() {
  const responsive = useResponsive();
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [responses, deleting] = useRepertoireState((s) => [
    s.repertoire[activeSide].positionResponses[
      s.browsingState.chessboardState.getCurrentEpd()
    ],
    s.deleteMoveState.isDeletingMove,
  ]);
  if (isNil(responses)) {
    return null;
  }

  const multiple = responses.length > 1;
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>
        {multiple ? "Which line do you want to delete?" : "Are you sure?"}
      </RepertoireEditingHeader>
      <Spacer height={24} />
      <View style={s(c.px(getSidebarPadding(responsive)))}>
        <CMText style={s()}>
          {multiple
            ? "Select the line you want to delete. This cannot be undone."
            : "This will also delete any moves past this one. This cannot be undone."}
        </CMText>
      </View>
      <Spacer height={24} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        {responses.map((response) => (
          <SidebarFullWidthButton
            action={{
              onPress: () => {
                if (deleting) {
                  return;
                }
                quick((s) => {
                  s.repertoireState.deleteMove(response).then(() => {
                    quick((s) => {
                      s.repertoireState.browsingState.moveSidebarState("left");
                      s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                        false;
                    });
                  });
                });
              },
              style: "primary",
              text: multiple
                ? `Delete ${response.sanPlus} and subsequent moves`
                : `Yes I'm sure, delete ${response.sanPlus}`,
            }}
          />
        ))}
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.moveSidebarState("left");
                s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                  false;
              });
            },
            style: "primary",
            text: multiple ? `Nevermind, go back` : `No, I've changed my mind`,
          }}
        />
      </View>
    </View>
  );
});
