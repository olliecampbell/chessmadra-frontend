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

export function pgnToLine(line: string): string[] {
  return line.replaceAll(/\d+\./g, "").split(" ");
}

export type Repertoire = BySide<RepertoireSide>;

export interface BySide<T> {
  white: T;
  black: T;
}

export type Side = "black" | "white";
export const SIDES: Side[] = ["white", "black"];

export interface RepertoireSide {
  moves: RepertoireMove[];
  side: Side;
}

export function getAllRepertoireMoves(r: Repertoire): RepertoireMove[] {
  if (!r) {
    return [];
  }
  return [...r.black.moves, ...r.white.moves];
}

export interface RepertoireMove {
  id: string;
  sanPlus: string;
  mine: boolean;
  side: Side;
  needsReview: boolean;
  firstReview: boolean;
  pending?: boolean;
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
