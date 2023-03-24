import { View } from "./View";

export const Spacer = ({
  width = null,
  height = null,
  block = false,
  grow = false,
  style = {},
  isMobile = null,
}) => {
  let styles: any = { flexGrow: grow ? 1 : 0, ...style };
  if (block) {
    styles.display = "block";
  }
  if (isMobile === true) {
    styles.height = `${height}px`;
  }
  if (isMobile === false) {
    styles.width = `${width}px`;
  }
  if (height) {
    styles.height = `${height}px`;
  }
  if (width) {
    styles.width = `${width}px`;
  }
  return <View style={styles}></View>;
};
