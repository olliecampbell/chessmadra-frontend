import { Chess } from "@lubert/chess.ts";
import { createSignal } from "solid-js";

export function createChessProxy(chess: Chess): Chess {
  const [track, trigger] = createSignal(undefined, { equals: false });
  const handler: ProxyHandler<Chess> = {
    get(target, prop, receiver) {
      track();
      // @ts-ignore
      if (typeof target[prop] === "function" && prop !== "get") {
        const fen = chess.fen();
        return (...args: any[]) => {
          // @ts-ignore
          const result = target[prop](...args);
          const newFen = chess.fen();
          if (fen !== newFen) {
            trigger();
          }
          return result;
        };
      }
      const x = Reflect.get(target, prop, receiver);
      return x;
    },
  };

  return new Proxy(chess, handler);
}
