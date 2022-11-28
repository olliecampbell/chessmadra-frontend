import React, { useState } from "react";
import { Spacer } from "app/Space";
import {
  capitalize,
  filter,
  isEmpty,
  some,
  sortBy,
  take,
  find,
  every,
} from "lodash-es";
import { useResponsive } from "app/utils/useResponsive";
import { CMTextInput } from "./TextInput";
import { SidebarTemplate } from "./SidebarTemplate";
import client from "app/client";
import {
  quick,
  useBrowsingState,
  useSidebarState,
  useUserState,
} from "app/utils/app_state";
import { useRepertoireState } from "app/utils/app_state";
import { CMText } from "./CMText";
import { s, c } from "app/styles";
import { intersperse } from "app/utils/intersperse";
import { Plan } from "app/models";
import { Side } from "app/utils/repertoire";
import { View } from "react-native";
import { getTopPlans, MetaPlan } from "app/utils/plans";
import { useHovering } from "app/hooks/useHovering";

type PlanSection = JSX.Element | JSX.Element[] | string;

export const TargetCoverageReachedView = () => {
  const responsive = useResponsive();
  const user = useUserState((s) => s.user);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const submitFeedback = () => {
    if (isEmpty(feedback)) {
      return;
    }
    setLoading(true);
    client
      .post("/api/v1/submit-feedback", {
        feedback,
        email: user?.email ?? email ?? null,
      })
      .then(() => {
        setSuccess(true);
        setLoading(false);
      });
  };
  let [currentEpd] = useSidebarState(([s]) => [s.currentEpd]);
  const [activeSide] = useBrowsingState(([s, rs]) => [s.activeSide]);
  let [plans] = useRepertoireState((s) => [
    getTopPlans(
      s.positionReports[currentEpd]?.plans ?? [],
      s.browsingState.activeSide,
      s.browsingState.chessboardState.position
    ),
  ]);

  let planSections = [];
  planSections.push(getCastlingPlanSection(plans, activeSide));
  planSections.push(getPawnPlansSection(plans, activeSide));
  planSections.push(getPiecePlansSection(plans, activeSide));
  planSections = planSections.filter((p) => p);
  return (
    <SidebarTemplate
      header={"You've reached your target depth!  ✅"}
      actions={[
        {
          onPress: () => {
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
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.sidebarState.targetCoverageReachedState.visible =
                false;
            });
          },
          style: "primary",
          text: "Keep adding moves to this line",
        },
      ]}
      loading={loading && "Submitting feedback..."}
      bodyPadding={true}
    >
      {/*<CMText style={s(c.sidebarDescriptionStyles(responsive))}>
        Feature request? Bug report? Etc? Let us know
      </CMText>
      <Spacer height={12} />
*/}
      <Spacer height={12} />
      <CMText
        style={s(c.weightBold, c.fontSize(14), c.fg(c.colors.textPrimary))}
      >
        How to play from here
      </CMText>
      <Spacer height={12} />
      <View>
        {intersperse(
          planSections.map((section, i) => {
            return (
              <View style={s()} key={i}>
                <CMText style={s()}>{section}</CMText>
              </View>
            );
          }),
          (k) => {
            return <Spacer key={k} height={12} />;
          }
        )}
      </View>
    </SidebarTemplate>
  );
};

// TODO: move text elements should have a component that has hover behavior that
// highlights the plan on the board

function getCastlingPlanSection(plans: MetaPlan[], side: Side): PlanSection {
  let queenside = find(plans, (p) => p.plan.san === "O-O-O");
  let kingside = find(plans, (p) => p.plan.san === "O-O");
  if (!(queenside || kingside)) {
    return null;
  } else if (queenside && kingside) {
    let queensideMoreCommon =
      queenside.plan.occurences > kingside.plan.occurences;
    return (
      <>
        You can castle to either side, although{" "}
        <PlanMoveText plan={queensideMoreCommon ? queenside : kingside}>
          castling {queensideMoreCommon ? "queenside" : "kingside"}
        </PlanMoveText>{" "}
        is most common among experts
      </>
    );
  } else if (kingside) {
    return (
      <>
        <PlanMoveText plan={kingside}>Castling kingside</PlanMoveText> is best
      </>
    );
  } else if (queenside) {
    return (
      <>
        {capitalize(side)} tends to{" "}
        <PlanMoveText plan={queenside}>Castling queenside</PlanMoveText> is best
      </>
    );
  }
}

function getPawnPlansSection(plans: MetaPlan[], side: Side): PlanSection {
  let pawnPlans = filter(plans, (p) =>
    some(["a", "b", "c", "d", "e", "f", "g", "h"], (f) =>
      p.plan.san?.startsWith(f)
    )
  );
  if (isEmpty(pawnPlans)) {
    return null;
  }
  return (
    <>
      <PlanMoves plans={pawnPlans.map((p) => p.plan)} />{" "}
      {pawnPlans.length > 1 ? "are common pawn moves" : "is a common pawn move"}
    </>
  );
}

function getPiecePlansSection(plans: MetaPlan[], side: Side): PlanSection {
  let piecePlans = filter(plans, (p) =>
    some(["N", "B", "R", "Q", "K"], (f) => p.plan.san?.startsWith(f))
  );
  if (isEmpty(piecePlans)) {
    return null;
  }
  return (
    <>
      Common piece moves include{" "}
      <PlanMoves plans={piecePlans.map((p) => p.plan)} />
    </>
  );
}

const PlanMoveText = ({ plan, children }) => {
  const { hovering, hoveringProps } = useHovering(
    () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboardState.focusedPlan = plan;
      });
    },
    () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboardState.focusedPlan = null;
      });
    }
  );
  return (
    <View style={s(c.inlineBlock, c.clickable)} {...hoveringProps}>
      <CMText style={s(c.weightBold)}>{children}</CMText>
    </View>
  );
};

const PlanMoves = ({ plans }: { plans: Plan[] }) => {
  return (
    <CMText style={s()}>
      {intersperse(
        plans.map((plan, i) => {
          return <PlanMoveText plan={plan}>{plan.san}</PlanMoveText>;
        }),
        (k, isLast) => {
          return (
            <CMText key={k} style={s()}>
              {isLast ? (plans.length > 2 ? ", and " : " and ") : ", "}
            </CMText>
          );
        }
      )}
    </CMText>
  );
};
