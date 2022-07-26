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

const MOBILE_CUTOFF = 800;

export const RepertoireTemplateWizard = ({
  state,
}: {
  state: RepertoireState;
}) => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  return (
    <View style={s(c.column)}>
      <View style={s(isMobile ? c.column : c.row, c.fullWidth)}>
        {intersperse(
          SIDES.map((side, i) => {
            let inner = null;
            if (side === "white") {
              inner = <WhiteTemplates state={state} />;
            } else {
              inner = <BlackTemplates state={state} />;
            }
            return (
              <View
                style={s(
                  c.bg(c.grays[20]),
                  c.px(12),
                  c.py(12),
                  !isMobile && s(c.flexible, c.grow)
                )}
              >
                <Text
                  style={s(
                    c.fg(c.colors.textPrimary),
                    c.fontSize(18),
                    c.weightSemiBold
                  )}
                >
                  {capitalize(side)}
                </Text>
                <Spacer height={12} />
                {inner}
              </View>
            );
          }),
          (i) => {
            return (
              <Spacer height={12} width={12} isMobile={isMobile} key={i} />
            );
          }
        )}
      </View>
      <Spacer height={12} />
      <Button
        style={s(c.buttons.primary, c.selfEnd)}
        onPress={() => {
          state.addTemplates(state);
        }}
      >
        Continue
      </Button>
    </View>
  );
};

export const WhiteTemplates = ({ state }: { state: RepertoireState }) => {
  const [firstMove, setFirstMove] = useState("e4" as "e4" | "d4");
  return (
    <View style={s()}>
      <View style={s(c.row, c.fullWidth, c.justifyCenter)}>
        <SelectOneOf
          tabStyle
          choices={["d4", "e4"] as ("e4" | "d4")[]}
          activeChoice={firstMove}
          textStyles={s(c.fontSize(18))}
          horizontal
          onSelect={(move) => {
            setFirstMove(move);
          }}
          renderChoice={(move) => {
            return <Text>{move}</Text>;
          }}
        />
      </View>
      <Spacer height={24} />
      {firstMove === "e4" ? (
        <>
          <SelectTemplate line="1.e4 e5" state={state} />
          <Spacer height={24} />
          <SelectTemplate line="1.e4 c5" state={state} />
          <Spacer height={24} />
          <Text style={s(c.fg(c.colors.textPrimary))}>
            Which of the following openings would you like to include some
            mainline responses for?
          </Text>
          <Spacer height={8} />
          {intersperse(
            ["1.e4 d5", "1.e4 e6", "1.e4 c6", "1.e4 d6", "1.e4 g6"].map(
              (x, i) => {
                return <SelectTemplate line={x} state={state} />;
              }
            ),
            (i) => {
              return <Spacer height={4} key={i} />;
            }
          )}
        </>
      ) : (
        <View style={s(c.row)}>
          <Text style={s(c.fg(c.colors.textPrimary))}>
            Sorry, there aren't any templates for d4 yet. They should be added
            soon.
          </Text>
        </View>
      )}
    </View>
  );
};
export const BlackTemplates = ({ state }: { state: RepertoireState }) => {
  const [firstMove, setFirstMove] = useState("e4" as "e4" | "d4");
  return (
    <View style={s()}>
      <Spacer height={50} />
      <SelectTemplate line="1.e4" state={state} />
      <Spacer height={24} />
      <SelectTemplate line="1.d4" state={state} />
      <Spacer height={24} />
      <Text style={s(c.fg(c.colors.textPrimary))}>
        Which of the following openings would you like to include some mainline
        responses for?
      </Text>
      <Spacer height={8} />
      {intersperse(
        ["1.c4", "1.Nf3"].map((x, i) => {
          return <SelectTemplate line={x} state={state} />;
        }),
        (i) => {
          return <Spacer height={4} key={i} />;
        }
      )}
    </View>
  );
};

export const SelectTemplate = ({
  state,
  line,
}: {
  state: RepertoireState;
  line: string;
}) => {
  const templates = filter(state.repertoireTemplates, (t) => t.line === line);
  const singular = templates.length === 1;
  return (
    <View style={s(c.column)}>
      {!singular && (
        <>
          <Text style={s(c.fg(c.colors.textPrimary))}>
            How do you want to respond to <b>{line}</b>?
          </Text>
          <Spacer height={8} />
        </>
      )}
      {singular ? (
        <TemplateCell singular state={state} template={templates[0]} />
      ) : (
        intersperse(
          templates.map((template, i) => {
            return <TemplateCell {...{ state, template }} />;
          }),
          (i) => {
            return <Spacer height={4} key={i} />;
          }
        )
      )}
    </View>
  );
};

export const TemplateCell = ({
  state,
  template,
  singular,
}: {
  state: RepertoireState;
  template: RepertoireTemplate;
  singular?: boolean;
}) => {
  const selected = state.selectedTemplates[template.line] === template.id;
  return (
    <Pressable
      onPress={() => {
        state.quick((s) => {
          if (selected) {
            delete s.selectedTemplates[template.line];
          } else {
            s.selectedTemplates[template.line] = template.id;
          }
        });
      }}
    >
      <View
        style={s(
          c.row,
          c.alignCenter,
          selected ? c.bg(c.grays[15]) : c.bg(c.grays[15]),
          c.br(2),
          c.overflowHidden,
          c.px(12),
          c.py(8)
        )}
      >
        <i
          className={
            selected
              ? singular
                ? "fas fa-circle-check"
                : "fas fa-circle"
              : "fa-regular fa-circle"
          }
          style={s(c.fontSize(14), c.fg(selected ? c.grays[80] : c.grays[50]))}
        />
        <Spacer width={12} />
        <View style={s(c.column, c.mt(-1), c.grow)}>
          <View style={s(c.row, c.fullWidth)}>
            <Text
              style={s(
                c.fg(c.colors.textPrimary),
                c.fontSize(14),
                c.weightSemiBold
              )}
            >
              {template.title}
            </Text>
            {template.followUp && (
              <>
                <Spacer grow />
                {singular && (
                  <>
                    <Text style={s(c.fg(c.grays[70]), c.fontSize(12))}>
                      {template.line}{" "}
                    </Text>
                  </>
                )}
                <Text style={s(c.fg(c.grays[70]), c.fontSize(12))}>
                  {template.followUp}
                </Text>
              </>
            )}
          </View>
          {!isEmpty(template.tags) && (
            <>
              <Spacer height={4} />
              <View style={s(c.row)}>
                {intersperse(
                  template.tags.map((x, i) => {
                    return (
                      <Text
                        style={s(
                          c.fg(c.grays[70]),
                          c.fontSize(12),
                          c.bg(c.grays[20]),
                          c.px(8),
                          c.py(2),
                          c.br(2)
                        )}
                      >
                        {x}
                      </Text>
                    );
                  }),
                  (i) => {
                    return <Spacer width={4} key={i} />;
                  }
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
};
