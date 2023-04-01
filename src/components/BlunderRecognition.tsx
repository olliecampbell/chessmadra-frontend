import React, { useEffect } from "react";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { TrainerLayout } from "~/components/TrainerLayout";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "../utils/intersperse";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { CMText } from "./CMText";
import { useBlunderRecognitionState } from "~/utils/app_state";
import {
  BlunderRecognitionDifficulty,
  getBlunderRange,
} from "~/utils/blunders_state";
import { BLUNDER_DESCRIPTION } from "./NavBar";
import { trackEvent } from "~/utils/trackEvent";
import { trackModule } from "~/utils/user_state";

export const Score = ({ score, text }) => {
  return (
    <div style={s(c.column, c.alignCenter)}>
      <CMText
        style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}
      >
        {text}
      </CMText>
      <Spacer height={4} />
      <CMText style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score}
      </CMText>
    </div>
  );
};

export const BlunderRecognition = () => {
  const isMobile = useIsMobile();
  const state = useBlunderRecognitionState((s) => s);
  useEffect(() => {
    trackModule("blunder_recognition");
  }, []);
  useEffect(() => {
    state.prefetchPuzzles();
  }, []);
  return (
    <PageContainer>
      <HeadSiteMeta
        siteMeta={{
          title: "Blunder Recognition Training",
          description: BLUNDER_DESCRIPTION,
        }}
      />
      <TrainerLayout
        chessboard={
          <ChessboardView
            {...{
              state: state.chessboardState,
            }}
          />
        }
      >
        <div style={s()}>
          {state.isPlaying && !state.donePlaying && (
            <div style={s(c.column, c.alignCenter)}>
              <CMText style={s(c.fg(c.grays[70]), c.fontSize(16))}>
                <CMText
                  style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}
                >
                  {state.chessboardState.position.turn() === "b"
                    ? "Black"
                    : "White"}
                </CMText>{" "}
                is thinking of playing{" "}
                <CMText
                  style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}
                >
                  {state.currentMove}
                </CMText>
              </CMText>
              <Spacer height={24} />
              <div style={s(c.row, c.alignCenter)}>
                <Button
                  onPress={() => {
                    trackEvent("blunder_recognition.guess");
                    state.guess(false);
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Good move
                </Button>
                <Spacer width={24} />
                <Button
                  onPress={() => {
                    trackEvent("blunder_recognition.guess");
                    state.guess(true);
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Blunder
                </Button>
              </div>
            </div>
          )}
          {!state.isPlaying && !state.donePlaying && (
            <div style={s(c.column)}>
              <div
                style={s(
                  c.bg(c.grays[20]),
                  c.column,
                  c.center,
                  c.py(12),
                  c.px(12),
                  c.rounded
                )}
              >
                <div style={s(c.row, c.fullWidth)}>
                  {intersperse(
                    [
                      BlunderRecognitionDifficulty.Easy,
                      BlunderRecognitionDifficulty.Medium,
                      BlunderRecognitionDifficulty.Hard,
                    ].map((x) => {
                      const isActive = x === state.difficulty.value;
                      return (
                        <Button
                          onPress={() => {
                            state.quick((s) => {
                              s.difficulty.value = x;
                              s.prefetchPuzzles();
                            });
                          }}
                          style={s(
                            c.buttons.basic,
                            isActive && c.bg(c.grays[80]),
                            !isActive && c.bg(c.grays[60]),
                            c.flexible
                          )}
                        >
                          <div style={s(c.column, c.alignCenter)}>
                            <CMText style={s(c.buttons.basic.textStyles)}>
                              {x}
                            </CMText>
                          </div>
                        </Button>
                      );
                    }),
                    (i) => {
                      return <Spacer key={i} width={8} />;
                    }
                  )}
                </div>
                <Spacer height={12} />
                <CMText
                  style={s(
                    c.fg(c.colors.textSecondary),
                    c.fontSize(14),
                    c.weightRegular,
                    c.selfStart
                  )}
                >
                  {state.difficulty.value ===
                  BlunderRecognitionDifficulty.Easy ? (
                    <>
                      Blunders will lose more than{" "}
                      {getBlunderRange(state.difficulty.value)[0]} centipawns.
                    </>
                  ) : (
                    <>
                      Blunders will lose between{" "}
                      {getBlunderRange(state.difficulty.value)[0]} and{" "}
                      {getBlunderRange(state.difficulty.value)[1]} centipawns.
                    </>
                  )}
                </CMText>
                <Spacer height={8} />
                <CMText style={s(c.fg(c.colors.textSecondary))}>
                  Determine whether each move is a blunder, or the best move.
                  You can review the positions you missed when the round ends.
                </CMText>
                <Spacer height={8} />
                <CMText style={s(c.fg(c.colors.textSecondary))}>
                  Blunders taken from lichess rapid games between 2000+ ELO
                  players, and verified with Stockfish 14 at a depth of 100k
                  nodes.
                </CMText>
                <Spacer height={12} />
                <Button
                  onPress={() => {
                    state.startPlaying();
                    trackEvent("blunder_recognition.start");
                  }}
                  style={s(c.buttons.primary, c.fullWidth)}
                >
                  Start
                </Button>
              </div>
            </div>
          )}
          {state.donePlaying && (
            <div style={s(c.column, c.alignCenter)}>
              <CMText
                style={s(
                  c.fg(
                    state.wasCorrect ? c.primaries[60] : c.colors.failureLight
                  ),
                  c.weightSemiBold,
                  c.fontSize(16)
                )}
              >
                <i
                  class={`fa ${
                    state.wasCorrect ? "fa-check" : "fa-warning"
                  }`}
                />
                <Spacer width={12} />
                {state.currentMove}{" "}
                {state.isBlunder ? "is a blunder" : "is the best move"}
              </CMText>
              <Spacer height={24} />
              <div style={s(c.row)}>
                <Button
                  onPress={() => {
                    window.open(
                      `https://lichess.org/analysis/${state.currentPuzzle.fen}`,
                      "_blank"
                    );
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Analyze
                </Button>
                <Spacer width={12} />
                <Button
                  onPress={() => {
                    state.setupNextRound();
                    trackEvent("blunder_recognition.next_puzzle");
                  }}
                  style={s(c.buttons.primary, c.width(140))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </TrainerLayout>
    </PageContainer>
  );
};
