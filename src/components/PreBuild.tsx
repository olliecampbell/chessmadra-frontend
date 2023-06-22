// import { ExchangeRates } from "~/ExchangeRate";
import { Spacer } from "~/components/Space";
import {
  first,
  findLast,
} from "lodash-es";
import {
  useRepertoireState,
  quick,
  getAppState,
} from "~/utils/app_state";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { lineToPgn, pgnToLine, Side } from "~/utils/repertoire";
import { lineToPositions } from "~/utils/chess";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { HowToComplete } from "./SidebarOnboarding";

export const PreBuild = (props: { side: Side }) => {
  const biggestMiss = () =>
    getAppState().repertoireState.repertoireGrades?.[props.side]?.biggestMiss;
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
  const miss = () => {
    const miss = biggestMiss();
    if (miss) {
      const positions = lineToPositions(pgnToLine(first(miss.lines) as string));
      const ecoCodePosition = findLast(positions, (p) => !!ecoCodeLookup()[p]);
      if (ecoCodePosition) {
        const ecoCode = ecoCodeLookup()[ecoCodePosition];
        const [ecoName] = getAppropriateEcoName(ecoCode.fullName);
        return {
          name: ecoName,
          incidence: miss.incidence,
        };
      }
    }
    return null;
  };
  const actions = () => {
    const actions: SidebarAction[] = [];
    const miss = biggestMiss();
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
