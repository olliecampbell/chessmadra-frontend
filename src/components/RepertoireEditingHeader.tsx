import { s, c } from "~/utils/styles";
import { BP, useResponsive } from "~/utils/useResponsive";
import { CMText } from "./CMText";

export const SidebarHeader = (props: { children: any }) => {
  const responsive = useResponsive();
  return (
    <CMText class=" text-primary mt-0 text-lg font-bold lg:-mt-2 lg:text-xl">
      {props.children}
    </CMText>
  );
};
