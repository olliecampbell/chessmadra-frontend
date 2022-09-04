export const failOnAny = (setting: void) => {
  return setting;
};
export const failOnTrue = (setting: false) => {
  return setting;
};
export const DEBUG_MOCK_FETCH = failOnTrue(false);
export const DEBUG_DONE_BLUNDER_VIEW = failOnTrue(false);
export const DEBUG_CLIMB_START_PLAYING = failOnTrue(false);
export const DEBUG_PASS_FAIL_BUTTONS = failOnTrue(false);
