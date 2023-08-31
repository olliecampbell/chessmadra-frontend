import { clsx } from "~/utils/classes";
import { createScrollPosition } from "@solid-primitives/scroll";
import { getFeatureLoaded } from "~/utils/experiments";

export const HomePageHeader = (props: { onClick: () => void }) => {
  // const visible = true;
  const scroll = createScrollPosition();
  const ctas = () => {
    return getHomepageHeadersCopy(getFeatureLoaded("homepage-header-cta"));
  };
  return <span> {ctas().header}</span>;
};
export const HomePageSubheader = (props: { onClick: () => void }) => {
  // const visible = true;
  const scroll = createScrollPosition();
  const ctas = () => {
    return getHomepageHeadersCopy(getFeatureLoaded("homepage-header-cta"));
  };
  return <span> {ctas().subheader}</span>;
};

const getHomepageHeadersCopy = (feature?: string | boolean) => {
  if (feature === "1") {
    return {
      header: "The opening builder that respects your time",
      subheader:
        "Master the openings you'll actually see in your games. Remember it all with spaced repetition.",
    };
  } else if (feature === "2") {
    return {
      header: "Find the biggest gaps in your openings",
      subheader:
        "Whether you're a beginner or a tournament player, Chessbook will help you address the biggest gaps in your openings, then make sure you never forget your moves.",
    };
  } else if (feature === "3") {
    return {
      header: "The modern way to create an opening repertoire",
      subheader:
        "Find and address the biggest gaps in your openings, then review using spaced repetition so you always remember your moves.",
    };
  } else {
    return {
      header: "Your personal opening book",
      subheader:
        "Chessbook is the fastest way to build a bulletproof opening repertoire. ",
    };
  }
};
