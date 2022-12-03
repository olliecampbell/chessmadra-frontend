import { Chess, SQUARES } from "@lubert/chess.ts";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";
import { CMText } from "app/components/CMText";
import { quick } from "app/utils/app_state";
import { Plan } from "app/models";
import { s, c } from "app/styles";
import React from "react";
import { intersperse } from "./intersperse";
import { otherSide, Side, toSide } from "./repertoire";
import {
  capitalize,
  filter,
  isEmpty,
  some,
  sortBy,
  take,
  find,
  every,
  reverse,
  keyBy,
  forEach,
  map,
  mapValues,
  cloneDeep,
  uniqBy,
  isNil,
} from "lodash-es";
import { useHovering } from "app/hooks/useHovering";
import { View } from "react-native";

export interface MetaPlan {
  plan: Plan;
  id: string;
  directionChanged: boolean;
  mine: boolean;
  subsequentMove: boolean;
  piece: PieceSymbol;
}

export const getMetaPlans = (
  _plans: Plan[],
  activeSide: Side,
  board: Chess
): MetaPlan[] => {
  return ["white", "black"].flatMap((side) => {
    let plans = _plans;
    plans = filter(plans, (p) => p.side === side);

    // @ts-ignore
    let byFromSquare: Record<Square, Plan[]> = {};
    plans.forEach((p) => {
      if (byFromSquare[p.fromSquare]) {
        byFromSquare[p.fromSquare].push(p);
      } else {
        byFromSquare[p.fromSquare] = [p];
      }
    });
    let metaPlans: MetaPlan[] = [];
    type SquareMove = string;
    let recurse = (plan: Plan, seenMoves: Set<SquareMove>) => {
      metaPlans.push({
        plan,
        directionChanged: false,
        mine: side === activeSide,
        subsequentMove: false,
        piece: getPlanPiece(plan),
        id: `${plan.fromSquare} ${plan.toSquare} ${getPlanPiece(plan)} ${
          plan.side
        }`,
      });
      byFromSquare[plan.fromSquare].forEach((p) => {
        if (seenMoves.has(p.fromSquare + p.toSquare)) {
          seenMoves.add(p.fromSquare + p.toSquare);
          recurse(p, cloneDeep(seenMoves));
        }
      });
    };
    plans.forEach((plan) => {
      let piece = board.get(plan.fromSquare);
      if (piece && toSide(piece.color) === side) {
        byFromSquare[plan.fromSquare].forEach((p) => {
          recurse(p, new Set());
        });
      }
      if (piece?.type === "k") {
        ["d1", "f1", "d8", "f8"].forEach((square) => {
          byFromSquare[square]?.forEach((p) => {
            recurse(p, new Set());
          });
        });
      }
    });

    metaPlans = uniqBy(
      metaPlans,
      // at(0) is a shortcut to get the piece, we want to uniq between Nbd5 and Nd5, so it doesn't show two arrows in one place
      (p) => `${p.plan.san.at(0)}-${p.plan.toSquare}-${p.plan.toSquare}`
    );
    metaPlans = sortBy(metaPlans, (p) => -p.plan.occurences);

    if (isEmpty(metaPlans)) {
      return [];
    }
    return metaPlans;
  });
};

export const getPlanPiece = (plan: Plan): PieceSymbol => {
  if (plan.san.startsWith("O-O")) {
    return "k";
  } else if (plan.san.startsWith("N")) {
    return "n";
  } else if (plan.san.startsWith("B")) {
    return "b";
  } else if (plan.san.startsWith("R")) {
    return "r";
  } else if (plan.san.startsWith("Q")) {
    return "q";
  } else if (plan.san.startsWith("K")) {
    return "k";
  } else {
    return "p";
  }
};

function pieceSymbolToPieceName(symbol: PieceSymbol): string {
  switch (symbol) {
    case "n":
      return "knight";
    case "b":
      return "bishop";
    case "r":
      return "rook";
    case "q":
      return "queen";
    case "k":
      return "king";
    case "p":
      return "pawn";
    default:
      return null;
  }
}

function getPieceDescription(plan: MetaPlan): string {
  return `${pieceSymbolToPieceName(plan.piece)} on ${plan.plan.fromSquare}`;
}

type PlanSection = JSX.Element | JSX.Element[] | string;

class PlanConsumer {
  metaPlans: MetaPlan[];
  plans: Plan[];
  side: Side;
  position: Chess;
  consumed: Set<string>;
  capturePieces: Record<Square, PieceSymbol>;
  planPrecedingCaptures: Record<Square, MetaPlan>;
  planSections: PlanSection[];

