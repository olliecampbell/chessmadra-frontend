import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, Pressable, View, Platform } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  ChessboardView,
  PieceView,
} from "app/components/chessboard/Chessboard";
import { cloneDeep, isEmpty, isNil, takeRight, chunk } from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import {
  BlindfoldTrainingStage,
  BlindfoldTrainingState,
  BlunderRecognitionDifficulty,
  GamesSearchState,
  BlunderRecognitionTab,
  FinishedBlunderPuzzle,
  GameSearchResult,
  getBlunderRange,
  useBlindfoldTrainingStore,
  useBlunderRecognitionStore,
  useGamesSearchState,
  MIN_ELO,
  MAX_ELO,
} from "../utils/state";
import { chunked, intersperse } from "../utils/intersperse";
import { Chess, Piece, SQUARES } from "@lubert/chess.ts";
import { NewPuzzleButton } from "app/NewPuzzleButton";
import { useHelpModal } from "./useHelpModal";
import { Modal } from "./Modal";
import { SettingsTitle } from "./SettingsTitle";
import { SelectOneOf } from "./SelectOneOf";
import { SelectRange } from "./SelectRange";
import {
  getPuzzleDifficultyRating,
  getPuzzleDifficultyStepValue,
  PuzzleDifficulty,
  stepValueToPuzzleDifficulty,
} from "app/types/VisualizationState";
import { NavBar } from "./NavBar";
import axios from "axios";
import { LichessGame } from "app/models";
import client from "app/client";
import BeatLoader from "react-spinners/BeatLoader";
import { PageContainer } from "./PageContainer";
import { LichessGameCell } from "./LichessGameCell";
import { formatGameResult } from "app/utils/formatGameResult";
import { useHasBetaAccess } from "app/utils/useHasBetaAccess";
import { CMText } from "./CMText";

const pieceToKey = (piece: Piece) => {
  return `${piece.type}-${piece.color}`;
};

const DIVIDER_COLOR = c.grays[15];
const DIVIDER_SIZE = 2;
const PIECE_TYPES = ["k", "q", "r", "b", "n", "p"];
const COLORS = ["w", "b"];
const MAX_BLUNDERS = 10;

