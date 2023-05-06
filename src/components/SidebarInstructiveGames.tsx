import { Component, For, Show } from "solid-js";
import { clsx } from "~/utils/classes";
import { SidebarTemplate } from "./SidebarTemplate";
import { EcoCode, InstructiveGame } from "~/utils/models";
import { Side } from "~/utils/repertoire";
import { useSidebarState, useRepertoireState } from "~/utils/app_state";
import { forEachRight } from "lodash-es";

export const SidebarInstructiveGames = (props: {
  games: InstructiveGame[];
}) => {
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  return (
    <SidebarTemplate header="Model Games" actions={[]}>
      <p class={"text-secondary padding-sidebar text-sm"}>
        See how top players handle the positions that result from the openings
        you play
      </p>
      <div class={"h-4"} />
      <div class={"space-y-4"}>
        <For each={props.games}>
          {(game) => {
            return (
              <InstructiveGameView game={game} side={activeSide() as Side} />
            );
          }}
        </For>
      </div>
    </SidebarTemplate>
  );
};

const InstructiveGameView: Component<{
  game: InstructiveGame;
  side: Side;
}> = (props) => {
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
  const lastEcoCode = () => {
    let lastEco: EcoCode | null = null;
    forEachRight(props.game.epds, (epd) => {
      const eco = ecoCodeLookup()[epd];
      if (eco && !lastEco) {
        lastEco = eco;
      }
    });
    return lastEco as EcoCode | null;
  };
  const link = () => {
    if (props.side === "black") {
      return `${props.game.gameLink}/black`;
    }
    return `${props.game.gameLink}`;
  };
  return (
    <a
      href={link()}
      target="_blank"
      class={clsx(
        "bg-gray-18 &hover:bg-gray-24 padding-sidebar min-h-sidebar-button row items-center justify-between py-2"
      )}
    >
      <div>
        <p class={clsx("font-bold")}>{lastEcoCode()?.fullName}</p>
        <p class={clsx("text-secondary pt-1")}>
          {props.game.whiteName} vs {props.game.blackName}
        </p>
        <p class={clsx("text-secondary pt-1")}>
          {Math.round(props.game.numberMoves / 2)} moves
        </p>
      </div>
      <p
        class={
          "text-secondary &hover:text-primary text-md py-2 font-semibold transition-colors"
        }
      >
        <i class="fa fa-up-right-from-square pl-2" />
      </p>
    </a>
  );
};
