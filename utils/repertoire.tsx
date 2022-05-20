import { LichessGame } from "app/models";
import { forEach } from "lodash";

export function sideOfLastmove(line: string[]): Side {
  if (line.length % 2 === 1) {
    return "white";
  } else {
    return "black";
  }
}

export function lineToPgn(line: string[]): string {
  let pgn = "";
  forEach(line, (m, j) => {
    let i = j / 2 + 1;
    if (j % 2 === 1) {
      pgn = `${pgn} ${m}`;
    } else {
      pgn = `${pgn} ${i}.${m}`;
    }
  });

  return pgn.trim();
}

export type Repertoire = BySide<RepertoireSide>;

export interface BySide<T> {
  white: T;
  black: T;
}

export type Side = "black" | "white";

export interface RepertoireSide {
  tree: RepertoireMove[];
  side: Side;
}

export interface RepertoireMove {
  id: string;
  sanPlus: string;
  mine: boolean;
  side: Side;
  responses: RepertoireMove[];
}

export type MoveIdentifier = string;
export type SanPlus = string;

export interface RepertoireGrade {
  moveIncidence: Record<MoveIdentifier, number>;
  expectedDepth: number;
  exampleGames: LichessGame[];
  biggestMiss: RepertoireMiss;
}

export interface RepertoireMiss {
  move: RepertoireMove;
  incidence: number;
}

export interface PendingLine {
  knownLine: SanPlus[];
  pendingLine: SanPlus[];
}
