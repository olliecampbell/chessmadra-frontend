import { BlunderPuzzle, LichessPuzzle } from "~/utils/models";
import client from "~/utils/client";
import { isDevelopment } from "./env";
import { MOCK_BLACK_PUZZLE, MOCK_WHITE_PUZZLE } from "~/mocks/puzzles";

interface PuzzleFetchOptions {
  ratingGte?: number;
  ratingLte?: number;
  maxPly?: number;
}

let flipper = 0;
const MOCK_RESPONSES = false;

export const fetchNewPuzzle = async (
  args: PuzzleFetchOptions
): Promise<LichessPuzzle> => {
  if (MOCK_RESPONSES && isDevelopment) {
    flipper++;
    if (flipper % 2 === 0) {
      return MOCK_WHITE_PUZZLE;
    } else {
      return MOCK_BLACK_PUZZLE;
    }
  }
  try {
    const response = await client.post("/api/v2/tactic", {
      ...args,
    });
    // @ts-ignore
    return response.data.tactic as LichessPuzzle;
  } catch (error) {
    console.log(error);
  }
};

export const fetchNewBlunderPuzzle = async ({
  centipawn_loss_max,
  centipawn_loss_min,
  limit,
}: {
  centipawn_loss_max: number;
  centipawn_loss_min: number;
  limit: number;
}): Promise<BlunderPuzzle[]> => {
  try {
    const response = await client.post("/api/v1/blunder_puzzle", {
      centipawn_loss_min,
      centipawn_loss_max,
      limit,
    });
    // @ts-ignore
    return response.data as BlunderPuzzle[];
  } catch (error) {
    console.log(error);
  }
};
