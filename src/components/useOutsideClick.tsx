// import { useEffect } from "react";

import { onCleanup } from "solid-js";

export function useOutsideClick(ref, clicked) {
  function handleClickOutside(event: MouseEvent) {
    if (ref() && !ref().contains(event.target)) {
      return clicked(event);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });
}
