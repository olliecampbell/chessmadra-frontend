import { useState } from "react";
import { Modal } from "./Modal";
import { View, Text, Pressable } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import {
  AddedLineStage,
  AddLineFromOption,
  DEFAULT_ELO_RANGE,
  useRepertoireState,
} from "app/utils/repertoire_state";
import { isEqual, isNil, parseInt } from "lodash";
import { useModal } from "./useModal";
import { EloWarningBox } from "./EloWarningBox";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { lineToPgn } from "app/utils/repertoire";
import { ChessboardView } from "./chessboard/Chessboard";
import { createStaticChessState } from "app/utils/chessboard_state";
import { useIsMobile } from "app/utils/isMobile";
import { formatStockfishEval } from "app/utils/stockfish";
import { getTotalGames } from "app/utils/results_distribution";
import { GameResultsBar } from "./GameResultsBar";
import { getAppropriateEcoName } from "app/utils/eco_codes";

export const AddedLineModal = () => {
  let [stage] = useRepertoireState((s) => [s.addedLineState?.stage]);

  const isMobile = useIsMobile();
  return (
    <Modal onClose={() => {}} visible={!isNil(stage)}>
      <View
        style={s(
          c.column,
          c.bg(c.grays[90]),
          c.br(4),
          c.px(isMobile ? 8 : 16),
          c.py(16),
          c.width(600),
          c.maxWidth("calc(100vw - 16px)")
        )}
      >
        {!isNil(stage) &&
          (stage === AddedLineStage.Initial ? (
            <AddedLineOverview />
          ) : (
            <AddedLineAddMore />
          ))}
      </View>
    </Modal>
  );
};

let ModalHeader = ({ title, closeModal, icon }) => {
  return (
    <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
      <View style={s(c.row, c.alignCenter)}>
        <CMText
          style={s(c.fg(c.colors.textInverse), c.weightHeavy, c.fontSize(24))}
        >
          {title}
        </CMText>
        {icon && (
          <>
            <Spacer width={8} />
            <CMText style={s(c.fontSize(28), c.fg(c.purples[50]))}>
              <i className={icon} />
            </CMText>
          </>
        )}
      </View>
      <Spacer width={8} grow />
      <Pressable
        onPress={() => {
          closeModal();
        }}
      >
        <CMText style={s(c.fontSize(28), c.fg(c.grays[50]))}>
          <i className="fas fa-close" />
        </CMText>
      </Pressable>
    </View>
  );
};

