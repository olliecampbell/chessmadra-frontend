import { BlunderPuzzle, LichessPuzzle } from "~/utils/models";
import client from "~/utils/client";

interface PuzzleFetchOptions {
  ratingGte?: number;
  ratingLte?: number;
  maxPly?: number;
}

const flipper = 0;
export const fetchNewPuzzle = async (
  args: PuzzleFetchOptions
): Promise<LichessPuzzle> => {
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
