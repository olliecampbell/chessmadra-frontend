import { expect, test } from "vitest";
import { getMaxPlansForQuizzing } from "./plans";

test("getting number of plan quizzes", () => {
	// pretty stupid for now but may change algo later
	expect(getMaxPlansForQuizzing()).toBe(20);
	expect(getMaxPlansForQuizzing()).toBe(20);
});
