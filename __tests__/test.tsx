import { describe, expect, test } from "@jest/globals";
import { Chess } from "@lubert/chess.ts";
import { getPlanSections } from "app/components/TargetCoverageReachedView";
import { Plan } from "app/models";
import { getTopPlans } from "app/utils/plans";

describe("plan describer", () => {
  test("Basics", () => {
    let plans = [
      {
        san: "O-O-O",
        occurences: 1,
        fromSquare: "e1",
        toSquare: "c1",
        side: "white",
      } as Plan,
      {
        san: "c3",
        occurences: 1,
        fromSquare: "c2",
        toSquare: "c3",
        side: "white",
      } as Plan,
      {
        san: "d3",
        occurences: 1,
        fromSquare: "d2",
        toSquare: "d3",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Knight development", () => {
    let plans = [
      {
        san: "Nf3",
        occurences: 1,
        fromSquare: "g1",
        toSquare: "f3",
        side: "white",
      } as Plan,
      {
        san: "Nf3",
        occurences: 1,
        fromSquare: "g1",
        toSquare: "e2",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Bishop development", () => {
    let plans = [
      {
        san: "Bf4",
        occurences: 1,
        fromSquare: "c1",
        toSquare: "f4",
        side: "white",
      } as Plan,
      {
        san: "Bc4",
        occurences: 1,
        fromSquare: "f1",
        toSquare: "c4",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Bishop development", () => {
    let plans = [
      {
        san: "Bf4",
        occurences: 1,
        fromSquare: "c1",
        toSquare: "f4",
        side: "white",
      } as Plan,
      {
        san: "Bc4",
        occurences: 1,
        fromSquare: "f1",
        toSquare: "c4",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Bishop movement", () => {
    let plans = [
      {
        san: "Bf4",
        occurences: 1,
        fromSquare: "d2",
        toSquare: "f4",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Bishop movement", () => {
    let plans = [
      {
        san: "Bf4",
        occurences: 1,
        fromSquare: "d2",
        toSquare: "f4",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Pawn pushes", () => {
    let plans = [
      {
        san: "c3",
        occurences: 1,
        fromSquare: "c2",
        toSquare: "c3",
        side: "white",
      } as Plan,
      {
        san: "c4",
        occurences: 1,
        fromSquare: "c3",
        toSquare: "c4",
        side: "white",
      } as Plan,
    ];
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
  test("Poison pawn", () => {
    let plans = [
      {
        fromSquare: "d1",
        toSquare: "d2",
        san: "Qd2",
        side: "white",
        occurences: 3315,
      },
      {
        fromSquare: "a1",
        toSquare: "b1",
        san: "Rb1",
        side: "white",
        occurences: 2288,
      },
      {
        fromSquare: "f1",
        toSquare: "e2",
        san: "Be2",
        side: "white",
        occurences: 2094,
      },
      {
        fromSquare: "g5",
        toSquare: "f6",
        san: "Bxf6",
        side: "white",
        occurences: 1936,
      },
      {
        fromSquare: "d4",
        toSquare: "b3",
        san: "Nb3",
        side: "white",
        occurences: 1879,
      },
      {
        fromSquare: "e1",
        toSquare: "a1",
        san: "O-O-O",
        side: "white",
        occurences: 1797,
      },
      {
        fromSquare: "e4",
        toSquare: "e5",
        san: "e5",
        side: "white",
        occurences: 1613,
      },
      {
        fromSquare: "f4",
        toSquare: "f5",
        san: "f5",
        side: "white",
        occurences: 1604,
      },
      {
        fromSquare: "g5",
        toSquare: "h4",
        san: "Bh4",
        side: "white",
        occurences: 1283,
      },
      {
        fromSquare: "d4",
        toSquare: "c6",
        san: "Nxc6",
        side: "white",
        occurences: 1214,
      },
      {
        fromSquare: "b8",
        toSquare: "c6",
        san: "Nc6",
        side: "black",
        occurences: 2711,
      },
      {
        fromSquare: "b6",
        toSquare: "b2",
        san: "Qxb2",
        side: "black",
        occurences: 2542,
      },
      {
        fromSquare: "b2",
        toSquare: "a3",
        san: "Qa3",
        side: "black",
        occurences: 2424,
      },
      {
        fromSquare: "f8",
        toSquare: "e7",
        san: "Be7",
        side: "black",
        occurences: 2275,
      },
      {
        fromSquare: "h7",
        toSquare: "h6",
        san: "h6",
        side: "black",
        occurences: 1607,
      },
      {
        fromSquare: "g7",
        toSquare: "f6",
        san: "gxf6",
        side: "black",
        occurences: 1521,
      },
      {
        fromSquare: "d6",
        toSquare: "e5",
        san: "dxe5",
        side: "black",
        occurences: 1277,
      },
      {
        fromSquare: "b7",
        toSquare: "c6",
        san: "bxc6",
        side: "black",
        occurences: 1110,
      },
      {
        fromSquare: "b8",
        toSquare: "d7",
        san: "Nbd7",
        side: "black",
        occurences: 1005,
      },
      {
        fromSquare: "f7",
        toSquare: "e6",
        san: "fxe6",
        side: "black",
        occurences: 872,
      },
    ];
    // @ts-ignore
    expect(getPlanSections(plans, "white", new Chess())).toMatchSnapshot();
  });
});