  constructor(plans: Plan[], side: Side, position: Chess) {
    this.planSections = [];
    this.metaPlans = getMetaPlans(plans, side, position);
    this.plans = plans;
    this.side = side;
    this.consumed = new Set();
    this.position = position;
    // @ts-ignore
    this.planPrecedingCaptures = keyBy(
      sortBy(
        filter(this.metaPlans, (p) => p.plan.side !== side),
        (p) => p.plan.occurences
      ),
      (p) => p.plan.toSquare
    );
    // @ts-ignore
    this.capturePieces = mapValues(
      keyBy(
        sortBy(
          filter(plans, (p) => p.side !== side),
          (p) => p.occurences
        ),
        (p) => p.toSquare
      ),
      (p) => getPlanPiece(p)
    );
    forEach(SQUARES, (_, square) => {
      let piece = position.get(square);
      if (piece && toSide(piece.color) !== side) {
        this.capturePieces[square] = piece.type;
      }
    });
  }
  consume<T extends MetaPlan | MetaPlan[]>(plan: T): T {
    if (Array.isArray(plan)) {
      plan.map((p) => this.consumed.add(p.id));
    } else {
      this.consumed.add(plan.id);
    }
    return plan;
  }
  consumeCastles() {
    let plans = this.remainingPlans();
    let queenside = find(plans, (p) => p.plan.san === "O-O-O");
    let kingside = find(plans, (p) => p.plan.san === "O-O");
    if (!(queenside || kingside)) {
      return null;
    } else if (queenside && kingside) {
      let queensideMoreCommon =
        queenside.plan.occurences > kingside.plan.occurences;
      this.consume([queenside, kingside]);
      this.planSections.push(
        <>
          You can castle to either side, although{" "}
          <PlanMoveText plan={queensideMoreCommon ? queenside : kingside}>
            castling {queensideMoreCommon ? "queenside" : "kingside"}
          </PlanMoveText>{" "}
          is most common
        </>
      );
    } else if (kingside) {
      this.planSections.push(
        <>
          {capitalize(this.side)} typically{" "}
          <PlanMoveText plan={this.consume(kingside)}>
            castles kingside
          </PlanMoveText>
        </>
      );
    } else if (queenside) {
      this.planSections.push(
        <>
          {capitalize(this.side)} typically{" "}
          <PlanMoveText plan={this.consume(queenside)}>
            castles queenside
          </PlanMoveText>
        </>
      );
    }
  }
  consumeCaptures() {
    this.remainingPlans().forEach((plan) => {
      if (!plan.plan.san.includes("x")) {
        return;
      }
      let capturedPiece = this.capturePieces[plan.plan.toSquare];
      let pieceDescription = getPieceDescription(plan);
      if (!pieceDescription) {
        return;
      }
      let allCapturers = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.toSquare === plan.plan.toSquare && p.plan.san.includes("x")
      );
      if (!capturedPiece || isEmpty(allCapturers)) {
        return;
      }
      let planBeforeCapture = this.planPrecedingCaptures[plan.plan.toSquare];
      let recapture = false;
      if (planBeforeCapture) {
        let opponentHasPieceOnCaptureSquare =
          toSide(this.position.get(plan.plan.toSquare)?.color) ==
          otherSide(plan.plan.side);
        if (
          planBeforeCapture.plan.san.includes("x") &&
          !opponentHasPieceOnCaptureSquare
        ) {
          recapture = true;
        }
        this.consume(planBeforeCapture);
      }
      this.planSections.push(
        <>
          The{" "}
          <EnglishSeparator
            exclusive
            items={allCapturers.map(
              (p) =>
                getDevelopmentPieceDescription(p) ||
                `${pieceSymbolToPieceName(p.piece)} on ${plan.plan.fromSquare}`
            )}
          />{" "}
          typically{" "}
          <PlanMoveText plans={this.consume(allCapturers)}>
            {recapture ? "recaptures" : "captures"} the{" "}
            {pieceSymbolToPieceName(capturedPiece)} on {plan.plan.toSquare}
          </PlanMoveText>
        </>
      );
    });
  }
  pawnPlansConsumer() {
    let plans = this.remainingPlans();
    let pawnPlans = filter(plans, (p) =>
      some(["a", "b", "c", "d", "e", "f", "g", "h"], (f) =>
        p.plan.san?.startsWith(f)
      )
    );
    pawnPlans = sortBy(pawnPlans, (p) => p.plan.san);
    if (this.side === "black") {
      pawnPlans = reverse(pawnPlans);
    }
    if (isEmpty(pawnPlans)) {
      return null;
    }
    this.planSections.push(
      <>
        {pawnPlans.length > 1
          ? "Common pawn moves are"
          : "A common pawn move is"}{" "}
        <PlanMoves metaPlans={this.consume(pawnPlans)} />{" "}
      </>
    );
  }

  remainingPlans() {
    let mineConsumed = 0;
    this.metaPlans.forEach((plan) => {
      if (this.consumed.has(plan.id) && plan.plan.side === this.side) {
        mineConsumed++;
      }
    });
    return take(
      filter(
        this.metaPlans,
        (p) => !this.consumed.has(p.id) && p.plan.side === this.side
      ),
      7 - mineConsumed
    );
  }

  piecePlansConsumer() {
    let piecePlans = sortBy(
      filter(this.remainingPlans(), (p) => p.piece !== "p"),
      (p) => -p.plan.occurences
    );
    if (isEmpty(piecePlans)) {
      return null;
    }
    this.planSections.push(
      <>
        Common piece moves include{" "}
        <PlanMoves metaPlans={this.consume(piecePlans)} />
      </>
    );
  }
  viaConsumer() {
    this.remainingPlans().map((plan) => {
      if (!["n", "q", "r", "k"].includes(plan.piece)) {
        return;
      }
      if (this.position.get(plan.plan.fromSquare)?.type !== plan.piece) {
        return;
      }
      if (plan.plan.san.includes("x")) {
        return;
      }
      let pieceDescription =
        getDevelopmentPieceDescription(plan) || getPieceDescription(plan);
      let finalDestination = find(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.toSquare && p.piece === plan.piece
      );
      if (!finalDestination) {
        return;
      }

      this.planSections.push(
        <>
          The {pieceDescription} often{" "}
          <PlanMoveText plans={this.consume([plan, finalDestination])}>
            goes to {finalDestination.plan.toSquare}, via {plan.plan.toSquare}
          </PlanMoveText>
        </>
      );
    });
  }
  fianchettoConsumer() {
    this.remainingPlans().map((plan) => {
      if (plan.piece !== "b") {
        return;
      }
      if (plan.plan.san.includes("x")) {
        return;
      }
      let pairs = [
        ["c8", "b7"],
        ["f8", "g7"],
        ["c1", "b2"],
        ["f1", "g2"],
      ];
      let isFianchetto = some(
        pairs,
        ([from, to]) =>
          plan.plan.fromSquare === from && plan.plan.toSquare === to
      );
      if (!isFianchetto) {
        return;
      }
      let developmentPieceDescription = getDevelopmentPieceDescription(plan);
      if (!developmentPieceDescription) {
        return;
      }
      let otherDevelopmentPlans = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.fromSquare &&
          p.piece === plan.piece &&
          p.id !== plan.id
      );
      if (!isEmpty(otherDevelopmentPlans)) {
        return;
      }

      this.planSections.push(
        <>
          The {developmentPieceDescription} is typically{" "}
          <PlanMoveText plan={this.consume(plan)}>
            fianchettoed on {plan.plan.toSquare}
          </PlanMoveText>
        </>
      );
    });
  }

  pieceDevelopmentConsumer() {
    this.remainingPlans().map((plan) => {
      if (plan.piece === "p") {
        return;
      }
      if (plan.plan.san.includes("x")) {
        return;
      }
      let pieceDescription =
        getDevelopmentPieceDescription(plan) || getPieceDescription(plan);
      let isDevelopment = !isNil(getDevelopmentPieceDescription(plan));
      if (!pieceDescription) {
        return;
      }
      let allDevelopmentPlans = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.fromSquare &&
          p.piece === plan.piece &&
          !this.consumed.has(p.id)
      );
      if (isEmpty(allDevelopmentPlans)) {
        return;
      }
      let descriptor = null;
      let beforeDescriptor = null;
      if (plan.piece === "q" && isDevelopment) {
        descriptor = "belongs on";
      } else if (allDevelopmentPlans.length > 1 && isDevelopment) {
        beforeDescriptor = "can be";
        descriptor = "developed to";
      } else if (allDevelopmentPlans.length > 1 && !isDevelopment) {
        beforeDescriptor = "can be";
        descriptor = "moved to";
      } else if (isDevelopment) {
        beforeDescriptor = "is typically";
        descriptor = "developed to";
      } else {
        beforeDescriptor = "is often";
        descriptor = "moved to";
      }

      this.planSections.push(
        <>
          The {pieceDescription}{" "}
          {allDevelopmentPlans.length > 1
            ? `${beforeDescriptor} ${descriptor} `
            : beforeDescriptor
            ? `${beforeDescriptor} `
            : ""}
          <PlanMoves
            exclusive
            metaPlans={this.consume(allDevelopmentPlans)}
            stripPieceSymbol
            customFormatter={
              allDevelopmentPlans.length > 1
                ? null
                : () => {
                    return `${descriptor} ${plan.plan.toSquare}`;
                  }
            }
          />
        </>
      );
    });
  }
}

