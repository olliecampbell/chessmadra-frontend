import { Spacer } from "~/components/Space";
import {
  capitalize,
  filter,
  isEmpty,
  some,
  sortBy,
  take,
  find,
  every,
  reverse,
  keyBy,
  forEach,
  map,
  cloneDeep,
  mapValues,
} from "lodash-es";
import { useResponsive } from "~/utils/useResponsive";
import { CMTextInput } from "./TextInput";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  quick,
  useBrowsingState,
  useSidebarState,
  useUserState,
} from "~/utils/app_state";
import { useRepertoireState } from "~/utils/app_state";
import { CMText } from "./CMText";
import { intersperse } from "~/utils/intersperse";
import { Side, toSide } from "~/utils/repertoire";
import { getPlanPiece, MetaPlan } from "~/utils/plans";
import { Chess, SQUARES } from "@lubert/chess.ts";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";
import { trackEvent } from "~/utils/trackEvent";
import { c, s } from "~/utils/styles";
import { View } from "./View";

export const TargetCoverageReachedView = () => {
  let [planSections, showPlansState] = useSidebarState(([s]) => [
    cloneDeep(s.planSections),
    s.showPlansState,
  ]);
  let actions = [];
  const [mode] = useSidebarState(([s]) => [s.mode]);
  if (showPlansState.coverageReached) {
    actions = [
      {
        onPress: () => {
          trackEvent(`${mode}.save_line`);
          quick((s) => {
            s.repertoireState.browsingState.addPendingLine();
          });
        },
        style: "primary",
        text: "I'm done, save this line to my repertoire",
      },
      {
        onPress: () => {
          quick((s) => {
            trackEvent(`${mode}.plans_view.keep_adding`);
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.dismissTransientSidebarState();
          });
        },
        style: "primary",
        text: "Keep adding moves to this line",
      },
    ];
  }

  return (
    <SidebarTemplate
      header={
        showPlansState.coverageReached
          ? "You've reached your target depth!"
          : "How to play from here"
      }
      actions={actions}
      bodyPadding={true}
    >
      {/*<CMText style={s(c.sidebarDescriptionStyles(responsive))}>
        Feature request? Bug report? Etc? Let us know
      </CMText>
      <Spacer height={12} />
*/}
      <Spacer height={12} />
      {!isEmpty(planSections) ? (
        <PlayFromHere />
      ) : (
        <>
          <CMText
            style={s(
              c.weightRegular,
              c.fontSize(14),
              c.fg(c.colors.textPrimary)
            )}
          >
            Do you want to keep adding moves to this line, or save your
            progress?
          </CMText>
        </>
      )}
    </SidebarTemplate>
  );
};

export const PlayFromHere = ({ isolated }: { isolated?: boolean }) => {
  const responsive = useResponsive();
  let [planSections, showPlansState] = useSidebarState(([s]) => [
    cloneDeep(s.planSections),
    s.showPlansState,
  ]);
  return (
    <>
      {(showPlansState.coverageReached || isolated) && (
        <>
          <CMText
            style={s(c.weightBold, c.fontSize(14), c.fg(c.colors.textPrimary))}
          >
            How to play from here
          </CMText>
          <Spacer height={18} />
        </>
      )}
      <View>
        {intersperse(
          planSections.map((section, i) => {
            return (
              <View style={s(c.row, c.alignStart)} key={i}>
                <i
                  className="fa-solid fa-circle"
                  style={s(c.fontSize(6), c.fg(c.grays[70]), c.mt(6))}
                />
                <Spacer width={8} />
                <CMText style={s(c.fg(c.colors.textPrimary))}>{section}</CMText>
              </View>
            );
          }),
          (k) => {
            return <Spacer key={k} height={12} />;
          }
        )}
      </View>
    </>
  );
};
