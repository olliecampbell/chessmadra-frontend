import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  capitalize,
  cloneDeep,
  filter,
  isEmpty,
  isNil,
  takeRight,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { keyBy, groupBy } from "lodash";
import { intersperse } from "app/utils/intersperse";
import {
  RepertoireState,
  useRepertoireState,
} from "app/utils/repertoire_state";
import {
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  SIDES,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { Modal } from "./Modal";
import { SelectOneOf } from "./SelectOneOf";
import { CMTextInput } from "./TextInput";
import { failOnTrue } from "app/utils/test_settings";
import client from "app/client";
import { DragAndDropInput } from "./DragAndDropInput";
import { RepertoireTemplate } from "app/models";
import { GridLoader } from "react-spinners";
import { CMText } from "./CMText";

const MOBILE_CUTOFF = 800;

export const PlayerTemplateWizard = ({ state }: { state: RepertoireState }) => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  if (isEmpty(state.playerTemplates)) {
    return null;
  }
  return (
    <View style={s(c.column)}>
      {state.inProgressUsingPlayerTemplate && (
        <GridLoader color={c.primaries[40]} size={20} />
      )}
      {!state.inProgressUsingPlayerTemplate && (
        <View style={s(c.column, c.fullWidth)}>
          {intersperse(
            state.playerTemplates.map((playerTemplate, i) => {
              return (
                <Pressable
                  onPress={() => {
                    state.usePlayerTemplate(playerTemplate.id);
                  }}
                >
                  <View
                    style={s(
                      c.bg(c.grays[15]),
                      c.br(4),
                      c.px(16),
                      c.py(16),
                      c.constrainWidth,
                      c.column
                    )}
                  >
                    <View style={s(c.row, c.alignCenter)}>
                      <img
                        src={playerTemplate.meta.image}
                        style={s(
                          c.size(isMobile ? 32 : 54),
                          c.round,
                          c.border(`2px solid ${c.grays[80]}`)
                        )}
                      />
                      <Spacer width={isMobile ? 12 : 16} />
                      <View style={s(c.column, c.flexible)}>
                        <CMText
                          style={s(
                            c.fg(c.colors.textPrimary),
                            c.weightSemiBold,
                            c.fontSize(isMobile ? 16 : 20)
                          )}
                        >
                          {playerTemplate.meta.title}
                        </CMText>
                        {/*
                        <Spacer height={8} />
                        <CMText
                          style={s(
                            c.fg(c.colors.textSecondary),
                            c.weightRegular,
                            c.fontSize(14)
                          )}
                        >
                          {playerTemplate.meta.description}
                        </CMText>
                        */}
                      </View>
                      {/*
                      <Spacer width={12} />
                      <i
                        className="fa-light fa-angle-right"
                        style={s(
                          c.fontSize(42),
                          c.fg(c.grays[50]),
                          c.unshrinkable,
                          c.selfCenter
                        )}
                      />
                      */}
                    </View>
                    <Spacer height={12} />
                    <View style={s(c.row, c.flexWrap, c.gap(6))}>
                      {playerTemplate.meta.openings.map((x, i) => {
                        return (
                          <CMText
                            style={s(
                              c.px(isMobile ? 6 : 6),
                              c.py(isMobile ? 6 : 6),
                              c.fg(c.colors.textInverseSecondary),
                              c.fontSize(isMobile ? 14 : 14),
                              c.weightSemiBold,
                              c.br(2),
                              c.bg(c.grays[80])
                            )}
                          >
                            {x}
                          </CMText>
                        );
                      })}
                    </View>
                  </View>
                </Pressable>
              );
            }),
            (i) => {
              return (
                <Spacer height={12} width={12} isMobile={isMobile} key={i} />
              );
            }
          )}
        </View>
      )}
    </View>
  );
};