export const GamesSearch = () => {
  const isMobile = useIsMobile();
  const state = useGamesSearchState();
  const hasBetaAccess = useHasBetaAccess();
  console.log("state whiteRating", state.whiteRating);
  // const pieces = state.chessState.position
  //   .board()
  //   .flat()
  //   .filter((sq) => sq !== null);
  const sectionTitleStyles = s(
    c.fontSize(18),
    c.weightSemiBold,
    c.fg(c.colors.textPrimary),
    c.selfStretch,
    c.pb(4),
    c.mb(16),
    c.borderBottom(`1px solid ${c.grays[30]}`)
  );
  const createSlider = (title, key, min, max, step) => {
    return (
      <>
        <CMText style={s(sectionTitleStyles)}>{title}</CMText>
        <div style={s(c.selfStretch, c.px(12))}>
          <SelectRange
            min={min}
            max={max}
            step={step}
            range={state[key]}
            onChange={function ([lower, upper]): void {
              state.quick((s) => {
                s[key] = [lower, upper];
              });
            }}
            onFinish={function (): void {}}
          />
        </div>
      </>
    );
  };
  const formSections = [
    <>
      <CMText style={s(sectionTitleStyles)}>Result</CMText>
      <SelectOneOf
        choices={[
          null,
          GameSearchResult.White,
          GameSearchResult.Draw,
          GameSearchResult.Black,
        ]}
        // cellStyles={s(c.bg(c.grays[15]))}
        horizontal={true}
        activeChoice={state.gameResult}
        onSelect={function (c): void {
          state.quick((s) => {
            s.gameResult = c;
          });
        }}
        renderChoice={(r: GameSearchResult) => {
          return r !== null ? formatGameResult(r) : "Any";
        }}
      />
    </>,
    createSlider("Number of Moves", "numberMoves", 0, 80, 1),
    createSlider("White Rating", "whiteRating", MIN_ELO, MAX_ELO, 50),
    createSlider("Black Rating", "blackRating", MIN_ELO, MAX_ELO, 50),
    // createSlider("White Blunders", "whiteBlunders", 0, 10, 1),
    // createSlider("Black Blunders", "blackBlunders", 0, MAX_BLUNDERS, 1),
  ];
  let inner = null;
  if (state.loading) {
    inner = (
      <View style={s(c.center, c.minHeight("80vh"))}>
        <BeatLoader color={c.grays[100]} size={20} />;
      </View>
    );
  } else if (!isEmpty(state.returnedGames)) {
    inner = (
      <View style={s(c.containerStyles(isMobile), c.alignStart)}>
        <Button
          style={s(c.buttons.primary)}
          onPress={() => {
            state.quick((s) => {
              s.returnedGames = [];
            });
          }}
        >
          <CMText style={s(c.buttons.primary.textStyles, c.fontSize(18))}>
            <i
              style={s(c.fg(c.colors.textPrimary))}
              className="fas fa-angle-left"
            ></i>
            <Spacer width={8} />
            Modify search
          </CMText>
        </Button>
        <Spacer height={24} />
        {chunked(
          state.returnedGames.map((game, i) => {
            let link = `https://lichess.org/${game.id}`;
            if (game.result === -1) {
              link += "/black";
            }
            return (
              <View style={s(c.column)}>
                <a href={link} target="_blank">
                  <LichessGameCell game={game} />
                </a>
                {hasBetaAccess && (
                  <>
                    <Button
                      style={s(c.buttons.primary)}
                      onPress={() => {
                        client.post("/api/v1/my_games/add", {
                          gameIds: [game.id],
                        });
                      }}
                    >
                      Add to memorized games
                    </Button>
                  </>
                )}
              </View>
            );
          }),
          (i) => {
            return <Spacer width={12} key={i} />;
          },
          isMobile ? 1 : 2,
          (i) => {
            return <Spacer height={12} key={i} />;
          },
          (children) => {
            return <View style={s(c.row)}>{children}</View>;
          }
        )}
      </View>
    );
  } else {
    inner = (
      <>
        <View
          style={s(
            c.bg(c.grays[15]),
            c.br(4),
            // c.fullWidth,
            // c.selfStretch,
            c.fullWidth,
            c.maxWidth(900),
            c.containerStyles(isMobile),
            c.px(12),
            c.py(12),
            c.alignStretch,
            c.column
          )}
        >
          <CMText
            style={s(
              c.fg(c.colors.textPrimary),
              c.lineHeight("1.5em"),
              c.fontSize(14)
              // c.maxWidth(600)
            )}
          >
            This is a tool to search through games from the{" "}
            <a
              style={s(c.borderBottom(`1px solid ${c.grays[50]}`), c.pb(2))}
              href="https://database.nikonoel.fr/"
            >
              Lichess Elite Database
            </a>
            . Includes all the games played by players 2300+, since June 2020.
            Some example searches:
            <br />
            <Spacer height={12} />
            <View style={s(c.column)}>
              <ExampleGame
                {...{
                  name: "Games where White won against the Falkbeer Countergambit",
                  moves: ["e4", "e5", "f4", "d5"],
                  state: state,
                  // whiteRating: [2200, 2800],
                  // blackRating: [2200, 2800],
                  numberMoves: [0, 30],
                  // whiteBlunders: [0, 0],
                  // blackBlunders: [0, MAX_BLUNDERS],
                  gameResult: GameSearchResult.White,
                }}
              />
              <Spacer height={8} />
              <ExampleGame
                {...{
                  name: "Games where Black fell for the early bishop trap in the Caro-Kann",
                  moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "h4", "e6"],
                  state: state,
                  // whiteRating: [0, 2500],
                  // blackRating: [0, 2500],
                  numberMoves: [6, 50],
                  // whiteBlunders: [0, 0],
                  // blackBlunders: [0, MAX_BLUNDERS],
                  gameResult: null,
                }}
              />
              <Spacer height={8} />
            </View>
          </CMText>
        </View>
        <Spacer height={24} />
        <View
          style={s(
            c.bg(c.grays[15]),
            c.br(4),
            // c.fullWidth,
            // c.selfStretch,
            c.fullWidth,
            c.maxWidth(900),
            c.containerStyles(isMobile),
            c.px(12),
            c.py(12),
            c.alignStretch,
            c.column
          )}
        >
          <>
            <CMText style={s(sectionTitleStyles)}>Opening</CMText>
            <CMText style={s(c.fg(c.colors.textSecondary))}>
              Play out moves on the board to search for games that feature that
              opening.
            </CMText>
            <Spacer height={12} />
            <View
              style={s(
                c.maxWidth(400),
                c.column,
                c.alignEnd,
                c.selfCenter,
                c.fullWidth
              )}
            >
              <ChessboardView state={state} />
              {state.position.history().length > 0 && (
                <>
                  <Spacer height={12} />
                  <Button
                    style={s(c.buttons.basic)}
                    onPress={() => {
                      state.quick((s) => {
                        s.position.undo();
                      });
                    }}
                  >
                    <CMText
                      style={s(
                        c.buttons.basic.textStyles,
                        c.row,
                        c.alignCenter
                      )}
                    >
                      <i
                        style={s(c.fg(c.colors.textInverse))}
                        className="fas fa-undo"
                      ></i>
                      <Spacer width={8} />
                      Undo
                    </CMText>
                  </Button>
                </>
              )}
            </View>
          </>
          <Spacer height={24} />
          {chunked(
            formSections.map((section, i) => {
              return (
                <View style={s(c.column, c.flexible, c.alignStart)}>
                  {section}
                </View>
              );
            }),
            (i) => {
              return <Spacer width={24} key={i} />;
            },
            isMobile ? 1 : 2,
            (i) => {
              return <Spacer height={48} key={i} />;
            },
            (children) => {
              return <View style={s(c.row, c.fullWidth)}>{children}</View>;
            }
          )}
          <Spacer height={48} />
          <Button
            style={s(c.buttons.primary, c.selfEnd)}
            onPress={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              (async () => {
                state.quick((s) => {
                  s.loading = true;
                });
                let response = await client.post("/api/v1/games", {
                  whiteRating: state.whiteRating,
                  // whiteBlunders: state.whiteBlunders,
                  blackRating: state.blackRating,
                  // blackBlunders: state.blackBlunders,
                  numberMoves: state.numberMoves,
                  result: state.gameResult,
                  opening: state.position.history(),
                });
                // @ts-ignore
                state.quick((s) => {
                  s.returnedGames = response.data as LichessGame[];
                  s.loading = false;
                });
              })();
            }}
          >
            <CMText style={s(c.buttons.primary.textStyles, c.fontSize(18))}>
              <i
                style={s(c.fg(c.colors.textPrimary))}
                className="fas fa-search"
              ></i>
              <Spacer width={8} />
              Find Games
            </CMText>
          </Button>
        </View>
      </>
    );
  }
  return <PageContainer>{inner}</PageContainer>;
};

