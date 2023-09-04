import { clsx } from "~/utils/classes";

export const HomePageCTA = () => {
  return (
    <div
      class={clsx(
        "px-[18px] lg:px-[24px] py-[9px] lg:py-[12px] flex justify-center items-center bg-gray-90 transition-all hover:bg-orange-60 rounded",
      )}
    >
      Try it for free
    </div>
  );
};
