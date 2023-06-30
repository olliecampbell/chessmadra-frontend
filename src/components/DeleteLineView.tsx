// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isNil } from "lodash-es";
import { CMText } from "./CMText";
import { quick, useRepertoireState, useSidebarState } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarFullWidthButton } from "./SidebarActions";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { For } from "solid-js";

export const DeleteLineView = function DeleteLineView() {
  const responsive = useResponsive();
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [responses, deleting] = useRepertoireState((s) => [
    s.repertoire?.[activeSide()!].positionResponses[
      s.browsingState.chessboard.getCurrentEpd()
    ],
    s.deleteMoveState.isDeletingMove,
  ]);
  if (isNil(responses)) {
    return null;
  }

  const multiple = responses.length > 1;
  return (
    <div style={s(c.column)}>
      <SidebarHeader>
        {multiple ? "Which line do you want to delete?" : "Are you sure?"}
      </SidebarHeader>
      <Spacer height={24} />
      <div style={s(c.px(c.getSidebarPadding(responsive)))}>
        <CMText style={s()}>
          {multiple
            ? "Select the line you want to delete. This cannot be undone."
            : "This will also delete any moves past this one. This cannot be undone."}
        </CMText>
      </div>
      <Spacer height={24} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        <For each={responses()}>
          {(response) => (
            <SidebarFullWidthButton
              action={{
                onPress: () => {
                  if (deleting()) {
                    return;
                  }
                  quick((s) => {
                    s.repertoireState.deleteMove(response).then(() => {
                      quick((s) => {
                        s.repertoireState.browsingState.moveSidebarState(
                          "left"
                        );
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
          )}
        </For>
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
      </div>
    </div>
  );
};