const ExampleGame = ({
  name,
  moves,
  // whiteRating,
  // blackRating,
  numberMoves,
  // whiteBlunders,
  // blackBlunders,
  gameResult,
  state,
}: {
  name: string;
  moves: string[];
  // whiteRating: [number, number];
  // blackRating: [number, number];
  numberMoves: [number, number];
  // whiteBlunders: [number, number];
  // blackBlunders: [number, number];
  gameResult: GameSearchResult;
  state: GamesSearchState;
}) => {
  return (
    <View style={s()}>
      <Button
        onPress={() => {
          state.quick((s) => {
            // s.whiteRating = whiteRating;
            // s.blackRating = blackRating;
            s.numberMoves = numberMoves;
            // s.whiteBlunders = whiteBlunders;
            // s.blackBlunders = blackBlunders;
            s.gameResult = gameResult;
            s.position = new Chess();
            moves.map((move) => {
              s.position.move(move);
            });
          });
        }}
        style={s(c.row, c.alignStart)}
      >
        <i
          style={s(c.fg(c.colors.textPrimary), c.mt(4))}
          className="fas fa-angle-right"
        ></i>
        <Spacer width={8} />
        <CMText
          style={s(c.fg(c.colors.textPrimary), c.weightBold, c.fontSize(14))}
        >
          {name}
        </CMText>
      </Button>
    </View>
  );
};
