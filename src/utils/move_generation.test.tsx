import { expect, test } from "vitest";
import { getAllPossibleMoves } from "./move_generation";

test("move generation", () => {
  expect(
    getAllPossibleMoves({ piece: "k", square: "e4", side: "white" }),
  ).toMatchInlineSnapshot(`
      [
        "d5",
        "e5",
        "f5",
        "f4",
        "f3",
        "e3",
        "d3",
        "d4",
      ]
    `);
  expect(
    getAllPossibleMoves({ piece: "b", square: "b2", side: "white" }),
  ).toMatchInlineSnapshot(`
      [
        "a3",
        "c3",
        "d4",
        "e5",
        "f6",
        "g7",
        "h8",
        "c1",
        "a1",
      ]
    `);
  expect(
    getAllPossibleMoves({ piece: "n", square: "e4", side: "white" }),
  ).toMatchInlineSnapshot(`
      [
        "c5",
        "d6",
        "f6",
        "g5",
        "g3",
        "f2",
        "d2",
        "c3",
      ]
    `);
  expect(
    getAllPossibleMoves({ piece: "q", square: "e4", side: "white" }),
  ).toMatchInlineSnapshot(`
      [
        "d5",
        "c6",
        "b7",
        "a8",
        "e5",
        "e6",
        "e7",
        "e8",
        "f5",
        "g6",
        "h7",
        "f4",
        "g4",
        "h4",
        "f3",
        "g2",
        "h1",
        "e3",
        "e2",
        "e1",
        "d3",
        "c2",
        "b1",
        "d4",
        "c4",
        "b4",
        "a4",
      ]
    `);
  expect(
    getAllPossibleMoves({ piece: "p", square: "e2", side: "white" }),
  ).toMatchInlineSnapshot(`
      [
        "e3",
        "e4",
      ]
    `);
  expect(
    getAllPossibleMoves({ piece: "p", square: "e2", side: "black" }),
  ).toMatchInlineSnapshot(`
      [
        "e1",
      ]
    `);
});
