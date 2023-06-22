import { c } from "~/utils/styles";
import { useResponsive } from "~/utils/useResponsive";
import { Show } from "solid-js";
import { useSidebarState, useRepertoireState, quick } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { Puff } from "solid-spinner";
import { SidebarTemplate } from "./SidebarTemplate";
import { filter, isNil } from "lodash-es";
import { SidebarAction, useBiggestGapAction } from "./SidebarActions";
import { Spacer } from "./Space";
import { RepertoireCompletion } from "./RepertoireCompletion";

export const SavedLineView = function SavedLineView() {
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[activeSide()],
  ]);
  const responsive = useResponsive();
  const [addedLineState] = useSidebarState(([s]) => [s.addedLineState]);

  const [mode, currentLine] = useSidebarState(([s]) => [s.mode, s.moveLog]);
  const reviewCurrentLineAction: SidebarAction = {
    onPress: () => {
      trackEvent(`${mode()}.added_line_state.practice_line`);
      quick((s) => {
        s.repertoireState.reviewState.reviewLine(currentLine(), activeSide());
      });
    },
    text: "Practice these moves",
    style: "primary",
  };
  return (
    <Show
      when={!addedLineState().loading}
      fallback={
        <div class="row w-full justify-center pt-12">
          <Puff color={c.primaries[65]} />
        </div>
      }
    >
      <SidebarTemplate
        header={"Moves saved!"}
        bodyPadding
        actions={filter(
          [useBiggestGapAction(), reviewCurrentLineAction],
          (a) => !isNil(a)
        )}
      >
        <RepertoireCompletion side={activeSide()} />
        <Spacer height={12} />
      </SidebarTemplate>
    </Show>
  );
};
