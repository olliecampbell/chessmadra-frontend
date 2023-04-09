import { s, c } from "~/utils/styles";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";
import { For } from "solid-js";

export const SelectOneOf = <T,>(props: {
  choices: T[];
  tabStyle?: boolean;
  activeChoice: T;
  onSelect: (_: T, i?: number) => void;
  equality?: (x: T, y: T) => boolean;
  horizontal?: boolean;
  separator?: () => JSX.Element;
  renderChoice: (x: T, active: boolean, i: number) => JSX.Element | string;
  containerStyles?: any;
  cellStyles?: any;
  textStyles?: any;
}) => {
  return (
    <div
      style={s(
        c.overflowHidden,
        props.horizontal ? c.row : c.column,
        props.containerStyles
      )}
    >
      <For each={props.choices}>
        {(choice, i) => {
          const active = props.equality
            ? props.equality(choice, props.activeChoice)
            : choice === props.activeChoice;
          console.log("props active choice", props.activeChoice);
          const isLast = () => i() == props.choices.length - 1;
          const rendered = props.renderChoice(choice, active, i());
          if (typeof rendered === "string") {
            return (
              <Pressable
                onPress={() => {
                  props.onSelect(choice, i());
                }}
                key={i}
                style={s(
                  active &&
                    props.tabStyle &&
                    c.borderBottom(`2px solid ${c.grays[90]}`),
                  c.row,
                  !props.tabStyle && c.bg(active ? c.grays[80] : c.grays[25]),
                  !props.tabStyle && c.py(8),
                  props.tabStyle && c.pb(4),
                  c.px(12),
                  !isLast() &&
                    !props.tabStyle &&
                    (props.horizontal ? c.borderRight : c.borderBottom)(
                      `1px solid ${c.grays[15]}`
                    ),
                  props.cellStyles
                )}
              >
                <CMText
                  style={s(
                    props.tabStyle
                      ? c.fg(active ? c.colors.textPrimary : c.grays[80])
                      : c.fg(
                          active ? c.colors.textInverse : c.colors.textSecondary
                        ),
                    c.weightBold,
                    props.textStyles
                  )}
                >
                  {rendered}
                </CMText>
              </Pressable>
            );
          } else {
            return rendered;
          }
        }}
      </For>
    </div>
  );
};
