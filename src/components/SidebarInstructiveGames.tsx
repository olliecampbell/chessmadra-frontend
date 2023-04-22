import { useResponsive } from "~/utils/useResponsive";
import { Component, For, Show } from "solid-js";
import { clsx } from "~/utils/classes";
import { SidebarTemplate } from "./SidebarTemplate";
import { InstructiveGame } from "~/utils/models";
import { Side } from "~/utils/repertoire";
import { useSidebarState } from "~/utils/app_state";

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
      <div class={"space-y-2"}>
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
        "bg-sidebar_button_primary &hover:bg-sidebar_button_primary_hover padding-sidebar min-h-sidebar-button row items-center justify-between py-2"
      )}
    >
      <div>
        <p class={clsx("")}>
          <b>{props.game.whiteName}</b> vs <b>{props.game.blackName}</b>
        </p>
        <p class={clsx("text-secondary pt-1")}>
          {Math.round(props.game.numberMoves / 2)} moves
        </p>
      </div>
      <p
        class={
          "text-tertiary &hover:text-primary text-md py-2 font-semibold transition-colors"
        }
      >
        View on Lichess
        <i class="fa fa-up-right-from-square pl-2"></i>
      </p>
    </a>
  );
};
