export const onEnter = (fn) => (e) => {
  if (e.keyCode === 13) {
    fn();
  }
};