export const parsePlans = (
  plans: Plan[],
  side: Side,
  position: Chess
): PlanConsumer => {
  let consumer = new PlanConsumer(plans, side, position);
  consumer.fianchettoConsumer();
  consumer.consumeCastles();
  consumer.consumeCaptures();
  consumer.viaConsumer();
  consumer.pieceDevelopmentConsumer();
  consumer.piecePlansConsumer();
  consumer.pawnPlansConsumer();
  return consumer;
};

const PlanMoves = ({
  metaPlans,
  exclusive,
  stripPieceSymbol,
  customFormatter,
}: {
  metaPlans: MetaPlan[];
  exclusive?: boolean;
  stripPieceSymbol?: boolean;
  customFormatter?: (plan: MetaPlan) => any;
}) => {
  let combinator = exclusive ? "or" : "and";
  return (
    <CMText style={s(c.fg(c.colors.textPrimary))}>
      {intersperse(
        metaPlans.map((metaPlan, i) => {
          return (
            <PlanMoveText plan={metaPlan}>
              {customFormatter
                ? customFormatter(metaPlan)
                : stripPieceSymbol
                ? metaPlan.plan.toSquare
                : metaPlan.plan.san}
            </PlanMoveText>
          );
        }),
        (k, isLast) => {
          return (
            <CMText key={k} style={s(c.fg(c.colors.textPrimary))}>
              {isLast
                ? metaPlans.length > 2
                  ? `, ${combinator} `
                  : ` ${combinator} `
                : ", "}
            </CMText>
          );
        }
      )}
    </CMText>
  );
};

