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
  reverse,
  keyBy,
  forEach,
  map,
  cloneDeep,
  mapValues,
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
import { Side, toSide } from "app/utils/repertoire";
import { View } from "react-native";
import { getPlanPiece, MetaPlan } from "app/utils/plans";
import { useHovering } from "app/hooks/useHovering";
import { Chess, SQUARES } from "@lubert/chess.ts";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";

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
  let [currentEpd, planSections] = useSidebarState(([s]) => [
    s.currentEpd,
    cloneDeep(s.planSections),
  ]);
  const [activeSide] = useBrowsingState(([s, rs]) => [s.activeSide]);
  let [plans, position] = useRepertoireState((s) => [
    s.positionReports[currentEpd]?.plans ?? [],
    s.browsingState.chessboardState.position,
  ]);

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
              s.repertoireState.browsingState.dismissTransientSidebarState();
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
      {!isEmpty(planSections) ? (
        <>
          <CMText
            style={s(c.weightBold, c.fontSize(14), c.fg(c.colors.textPrimary))}
          >
            How to play from here
          </CMText>
          <Spacer height={18} />
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
                    <CMText style={s(c.fg(c.colors.textPrimary))}>
                      {section}
                    </CMText>
                  </View>
                );
              }),
              (k) => {
                return <Spacer key={k} height={12} />;
              }
            )}
          </View>
        </>
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
