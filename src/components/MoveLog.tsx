import { getAppState, quick, useSidebarState } from "~/utils/app_state";
import { forEach, find, cloneDeep } from "lodash-es";
import {
  Accessor,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  For,
} from "solid-js";
import { clsx } from "~/utils/classes";
import { c, s } from "~/utils/styles";
import {
  BoardTheme,
  BOARD_THEMES_BY_ID,
  CombinedTheme,
  combinedThemes,
  COMBINED_THEMES_BY_ID,
} from "~/utils/theming";
import { createElementBounds } from "@solid-primitives/bounds";
import { lineToPgn } from "~/utils/repertoire";

export const MoveLog = () => {
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const currentLine = () => {
    if (mode() === "review") {
      return getAppState().repertoireState.reviewState.moveLog;
    } else {
      return getAppState().repertoireState.browsingState.sidebarState.moveLog;
    }
  };
  const userState = getAppState().userState;
  const user = () => userState.user;
  const combinedTheme: Accessor<CombinedTheme> = createMemo(
    () =>
      find(combinedThemes, (theme) => theme.boardTheme == user()?.theme) ||
      COMBINED_THEMES_BY_ID["default"]
  );
  createEffect(() => {
    console.log("user theme", user()?.theme);
    console.log("combined theme", combinedTheme());
  });
  const theme: Accessor<BoardTheme> = () =>
    BOARD_THEMES_BY_ID[combinedTheme().boardTheme];
  let currentLineElements = () => {
    let elems = [];
    let moves = [];
    forEach(currentLine(), (e, i) => {
      moves.push(e);
      let theseMoves = cloneDeep(moves);
      let last = i == currentLine().length - 1;
      if (i % 2 === 0) {
        elems.push(
          <p
            class={"text-gray-40 pl-2  font-semibold leading-5 tracking-wider"}
          >
            {Math.round(i / 2) + 1}.
          </p>
        );
      }
      elems.push(
        <p
          class={clsx(
            "&hover:text-primary  cursor-pointer whitespace-nowrap rounded-sm px-1 font-bold  leading-5 tracking-wider transition-all",
            last ? "text-primary" : "text-tertiary"
          )}
          style={s(last && c.bg(theme().highlightLastMove))}
          onClick={() => {
            if (mode() !== "review") {
              quick((s) => {
                s.repertoireState.browsingState.chessboard.playPgn(
                  lineToPgn(theseMoves),
                  {
                    animated: true,
                  }
                );
              });
            }
          }}
        >
          {e}
        </p>
      );
    });
    return elems;
  };
  const maskImage = `linear-gradient(to left, black calc(100% - 48px), transparent 100%)`;
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [movesRef, setMovesRef] = createSignal<HTMLDivElement>();
  createRenderEffect(() => {
    currentLine();
    console.log("container? ", containerRef());
    // scroll to right of container ref, smoothly
    if (containerRef()) {
      containerRef().scrollTo({
        left: containerRef().scrollWidth,
        behavior: "smooth",
      });
    }
  });
  const containerLayout = createElementBounds(containerRef);
  const movesLayout = createElementBounds(movesRef);
  const overflowing = () => {
    console.log("widths", containerLayout.width, movesLayout.width);
    if (movesLayout && containerLayout) {
      return movesLayout.width > containerLayout.width;
    }
    return false;
  };
  return (
    <div class={"row  shrink-1 ml-2 min-w-0 items-center"}>
      <div
        class={clsx(
          "ml-2 h-5 w-px",
          overflowing() ? "bg-gray-24" : "bg-transparent"
        )}
      />
      <div
        class="row align-center no-scrollbar h-full overflow-x-scroll"
        ref={setContainerRef}
        style={s(
          overflowing() && {
            "mask-image": maskImage,
            "-webkit-mask-image": maskImage,
          }
        )}
      >
        <div class={clsx("row items-center")} ref={setMovesRef}>
          <For each={currentLineElements()}>{(e) => e}</For>
        </div>
      </div>
    </div>
  );
};