const AddedLineAddMore = () => {
  let [addedLineState, quick, repertoireGrades, side] = useRepertoireState(
    (s) => [s.addedLineState, s.quick, s.repertoireGrades, s.activeSide]
  );
  const isMobile = useIsMobile();
  const buttonStyles = s(c.buttons.basicInverse, c.py(12), c.px(16), {
    textStyles: s(c.fontSize(14), c.fg(c.colors.textPrimary), c.weightHeavy),
  });
  const closeModal = () => {
    quick((s) => {
      s.addedLineState = null;
    });
  };
  let boardLine = lineToPgn(addedLineState.line);
  let biggestMiss = repertoireGrades[side].biggestMiss;
  if (addedLineState.addLineFrom === AddLineFromOption.BiggestMiss) {
    boardLine = biggestMiss.lines[0];
  }
  if (addedLineState.addLineFrom === AddLineFromOption.Initial) {
    boardLine = "";
  }
  const chessState = createStaticChessState({
    line: boardLine,
    side: side,
  });
  return (
    <>
      <ModalHeader
        title={"Add a new line from..."}
        icon={null}
        {...{ closeModal }}
      />
      <Spacer height={12} />
      <View style={s(c.row, c.fullWidth)}>
        <SelectOneOf
          containerStyles={s(c.grow)}
          choices={[
            AddLineFromOption.BiggestMiss,
            AddLineFromOption.Current,
            AddLineFromOption.Initial,
          ]}
          // cellStyles={s(c.bg(c.grays[15]))}
          // horizontal={true}
          activeChoice={addedLineState.addLineFrom}
          onSelect={(c) => {
            quick((s) => {
              s.addedLineState.addLineFrom = c;
            });
            // quick((s) => {
            //   s.gameResult = c;
            // });
          }}
          separator={() => {
            return <Spacer height={12} />;
          }}
          renderChoice={(r: AddLineFromOption, active: boolean) => {
            return (
              <Pressable
                onPress={() => {
                  quick((s) => {
                    s.addedLineState.addLineFrom = r;
                  });
                }}
              >
                <View
                  style={s(
                    c.py(16 - (active ? 1 : 0)),
                    c.px(12 - (active ? 1 : 0)),
                    c.column,
                    c.border(
                      `${active ? 2 : 1}px solid ${c.grays[active ? 10 : 80]}`
                    )
                  )}
                >
                  <CMText style={s(c.fg(c.colors.textInverse), c.weightBold)}>
                    {r}
                  </CMText>
                  <Spacer height={4} />
                  {r === AddLineFromOption.BiggestMiss && (
                    <CMText style={s(c.fg(c.colors.textInverseSecondary))}>
                      {(biggestMiss.incidence * 100).toFixed(1)}% of games
                    </CMText>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
        <Spacer width={24} />
        <View style={s(c.size(isMobile ? 120 : 160))}>
          <ChessboardView onSquarePress={() => {}} state={chessState} />
        </View>
      </View>
      <Spacer height={24} />
      <View style={s(c.row, c.justifyEnd, c.fullWidth)}>
        <Button
          onPress={() => {
            quick((s) => {
              s.addedLineState.stage = AddedLineStage.AddAnother;
              s.playPgn(boardLine, s);
              s.addedLineState = null;
            });
          }}
          style={s(buttonStyles)}
        >
          Continue
        </Button>
      </View>
    </>
  );
};

const AddedLineOverview = () => {
  let [addedLineState, quick, repertoireGrades, side, reviewLine] =
    useRepertoireState((s) => [
      s.addedLineState,
      s.quick,
      s.repertoireGrades,
      s.activeSide,
      s.reviewLine,
    ]);
  const isMobile = useIsMobile();
  console.log({ isMobile });
  const reportHeaderStyles = s(c.fg(c.grays[35]), c.mb(4));
  const reportValueStyles = s(c.fg(c.colors.textInverse), c.weightBold);
  const buttonStyles = s(
    c.buttons.basicInverse,
    c.py(12),
    c.px(isMobile ? 12 : 16),
    {
      textStyles: s(c.fontSize(14), c.fg(c.colors.textPrimary), c.weightHeavy),
    }
  );
  const closeModal = () => {
    quick((s) => {
      s.addedLineState = null;
    });
  };
  let [name, variations] = getAppropriateEcoName(
    addedLineState?.ecoCode?.fullName
  );
  return (
    <>
      <ModalHeader
        title={"Line saved"}
        {...{ closeModal, icon: "fas fa-check" }}
      />
      <Spacer height={12} />
      <View
        style={s(
          c.row,
          !isMobile && c.border(`1px solid ${c.grays[85]}`),
          c.constrainWidth
        )}
      >
        <View
          style={s(
            c.column,
            c.pl(isMobile ? 0 : 12),
            c.py(isMobile ? 0 : 18),
            c.flexShrink(1),
            c.constrainWidth
          )}
        >
          {addedLineState.ecoCode && (
            <View style={s(c.row, c.mb(12))}>
              <CMText
                style={s(
                  c.fg(c.colors.textInverse),
                  c.weightBold,
                  c.fontSize(16)
                )}
              >
                {addedLineState?.ecoCode?.fullName}
              </CMText>
            </View>
          )}
          <CMText style={s(c.fg(c.grays[25]))}>
            {lineToPgn(addedLineState.line)}
          </CMText>
          <Spacer height={24} grow />
          <View style={s(c.row)}>
            {addedLineState.positionReport && (
              <>
                {addedLineState.positionReport.stockfish && (
                  <View style={s(c.row, c.mr(24))}>
                    <View style={s(c.column)}>
                      <CMText style={s(reportHeaderStyles)}>
                        Stockfish Eval
                      </CMText>
                      <CMText style={s(reportValueStyles)}>
                        {formatStockfishEval(
                          addedLineState.positionReport.stockfish
                        )}
                      </CMText>
                    </View>
                  </View>
                )}
                {getTotalGames(addedLineState.positionReport.results) > 10 && (
                  <View style={s(c.row)}>
                    <View style={s(c.column)}>
                      <CMText style={s(reportHeaderStyles)}>
                        Results at your level
                      </CMText>
                      <View style={s(c.width(120))}>
                        <GameResultsBar
                          smallNumbers
                          gameResults={addedLineState.positionReport.results}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        <Spacer width={48} grow />
        <View style={s(c.size(isMobile ? 120 : 160))}>
          <ChessboardView
            onSquarePress={() => {}}
            state={createStaticChessState({
              line: lineToPgn(addedLineState.line),
              side: side,
            })}
          />
        </View>
      </View>
      <Spacer height={24} />
      <View style={s(c.row, c.justifyEnd, c.fullWidth)}>
        <Button
          onPress={() => {
            quick((s) => {
              s.addedLineState.stage = AddedLineStage.AddAnother;
            });
          }}
          style={s(buttonStyles)}
        >
          Add another line
        </Button>
        <Spacer width={isMobile ? 4 : 12} />
        <Button
          onPress={() => {
            reviewLine(addedLineState.line, side);
          }}
          style={s(buttonStyles)}
        >
          Review line
        </Button>
      </View>
    </>
  );
};
