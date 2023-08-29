import { expect, test } from "vitest";
import { getLineAnimation } from "./get_line_animation";

test("get line animation", () => {
  expect(getLineAnimation(["a"], ["a", "b"])).toEqual({
    reset: false,
    animateLine: ["b"],
  });
  expect(getLineAnimation(["a", "b", "c"], ["a"])).toEqual({
    reset: true,
    animateLine: ["a"],
  });
});
