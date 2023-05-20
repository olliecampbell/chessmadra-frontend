import { c, s } from "~/utils/styles";
import { useResponsive } from "~/utils/useResponsive";
import { Show } from "solid-js";
import { useSidebarState, useRepertoireState, quick } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { Puff } from "solid-spinner";
import { SidebarTemplate } from "./SidebarTemplate";
import { filter, isNil } from "lodash-es";
import { SidebarAction, useBiggestGapAction } from "./SidebarActions";
import { Animated } from "./View";
import { CMText } from "./CMText";
import { Spacer } from "./Space";
import { CoverageBar } from "./CoverageBar";

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
    text: "Practice this line",
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
        header={"Line saved!"}
        bodyPadding
        actions={filter(
          [useBiggestGapAction(), reviewCurrentLineAction],
          (a) => !isNil(a)
        )}
      >
        <div style={s(c.fullWidth)}>
          <Animated.View
            style={s(
              c.row,
              c.alignCenter,
              c.justifyBetween,
              c.fullWidth,
              c.opacity(100),
              c.relative,
              c.zIndex(2)
            )}
          >
            <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
              Your {activeSide()} repertoire is now{" "}
              <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
                {Math.round(progressState().percentComplete)}%
              </CMText>{" "}
              complete.
            </CMText>
          </Animated.View>
          <Spacer height={4} />
          <div style={s(c.height(24))}>
            <CoverageBar isInSidebar side={activeSide()} />
          </div>
        </div>
        <Spacer height={12} />
      </SidebarTemplate>
    </Show>
  );
};
