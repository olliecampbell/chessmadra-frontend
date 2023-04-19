import { useResponsive } from "~/utils/useResponsive";
import { Component, For, Show } from "solid-js";
import { clsx } from "~/utils/classes";
import { SidebarTemplate } from "./SidebarTemplate";
import { InstructiveGame } from "~/utils/models";

export const SidebarInstructiveGames = (props: {
  games: InstructiveGame[];
}) => {
  return (
    <SidebarTemplate header="Instructive Games" actions={[]}>
      <p class={"text-secondary padding-sidebar text-sm"}>
        These games from highly-rated players are ideal to learn how to handle
        the positions that arise from your openings.
      </p>
      <div class={"h-4"} />
      <div class={"space-y-2"}>
        <For each={props.games}>
          {(game) => {
            return <InstructiveGameView game={game} />;
          }}
        </For>
      </div>
    </SidebarTemplate>
  );
};

const InstructiveGameView: Component<{
  game: InstructiveGame;
}> = ({ game }) => {
  return (
    <a
      href={game.gameLink}
      target="_blank"
      class={clsx(
        "bg-sidebar_button_primary &hover:bg-sidebar_button_primary_hover padding-sidebar min-h-sidebar-button row items-center justify-between py-2"
      )}
    >
      <div>
        <p class={clsx("")}>
          <b>{game.whiteName}</b> vs <b>{game.blackName}</b>
        </p>
        <p class={clsx("text-secondary pt-1")}>
          {Math.round(game.numberMoves / 2)} moves
        </p>
      </div>
      <div class={clsx(``)}>
        <i class={`fa fa-link-simple`} />
      </div>
    </a>
  );
};
