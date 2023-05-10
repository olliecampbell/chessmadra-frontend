import { CMText } from "./CMText";
import { Spacer } from "./Space";

export const Bullet = ({ children }: { children: any }) => {
  return (
    <div class={"row items-center pl-2"}>
      <i class="fas fa-circle text-grays-60 text-[5px]" />
      <Spacer width={8} />
      <CMText class={"text-secondary"}>{children}</CMText>
    </div>
  );
};
