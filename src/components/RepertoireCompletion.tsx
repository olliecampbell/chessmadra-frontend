import { Spacer } from "./Space";
import { useRepertoireState } from "~/utils/app_state";
import { Side } from "~/utils/repertoire";
import { CoverageBar } from "./CoverageBar";
import { c, s } from "~/utils/styles";

export const RepertoireCompletion = (props: { side: Side }) => {
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[props.side],
  ]);
  return (
    <div>
      <p class="body-text">
        Your {props.side} repertoire is now{" "}
        <b style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
          {Math.round(progressState().percentComplete)}%
        </b>{" "}
        complete.
      </p>
      <Spacer height={8} />
      <div style={s(c.height(24))}>
        <CoverageBar isInSidebar side={props.side} />
      </div>
    </div>
  );
};
