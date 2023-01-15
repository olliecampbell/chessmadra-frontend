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
import { PlayFromHere } from "./TargetCoverageReachedView";

export const TransposedView = () => {
  const responsive = useResponsive();
  let [planSections] = useSidebarState(([s]) => [s.planSections]);
  console.log({ planSections });

  return (
    <SidebarTemplate
      header={"You've transposed into an existing line"}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.addPendingLine();
            });
          },
          style: "primary",
          text: "Save this move order to my repertoire",
        },
      ]}
      bodyPadding={true}
    >
      <>
        <CMText
          style={s(
            c.weightRegular,
            c.fontSize(12),
            c.fg(c.colors.textSecondary)
          )}
        >
          You don't need to add anything else. All of your moves from this
          position will still apply
        </CMText>
        {!isEmpty(planSections) && (
          <>
            <Spacer height={24} />
            <PlayFromHere isolated />
          </>
        )}
      </>
    </SidebarTemplate>
  );
};
