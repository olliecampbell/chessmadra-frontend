import { ChessboardView } from "app/components/chessboard/Chessboard";
import { OPENINGS_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta, PageContainer } from "app/components/PageContainer";
import { RepertoireBuilder } from "app/components/RepertoireBuilder";
import { Spacer } from "app/Space";
import { s, c } from "app/styles";
import { intersperse } from "app/utils/intersperse";
import { useIsMobile } from "app/utils/isMobile";
import { useRepertoireState } from "app/utils/repertoire_state";
import { useEffect, useState } from "react";
import { CMText } from "app/components/CMText";
import { filter, findIndex, some } from "lodash";

import {
  Dimensions,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { Button } from "app/components/Button";
import { CMTextInput } from "app/components/TextInput";
import { onEnter } from "app/utils/onEnter";
import { SelectOneOf } from "app/components/SelectOneOf";
import { Chess } from "@lubert/chess.ts";
import { BeatLoader } from "react-spinners";

export default function Page() {
  const isMobile = useIsMobile();
  const state = useRepertoireState();
  useEffect(() => {
    state.fetchDebugGames();
  }, []);
  console.log("Game?", state.debugPawnStructuresState?.game);
  console.log("Game?", state.debugPawnStructuresState);
  let epd = state.getCurrentEpd();
  // let debugFromPosition = state.debugPawnStructuresState?.byPosition?.[epd];
  let gamesMode = state.debugPawnStructuresState?.mode === "games";
  return (
    <>
      <PageContainer>
        <Spacer height={48} />
        <View style={s(c.containerStyles(isMobile), c.row)}>
          <View style={s(c.column)}>
            <View style={s(c.width(500))}>
              <ChessboardView state={state} />
            </View>

            {true && (
              <>
                <Spacer height={12} />
                <View style={s(c.row)}>
                  <Button
                    style={s(c.buttons.basicSecondary, c.grow)}
                    onPress={() => {
                      state.quick((s) => {
                        if (gamesMode) {
                          s.selectDebugGame(
                            Math.max(s.debugPawnStructuresState.i - 1, 0),
                            s
                          );
                        } else {
                          s.backOne(s);
                        }
                      });
                    }}
                  >
                    <i
                      className="fas fa-angle-left"
                      style={s(
                        c.buttons.basicSecondary.textStyles,
                        c.fontSize(18)
                      )}
                    />
                  </Button>
                  <Spacer width={4} />
                  <Button
                    style={s(c.buttons.basicSecondary, c.grow)}
                    onPress={() => {
                      state.quick((s) => {
                        if (gamesMode) {
                          s.selectDebugGame(
                            s.debugPawnStructuresState.i + 1,
                            s
                          );
                        } else {
                          // s.backOne(s);
                        }
                      });
                    }}
                  >
                    <i
                      className="fas fa-angle-right"
                      style={s(
                        c.buttons.basicSecondary.textStyles,
                        c.fontSize(18)
                      )}
                    />
                  </Button>
                  {false && (
                    <Button
                      style={s(c.buttons.basicSecondary, c.grow)}
                      onPress={() => {
                        state.quick((s) => {
                          let i = findIndex(
                            s.debugPawnStructuresState.games,
                            (g: any) => {
                              return !some(g.pawnStructures, (s) => s.passed);
                            }
                          );
                          console.log("Index? ", i);
                          s.selectDebugGame(i, s);
                        });
                      }}
                    >
                      <i
                        className="fas fa-angles-right"
                        style={s(
                          c.buttons.basicSecondary.textStyles,
                          c.fontSize(18)
                        )}
                      />
                    </Button>
                  )}
                </View>
              </>
            )}
          </View>
          <Spacer width={48} />
          <View style={s(c.column)}>
            <SelectOneOf
              choices={["games", "manual"]}
              // cellStyles={s(c.bg(c.grays[15]))}
              horizontal={true}
              activeChoice={state.debugPawnStructuresState?.mode}
              onSelect={function(c): void {
                state.quick((s) => {
                  s.debugPawnStructuresState.mode = c;
                  if (c === "manual") {
                    s.backToStartPosition(s);
                    s.debugPawnStructuresState.pawnStructures = null;
                    s.fetchDebugPawnStructureForPosition(s);
                  } else {
                    s.selectDebugGame(s.debugPawnStructuresState.i, s);
                  }
                });
              }}
              renderChoice={(r) => {
                return r;
              }}
            />
            <Spacer height={12} />
            {state.debugPawnStructuresState?.game && gamesMode && (
              <Pressable
                style={s(c.selfStart, c.mb(12))}
                onPress={() => {
                  let link = `https://lichess.org/${state.debugPawnStructuresState?.game.id}#${state.debugPawnStructuresState.moves}`;
                  window.open(link, "_blank");
                }}
              >
                <CMText style={s(c.borderBottom(`1px solid ${c.grays[80]}`))}>
                  Game link
                </CMText>
              </Pressable>
            )}
            {state.debugPawnStructuresState?.loadingGames && (
              <BeatLoader color={c.grays[100]} size={20} />
            )}
            <View
              style={s(c.selfCenter, {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 24px",
                width: "100%",
              })}
            >
              {(state.debugPawnStructuresState?.pawnStructures ?? []).map(
                (pawnStructureDebug, i) => {
                  return <PawnStructureDebug ps={pawnStructureDebug} key={i} />;
                }
              )}
            </View>
          </View>
        </View>
      </PageContainer>
    </>
  );
}

const PawnStructureDebug = ({
  ps,
}: {
  ps: {
    passed: boolean;
    rules: any[];
    pawnStructure: {
      structure: string;
      reversed: boolean;
    };
  };
}) => {
  // let [expanded, setExpanded] = useState(Math.random() < 0.5);
  let [expanded, setExpanded] = useState(false);
  let reversed = ps?.pawnStructure?.reversed;
  return (
    <Pressable
      onPress={() => {
        setExpanded(!expanded);
      }}
      style={s(
        expanded && c.my(12),
        (expanded || ps?.passed) && c.keyedProp("grid-column")("span 2")
      )}
    >
      <View style={s(c.row, c.alignCenter)}>
        <CMText
          style={s(
            c.fontSize(expanded ? 18 : 14),
            c.fg(ps.passed ? "green" : "red")
          )}
        >
          <i
            className={`fa ${ps.passed ? "fa-circle-check" : "fa-circle-xmark"
              }`}
          />
        </CMText>
        <Spacer width={12} />
        <CMText style={s(c.fontSize(expanded ? 18 : 14))}>
          {ps?.pawnStructure?.structure}
          {reversed && " - reversed"}
        </CMText>
        <Spacer width={4} grow />

        <Pressable
          onPress={() => {
            setExpanded(!expanded);
          }}
        >
          <i className={`fa fa-plus`} />
        </Pressable>
      </View>
      {ps.rules && expanded && (
        <View style={s(c.row, c.mt(12), c.px(12))}>
          <PawnStructureRules
            rules={filter(ps?.rules, (r) => r.mine)}
            mine={true}
            reversed={reversed}
          />
          <Spacer width={12} />
          <PawnStructureRules
            rules={filter(ps?.rules, (r) => !r.mine)}
            mine={false}
            reversed={reversed}
          />
        </View>
      )}
    </Pressable>
  );
};

const PawnStructureRules = ({
  rules,
  mine,
  reversed,
}: {
  rules: { description: string; passed: boolean }[];
  mine: boolean;
  reversed: boolean;
}) => {
  let side = (mine && reversed) || (!mine && !reversed) ? "White" : "Black";
  return (
    <View style={s(c.column)}>
      <CMText style={s(c.fontSize(14), c.weightBold)}>{side}</CMText>
      <Spacer height={4} />
      {intersperse(
        rules.map((x, i) => {
          return (
            <View style={s(c.row, c.alignCenter)} key={i}>
              <CMText
                style={s(c.fontSize(14), c.fg(x.passed ? "green" : "red"))}
              >
                <i className={`fa ${x.passed ? "fa-check" : "fa-close"}`} />
              </CMText>
              <Spacer width={4} />
              <CMText style={s()}>{x.description}</CMText>
            </View>
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}
    </View>
  );
};
