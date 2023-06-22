import { CMText } from "./CMText";
import { Spacer } from "./Space";

export const Bullet = (props: { children: any }) => {
  return (
    <div class={"row items-start pl-2"}>
      <i class="fas fa-circle text-secondary mt-1.5 text-[5px]" />
      <Spacer width={8} />
      <CMText class={"body-text"}>{props.children}</CMText>
    </div>
  );
};
