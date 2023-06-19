// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  isNil,
  sortBy,
  filter,
  range,
  forEach,
  some,
  values,
  sum,
  first,
  findLast,
} from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  getAppState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { Accessor, createEffect, createMemo, For, Show } from "solid-js";
import { Intersperse } from "./Intersperse";
import { lineToPgn, pgnToLine, RepertoireMove, Side } from "~/utils/repertoire";
import { clsx } from "~/utils/classes";
import { START_EPD } from "~/utils/chess";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { bySide } from "~/utils/repertoire";
import { isMoveDifficult } from "~/utils/srs";
import { countQueue } from "~/utils/queues";
import { pluralize } from "~/utils/pluralize";
import { COMMON_MOVES_CUTOFF } from "~/utils/review";
import { lineToPositions } from "~/utils/chess";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { HowToComplete } from "./SidebarOnboarding";

export const PreBuild = (props: { side: Side }) => {
  const biggestMiss = () =>
    getAppState().repertoireState.repertoireGrades?.[props.side]?.biggestMiss;
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
  let miss = () => {
    let miss = biggestMiss();
    if (miss) {
      const positions = lineToPositions(pgnToLine(first(miss.lines) as string));
      let ecoCodePosition = findLast(positions, (p) => !!ecoCodeLookup()[p]);
      if (ecoCodePosition) {
        let ecoCode = ecoCodeLookup()[ecoCodePosition];
        const [ecoName] = getAppropriateEcoName(ecoCode.fullName);
        return {
          name: ecoName,
          incidence: miss.incidence,
        };
      }
    }
    return null;
  };
  let actions = () => {
    let actions: SidebarAction[] = [];
    let miss = biggestMiss();
    if (miss) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.popView();
            s.repertoireState.browsingState.moveSidebarState("right");
            const line = pgnToLine(biggestMiss().lines[0]);
            s.repertoireState.startBrowsing(props.side, "build", {
              pgnToPlay: lineToPgn(line),
            });
          });
        },
        text: `Go to the biggest gap in your repertoire`,
        style: "primary",
      });
    }
    actions.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.popView();
          s.repertoireState.browsingState.moveSidebarState("right");
          s.repertoireState.startBrowsing(props.side, "build");
        });
      },
      text: `Choose something else to work on`,
      style: "primary",
    });
    return actions;
  };
  return (
    <SidebarTemplate
      header={"Repertoire progress"}
      actions={actions()}
      bodyPadding={true}
    >
      <RepertoireCompletion side={props.side} />
      <Spacer height={24} />
      <HowToComplete miss={miss()} />
    </SidebarTemplate>
  );
};