const EnglishSeparator = ({
  exclusive,
  items,
}: {
  exclusive?: boolean;
  items: any[];
}) => {
  let combinator = exclusive ? "or" : "and";

  return (
    <CMText style={s(c.fg(c.colors.textPrimary))}>
      {intersperse(items, (k, isLast) => {
        return (
          <CMText key={k} style={s()}>
            {isLast
              ? items.length > 2
                ? `, ${combinator} `
                : ` ${combinator} `
              : ", "}
          </CMText>
        );
      })}
    </CMText>
  );
};

const PlanMoveText = ({
  plan,
  plans,
  children,
}: {
  plan?: MetaPlan;
  plans?: MetaPlan[];
  children: any;
}) => {
  const { hovering, hoveringProps } = useHovering(
    () => {
      quick((s) => {
        const chessboardState = s.repertoireState.browsingState.chessboardState;
        if (plans) {
          chessboardState.focusedPlans = plans.map((p) => p.id);
        } else if (plan) {
          chessboardState.focusedPlans = [plan.id];
        }
      });
    },
    () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboardState.focusedPlans = [];
      });
    }
  );
  return (
    <View style={s(c.inlineBlock, c.clickable)} {...hoveringProps}>
      <CMText
        style={s(c.weightBold, c.fg(hovering ? c.purples[70] : c.oranges[70]))}
      >
        {children}
      </CMText>
    </View>
  );
};

const getDevelopmentPieceDescription = (plan: MetaPlan): string => {
  if (
    !(plan.plan.fromSquare.endsWith("1") || plan.plan.fromSquare.endsWith("8"))
  ) {
    return null;
  }
  if (plan.piece === "n") {
    if (plan.plan.fromSquare.startsWith("b")) {
      return "queenside knight";
    }
    if (plan.plan.fromSquare.startsWith("g")) {
      return "kingside knight";
    }
  }
  if (plan.piece === "b") {
    let white = plan.plan.side === "white";
    let isC = plan.plan.fromSquare.startsWith("c");
    let isF = plan.plan.fromSquare.startsWith("f");
    if ((white && isC) || (!white && isF)) {
      return "dark-squared bishop";
    } else if ((white && isF) || (!white && isC)) {
      return "light-squared bishop";
    }
  }
  if (plan.piece === "r") {
    if (
      plan.plan.fromSquare.startsWith("a") ||
      plan.plan.fromSquare.startsWith("d")
    ) {
      return "queenside rook";
    }
    if (
      plan.plan.fromSquare.startsWith("h") ||
      plan.plan.fromSquare.startsWith("f")
    ) {
      return "kingside rook";
    }
  }
  if (plan.piece === "q") {
    if (plan.plan.fromSquare.startsWith("d")) {
      return "queen";
    }
  }
};
