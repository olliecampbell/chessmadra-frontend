import { LichessPuzzle } from 'app/models'
import client from 'app/client'
import { fakePuzzle, fakeBlackPuzzle } from 'app/mocks/puzzles'
import { cloneDeep } from 'lodash'
import { DEBUG_MOCK_FETCH } from './test_settings'

interface PuzzleFetchOptions {
  ratingGte?: number
  ratingLte?: number
  maxPly?: number
}

let flipper = 0
export const fetchNewPuzzle = async ({
  ratingGte,
  ratingLte,
  maxPly
}: PuzzleFetchOptions): Promise<LichessPuzzle> => {
  if (DEBUG_MOCK_FETCH) {
    console.log('Returning mock puzzle')
    let puzzle = flipper % 2 === 0 ? fakeBlackPuzzle : fakePuzzle
    flipper += 1
    return cloneDeep(puzzle)
  }
  try {
    let response = await client.post('/api/v2/tactic', {
      maxPly,
      ratingGte,
      ratingLte,
      playerRatingGte: 1600
    })
    // @ts-ignore
    return response.data.tactic as LichessPuzzle
  } catch (error) {
    console.log(error)
  }
}
