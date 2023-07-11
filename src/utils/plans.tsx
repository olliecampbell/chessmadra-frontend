/* eslint-disable solid/reactivity, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { Chess, SQUARES } from "@lubert/chess.ts";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";
import { CMText } from "~/components/CMText";
import { quick } from "~/utils/app_state";
import { Plan } from "~/utils/models";
import { s, c } from "~/utils/styles";
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
  reverse,
  keyBy,
  forEach,
  mapValues,
  cloneDeep,
  uniqBy,
  isNil,
  includes,
  last,
} from "lodash-es";
import { useHovering } from "~/mocks";
import { JSX, JSXElement } from "solid-js";
import { QuizPlan } from "~/utils/queues";

export interface MetaPlan {
  plan: Plan;
  id: string;
  directionChanged: boolean;
  mine: boolean;
  subsequentMove: boolean;
  piece: PieceSymbol;
}

export const getMetaPlans = (_plans: Plan[], activeSide: Side): MetaPlan[] => {
  return ["white", "black"].flatMap((side) => {
    let plans = _plans;
    plans = filter(plans, (p) => p.side === side);

    // @ts-ignore
    const byFromSquare: Record<Square, Plan[]> = {};
    plans.forEach((p) => {
      if (byFromSquare[p.fromSquare]) {
        byFromSquare[p.fromSquare].push(p);
      } else {
        byFromSquare[p.fromSquare] = [p];
      }
    });
    let metaPlans: MetaPlan[] = [];
    type SquareMove = string;
    const recurse = (plan: Plan, seenMoves: Set<SquareMove>) => {
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
      let piece = plan.san.at(0);
      if (!includes(["B", "N", "Q", "R", "K"], piece)) {
        piece = "p";
      }
      let pieceSide =
        plan.side === activeSide ? activeSide : otherSide(activeSide);
      if (piece && pieceSide === side) {
        byFromSquare[plan.fromSquare].forEach((p) => {
          recurse(p, new Set());
        });
      }
      if (piece === "k") {
        ["d1", "f1", "d8", "f8"].forEach((square) => {
          // @ts-ignore
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

export function pieceSymbolToPieceName(symbol: PieceSymbol): string {
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
  }
}

function getPieceDescription(plan: MetaPlan): string {
  return `${pieceSymbolToPieceName(plan.piece)} on ${plan.plan.fromSquare}`;
}

type PlanSection = JSX.Element;

class PlanConsumer {
  metaPlans: MetaPlan[];
  plans: Plan[];
  side: Side;
  position: Chess;
  consumed: Set<string>;
  capturePieces: Record<Square, PieceSymbol>;
  planPrecedingCaptures: Record<Square, MetaPlan>;
  planSections: (() => PlanSection)[];
  adverbIndex: number;

  constructor(plans: Plan[], side: Side, position: Chess) {
    this.adverbIndex = 0;
    this.planSections = [];
    this.metaPlans = getMetaPlans(plans, side);
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
      const piece = position.get(square);
      if (piece && toSide(piece.color) !== side) {
        // @ts-ignore
        this.capturePieces[square] = piece.type;
      }
    });
  }

  nextAdverb(): string {
    const adverbs = ["typically", "generally", "usually", "often"];
    return adverbs[this.adverbIndex++ % adverbs.length];
  }

  consume<T extends MetaPlan | (MetaPlan | undefined)[]>(plan: T): T {
    if (Array.isArray(plan)) {
      // @ts-ignore
      plan.map((p) => this.consumed.add(p?.id));
    } else {
      this.consumed.add(plan.id);
    }
    return plan;
  }
  consumeCastles() {
    const plans = this.remainingPlans();
    const queenside = find(plans, (p) => p.plan.san === "O-O-O");
    const kingside = find(plans, (p) => p.plan.san === "O-O");
    this.consume([queenside, kingside]);
    if (!(queenside || kingside)) {
      return null;
    } else if (queenside && kingside) {
      const queensideMoreCommon =
        queenside.plan.occurences > kingside.plan.occurences;
      this.addSection(() => (
        <>
          You can castle to either side, although{" "}
          <PlanMoveText plan={queensideMoreCommon ? queenside : kingside}>
            castling {queensideMoreCommon ? "queenside" : "kingside"}
          </PlanMoveText>{" "}
          is most common
        </>
      ));
    } else if (kingside) {
      this.addSection(() => (
        <>
          {capitalize(this.side)} {this.nextAdverb()}{" "}
          <PlanMoveText plan={kingside}>castles kingside</PlanMoveText>
        </>
      ));
    } else if (queenside) {
      this.addSection(() => (
        <>
          {capitalize(this.side)} {this.nextAdverb()}{" "}
          <PlanMoveText plan={queenside}>castles queenside</PlanMoveText>
        </>
      ));
    }
  }
  consumeCaptures() {
    this.remainingPlans().forEach((plan) => {
      if (!plan.plan.san.includes("x")) {
        return;
      }
      const capturedPiece = this.capturePieces[plan.plan.toSquare];
      const pieceDescription = getPieceDescription(plan);
      if (!pieceDescription) {
        return;
      }
      const allCapturers = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.toSquare === plan.plan.toSquare && p.plan.san.includes("x")
      );
      if (!capturedPiece || isEmpty(allCapturers)) {
        return;
      }
      const planBeforeCapture = this.planPrecedingCaptures[plan.plan.toSquare];
      let recapture = false;
      if (planBeforeCapture) {
        const opponentHasPieceOnCaptureSquare =
          // @ts-ignore
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
      this.consume(allCapturers);
      this.addSection(() => (
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
          {this.nextAdverb()}{" "}
          <PlanMoveText plans={allCapturers}>
            {recapture ? "recaptures" : "captures"} the{" "}
            {pieceSymbolToPieceName(capturedPiece)} on {plan.plan.toSquare}
          </PlanMoveText>
        </>
      ));
    });
  }
  pawnPlansConsumer() {
    const plans = this.remainingPlans();
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
    this.consume(pawnPlans);
    this.addSection(() => (
      <>
        {pawnPlans.length > 1
          ? "Common pawn moves are"
          : "A common pawn move is"}{" "}
        <PlanMoves metaPlans={pawnPlans} />{" "}
      </>
    ));
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
    const piecePlans = sortBy(
      filter(this.remainingPlans(), (p) => p.piece !== "p"),
      (p) => -p.plan.occurences
    );
    if (isEmpty(piecePlans)) {
      return null;
    }
    this.consume(piecePlans);
    this.addSection(() => (
      <>
        Common piece moves include <PlanMoves metaPlans={piecePlans} />
      </>
    ));
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
      const pieceDescription =
        getDevelopmentPieceDescription(plan) || getPieceDescription(plan);
      const finalDestination = find(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.toSquare && p.piece === plan.piece
      );
      if (!finalDestination) {
        return;
      }
      this.consume([plan, finalDestination]);
      this.addSection(() => (
        <>
          The {pieceDescription} often{" "}
          <PlanMoveText plans={[plan, finalDestination]}>
            goes to {finalDestination.plan.toSquare}, via {plan.plan.toSquare}
          </PlanMoveText>
        </>
      ));
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
      const pairs = [
        ["c8", "b7"],
        ["f8", "g7"],
        ["c1", "b2"],
        ["f1", "g2"],
      ];
      const isFianchetto = some(
        pairs,
        ([from, to]) =>
          plan.plan.fromSquare === from && plan.plan.toSquare === to
      );
      if (!isFianchetto) {
        return;
      }
      const developmentPieceDescription = getDevelopmentPieceDescription(plan);
      if (!developmentPieceDescription) {
        return;
      }
      const otherDevelopmentPlans = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.fromSquare &&
          p.piece === plan.piece &&
          p.id !== plan.id
      );
      if (!isEmpty(otherDevelopmentPlans)) {
        return;
      }

      this.consume(plan);
      this.addSection(() => {
        return (
          <>
            The {developmentPieceDescription} is {this.nextAdverb}{" "}
            <PlanMoveText plan={plan}>
              fianchettoed on {plan.plan.toSquare}
            </PlanMoveText>
          </>
        );
      });
    });
  }

  addSection(section: () => JSX.Element) {
    this.planSections.push(section);
  }

  pieceDevelopmentConsumer() {
    this.remainingPlans().map((plan) => {
      if (plan.piece === "p") {
        return;
      }
      if (plan.plan.san.includes("x")) {
        return;
      }
      const pieceDescription =
        getDevelopmentPieceDescription(plan) || getPieceDescription(plan);
      const isDevelopment = !isNil(getDevelopmentPieceDescription(plan));
      if (!pieceDescription) {
        return;
      }
      const allDevelopmentPlans = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.fromSquare &&
          p.piece === plan.piece &&
          !this.consumed.has(p.id)
      );
      if (isEmpty(allDevelopmentPlans)) {
        return;
      }
      // @ts-ignore
      let descriptor = null;
      // @ts-ignore
      let beforeDescriptor = null;
      if (allDevelopmentPlans.length > 1 && isDevelopment) {
        beforeDescriptor = "can";
        descriptor = "develop to";
      } else if (allDevelopmentPlans.length > 1 && !isDevelopment) {
        beforeDescriptor = "can";
        descriptor = "move to";
      } else if (isDevelopment) {
        beforeDescriptor = `${this.nextAdverb()}`;
        descriptor = "develops to";
      } else {
        beforeDescriptor = "often";
        descriptor = "moves to";
      }
      this.consume(allDevelopmentPlans);
      this.addSection(() => (
        <>
          The {pieceDescription}{" "}
          {allDevelopmentPlans.length > 1
            ? // @ts-ignore
              `${beforeDescriptor} ${descriptor} `
            : // @ts-ignore
            beforeDescriptor
            ? `${beforeDescriptor} `
            : ""}
          <PlanMoves
            exclusive
            metaPlans={allDevelopmentPlans}
            stripPieceSymbol
            // @ts-ignore
            customFormatter={
              allDevelopmentPlans.length > 1
                ? null
                : () => {
                    // @ts-ignore
                    return `${descriptor} ${plan.plan.toSquare}`;
                  }
            }
          />
        </>
      ));
    });
  }
}

export const parsePlans = (
  plans: Plan[],
  side: Side,
  position: Chess
): PlanConsumer => {
  const consumer = new PlanConsumer(plans, side, position);
  consumer.fianchettoConsumer();
  consumer.consumeCastles();
  consumer.consumeCaptures();
  consumer.viaConsumer();
  consumer.pieceDevelopmentConsumer();
  consumer.piecePlansConsumer();
  consumer.pawnPlansConsumer();
  return consumer;
};

export const parsePlansToQuizMoves = (
  plans: Plan[],
  side: Side,
  position: Chess
): QuizPlan[] => {
  const consumer = new PlanQuizConsumer(plans, side, position);
  // consumer.fianchettoConsumer();
  consumer.consumeCastles();
  // consumer.consumeCaptures();
  // consumer.viaConsumer();
  consumer.pieceDevelopmentConsumer();
  // consumer.piecePlansConsumer();
  // consumer.pawnPlansConsumer();
  return consumer.quizPlans;
};

const PlanMoves = (props: {
  metaPlans: MetaPlan[];
  exclusive?: boolean;
  stripPieceSymbol?: boolean;
  customFormatter?: (plan: MetaPlan) => any;
}) => {
  const combinator = props.exclusive ? "or" : "and";
  return (
    <CMText style={s(c.fg(c.colors.text.primary))}>
      {intersperse(
        props.metaPlans.map((metaPlan, i) => {
          return (
            <PlanMoveText plan={metaPlan}>
              {props.customFormatter
                ? props.customFormatter(metaPlan)
                : props.stripPieceSymbol
                ? metaPlan.plan.toSquare
                : metaPlan.plan.san}
            </PlanMoveText>
          );
        }),
        (k, isLast) => {
          return (
            <CMText key={k} style={s(c.fg(c.colors.text.primary))}>
              {isLast
                ? props.metaPlans.length > 2
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

const EnglishSeparator = (props: { exclusive?: boolean; items: any[] }) => {
  const combinator = props.exclusive ? "or" : "and";

  return (
    <CMText style={s(c.fg(c.colors.text.primary))}>
      {intersperse(props.items, (k, isLast) => {
        return (
          <CMText key={k} style={s()}>
            {isLast
              ? props.items.length > 2
                ? `, ${combinator} `
                : ` ${combinator} `
              : ", "}
          </CMText>
        );
      })}
    </CMText>
  );
};

const PlanMoveText = (props: {
  plan?: MetaPlan;
  plans?: MetaPlan[];
  children: any;
}) => {
  const { hovering, hoveringProps } = useHovering(
    () => {
      quick((s) => {
        const chessboard = s.repertoireState.browsingState.chessboard;
        chessboard.set((c) => {
          if (props.plans) {
            c.focusedPlans = props.plans.map((p) => p.id);
          } else if (props.plan) {
            c.focusedPlans = [props.plan.id];
          }
        });
      });
    },
    () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboard.set((c) => {
          c.focusedPlans = [];
        });
      });
    }
  );
  return (
    <div style={s(c.inlineBlock, c.clickable)} {...hoveringProps}>
      <CMText
        style={s(
          c.weightSemiBold,
          c.fg(hovering() ? c.purple[65] : c.arrowColors[55])
        )}
      >
        {props.children}
      </CMText>
    </div>
  );
};

// @ts-ignore
const getDevelopmentPieceDescription = (plan: MetaPlan): string | null => {
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
    const white = plan.plan.side === "white";
    const isC = plan.plan.fromSquare.startsWith("c");
    const isF = plan.plan.fromSquare.startsWith("f");
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

class PlanQuizConsumer {
  metaPlans: MetaPlan[];
  plans: Plan[];
  side: Side;
  position: Chess;
  consumed: Set<string>;
  capturePieces: Record<Square, PieceSymbol>;
  quizPlans: QuizPlan[];
  adverbIndex: number;

  constructor(plans: Plan[], side: Side, position: Chess) {
    this.adverbIndex = 0;
    this.metaPlans = getMetaPlans(plans, side);
    this.quizPlans = [];
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
      const piece = position.get(square);
      if (piece && toSide(piece.color) !== side) {
        // @ts-ignore
        this.capturePieces[square] = piece.type;
      }
    });
  }

  nextAdverb(): string {
    const adverbs = ["typically", "generally", "usually", "often"];
    return adverbs[this.adverbIndex++ % adverbs.length];
  }

  consume<T extends MetaPlan | (MetaPlan | undefined)[]>(plan: T): T {
    if (Array.isArray(plan)) {
      // @ts-ignore
      plan.map((p) => this.consumed.add(p?.id));
    } else {
      this.consumed.add(plan.id);
    }
    return plan;
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

  addQuizPlan(quizPlan: QuizPlan) {
    this.quizPlans.push(quizPlan);
  }

  consumeCastles() {
    const plans = this.remainingPlans();
    const queenside = find(plans, (p) => p.plan.san === "O-O-O");
    const kingside = find(plans, (p) => p.plan.san === "O-O");
    this.consume([queenside, kingside]);
    if (!(queenside || kingside)) {
      return null;
    } else if (queenside && kingside) {
      return null;
    }
    let castle: MetaPlan = cloneDeep((kingside ?? queenside) as MetaPlan);
    castle.plan.toSquare = castle.plan.toSquare
      .replace("h", "g")
      .replace("a", "c") as Square;
    this.addQuizPlan({
      type: "castling",
      options: this.side === "white" ? ["g1", "c1"] : ["g8", "c8"],
      piece: castle.piece,
      metaPlan: castle,
      toSquares: [
        castle.plan.toSquare.replace("h", "g").replace("a", "c") as Square,
      ],
      fromSquare: castle.plan.fromSquare,
    });
  }

  pieceDevelopmentConsumer() {
    this.remainingPlans().map((plan) => {
      if (plan.plan.san.includes("x")) {
        return;
      }
      const pieceDescription =
        getDevelopmentPieceDescription(plan) || getPieceDescription(plan);
      if (!pieceDescription) {
        return;
      }
      const piece = this.position.get(plan.plan.fromSquare);
      if (!piece) {
        return;
      }
      if (piece.type !== plan.piece || toSide(piece.color) !== this.side) {
        return;
      }
      const allDevelopmentPlans = filter(
        this.remainingPlans(),
        (p) =>
          p.plan.fromSquare === plan.plan.fromSquare &&
          p.piece === plan.piece &&
          !this.consumed.has(p.id)
      );
      if (isEmpty(allDevelopmentPlans)) {
        return;
      }
      this.consume(allDevelopmentPlans);
      this.addQuizPlan({
        type: "piece_movement",
        piece: plan.piece,
        toSquares: [allDevelopmentPlans[0].plan.toSquare],
        metaPlan: plan,
        fromSquare: plan.plan.fromSquare,
      });
    });
  }
}
