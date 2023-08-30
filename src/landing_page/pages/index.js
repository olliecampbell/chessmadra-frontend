import React, { useRef, useEffect } from "react";
import theme from "../theme";
import { HomePageStickyNav } from "../../components/HomePageStickyNav";
import { Theme, Link, Image, Box, Section, Text, Strong, Span, Icon, LinkBox } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "../global-page-styles";
import { RawHtml, Override, Menu } from "@quarkly/components";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { posthog } from "posthog-js";
export default (props => {
  const stickyHomepageCTA = posthog.getFeatureFlag('sticky-homepage-cta');
  console.log("feature?", stickyHomepageCTA, HomePageStickyNav());
  return /*#__PURE__*/React.createElement(Theme, {
    theme: theme
  }, /*#__PURE__*/React.createElement(GlobalQuarklyPageStyles, {
    pageUrl: "index"
  }), /*#__PURE__*/React.createElement(Helmet, null, /*#__PURE__*/React.createElement("title", null, "Chessbook"), /*#__PURE__*/React.createElement("meta", {
    property: "og:title",
    content: "Chessbook"
  })), /*#__PURE__*/React.createElement(Section, {
    "md-padding": "18px 0 18px 0"
  }, /*#__PURE__*/React.createElement("div", {
    ref: x => {
      x.appendChild(HomePageStickyNav());
    }
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    padding: "12px 0",
    "justify-content": "space-between",
    "align-items": "center",
    "flex-direction": "row",
    "md-padding": "9px 0 9px 0"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/chessbook.svg?v=2023-04-11T09:44:19.974Z",
    display: "block",
    height: "24px",
    "md-height": "18px"
  }), /*#__PURE__*/React.createElement(Menu, {
    display: "flex",
    "justify-content": "center",
    font: "--base",
    "font-weight": "700",
    "md-flex-direction": "column",
    "md-align-items": "center",
    padding: "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "link",
    "text-decoration": "none",
    color: "--dark",
    padding: "6px 12px"
  }), /*#__PURE__*/React.createElement(Override, {
    slot: "link-active",
    color: "--primary"
  }), /*#__PURE__*/React.createElement(Override, {
    slot: "item",
    padding: "6px"
  }), /*#__PURE__*/React.createElement(Box, {
    slot: "link-index",
    display: "flex",
    "flex-direction": "row",
    "align-items": "center",
    style: {
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(Link, {
    onClick: () => {
      props.onLogin();
    },
    href: "/login",
    "border-color": "--color-lightD1",
    "hover-color": "--orange",
    font: "--lead",
    color: "--grey",
    "md-font": "--leadMd",
    "lg-padding": "6px 0px 6px 9px",
    padding: "0px 0px 0px 0px"
  }, "Log in"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "1px",
      height: "16px",
      background: "white",
      opacity: "0.35"
    }
  }), /*#__PURE__*/React.createElement(Link, {
    onClick: () => {
      props.onClick("signup");
    },
    href: "/login",
    "border-color": "--color-lightD1",
    "hover-color": "--orange",
    font: "--lead",
    color: "--grey",
    "md-font": "--leadMd",
    "lg-padding": "6px 0px 6px 9px",
    padding: "0px 0px 0px 0px"
  }, "Sign up"))))), /*#__PURE__*/React.createElement(Section, {
    padding: "64px 0 0px 0",
    "md-padding": "68px 0 0px 0",
    "sm-padding": "72px 0 0px 0",
    "inner-max-width": "1000px",
    background: "rgba(0, 0, 0, 0) url() 0% 0% /auto repeat scroll padding-box",
    "lg-padding": "60px 0 0px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "100%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "center",
    "lg-margin": "0px 0px 48px 0px",
    "sm-margin": "0px 0px 40px 0px",
    margin: "0px 0px 48px 0px",
    padding: "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    "lg-max-width": "320px",
    "lg-order": "0"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 20px 0px",
    color: "--light",
    font: "--headline1",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif",
    "text-align": "center",
    width: "100%",
    "md-font": "--headline1Md",
    "sm-width": "100%",
    "md-margin": "0px 0px 15px 0px",
    "lg-font": "--headline1Sm",
    "lg-margin": "0px 0px 16px 0px"
  }, "Your\xA0personal opening\xA0book"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 36px 0px",
    color: "--lightD1",
    font: "--headline3",
    "lg-text-align": "center",
    "text-align": "center",
    "md-font": "--headline3Md",
    "md-margin": "0px 0px 27px 0px",
    "sm-font": "--headline3Sm",
    "lg-margin": "0px 0px 24px 0px"
  }, "Chessbook is the fastest way to build a bulletproof opening repertoire."), /*#__PURE__*/React.createElement(Link, {
    onClick: () => {
      props.onClick("splash_cta");
    },
    padding: "12px 24px 12px 24px",
    color: "--dark",
    "text-decoration-line": "initial",
    font: "--headline3",
    "border-radius": "8px",
    margin: "0px 0px 0px 0px",
    "sm-margin": "0px 0px 0px 0px",
    "sm-text-align": "center",
    "hover-transition": "background-color 0.2s linear 0s",
    "hover-background": "--color-orange",
    transition: "background-color 0.2s linear 0s",
    background: "--color-light",
    "md-font": "--headline3Md",
    "md-padding": "9px 18px 9px 18px"
  }, "Try it for free"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--small",
    padding: "8px 0px 0px 0px",
    "md-font": "--smallMd",
    "md-padding": "6px 0px 0px 0px"
  }, "No signup required")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "100%",
    "justify-content": "center",
    "overflow-y": "hidden",
    "overflow-x": "hidden",
    "lg-width": "100%"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/desktop-hero.png?v=2023-04-24T11:44:36.906Z",
    "hover-transform": "translateY(0px)",
    padding: "0px 0px 0px 0px",
    margin: "0px 0px 0px 50"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "100px 0 100px 0",
    background: "--sidebar",
    "inner-max-width": "1000px",
    "md-padding": "80px 0 80px 0",
    "lg-padding": "24px 0 40px 0",
    "lg-background": "--sidebarDarker"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1",
    padding: "0px 36px 0px 0px",
    "md-padding": "0px 24px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-max-width": "320px",
    "lg-width": "100%",
    "sm-padding": "0px 18px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "md-margin": "0px 0px 18px 0px",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm",
    "lg-margin": "0px 0px 16px 0px"
  }, "Find the gaps in your repertoire before your opponents do"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "md-font": "--leadMd",
    margin: "0px 0px 0px 0px",
    "sm-font": "--leadSm"
  }, "Chessbook calculates your coverage per opening so you always know what to work on.")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center",
    padding: "0px 0px 0px 36px",
    "md-padding": "0px 0px 0px 24px",
    "sm-padding": "0px 0px 0px 18px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/coverage.png?v=2023-04-26T12:10:10.140Z",
    "object-fit": "cover",
    width: "100%",
    "border-radius": "16px",
    transform: "translateY(0px)",
    transition: "transform 0.2s ease-in-out 0s",
    "box-shadow": "--xl"
  }))), /*#__PURE__*/React.createElement(Section, {
    background: "--sidebar",
    padding: "0px 0 100px 0",
    "inner-max-width": "1000px",
    "md-padding": "0px 0 80px 0",
    "lg-padding": "0px 0 40px 0",
    "lg-background": "--sidebarDarker"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    width: "50%",
    "lg-width": "100%",
    "lg-display": "flex",
    "lg-justify-content": "center",
    "lg-padding": "0px 0px 0px 0px",
    padding: "0px 36px 0px 0px",
    "md-padding": "0px 24px 0px 0px",
    "sm-padding": "0px 18px 0px 0px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "grid-gap": "16px",
    "lg-margin": "0px 0px 16px 0px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/move_stats.png?v=2023-04-26T12:10:26.979Z",
    "border-radius": "16px",
    "object-fit": "cover",
    width: "100%",
    "grid-row": "1 / span 5",
    "grid-column": "1 / span 1",
    "align-self": "auto",
    "justify-self": "auto",
    "box-shadow": "--xl"
  }))), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "flex-start",
    "lg-align-items": "center",
    "lg-width": "100%",
    padding: "0px 0px 0px 36px",
    "md-padding": "0px 0px 0px 24px",
    "lg-max-width": "320px",
    "sm-padding": "0px 0px 0px 18px",
    "lg-padding": "18px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "md-margin": "0px 0px 18px 0px",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm",
    "lg-margin": "0px 0px 16px 0px"
  }, "Pick the best moves to maximize your win-rate"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "md-font": "--leadMd",
    "sm-font": "--leadSm"
  }, "Weigh up your options by looking at stats from master games, engine evaluation and results at your level."))), /*#__PURE__*/React.createElement(Section, {
    background: "--sidebar",
    "inner-max-width": "1000px",
    padding: "0 0 100px 0",
    "md-padding": "0 0 80px 0",
    "lg-padding": "0 0 44px 0",
    "lg-background": "--sidebarDarker"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1",
    padding: "0px 36px 0px 0px",
    "md-padding": "0px 24px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-max-width": "320px",
    "sm-padding": "0px 18px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "md-margin": "0px 0px 18px 0px",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm",
    "lg-margin": "0px 0px 16px 0px"
  }, "Only spend time on the moves you'll actually see"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "md-font": "--leadMd",
    "sm-font": "--leadSm",
    display: "block"
  }, "Most books and courses are written", " ", /*#__PURE__*/React.createElement(Span, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, /*#__PURE__*/React.createElement(Strong, null, "by")), " ", "masters", " ", /*#__PURE__*/React.createElement(Span, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, /*#__PURE__*/React.createElement(Strong, null, "for")), " ", "masters. Chessbook lets you avoid obscure grandmaster lines and focus your effort on the moves that are common at your level.")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center",
    padding: "0px 0px 0px 36px",
    "md-padding": "0px 0px 0px 24px",
    "sm-padding": "0px 0px 0px 18px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/incidence.png?v=2023-04-02T09:04:04.254Z",
    "object-fit": "cover",
    width: "1000%",
    "border-radius": "16px",
    "box-shadow": "--xl"
  }))), /*#__PURE__*/React.createElement(Section, {
    "inner-max-width": "1000px",
    background: "url(/homepage_imgs/bobby.png?v=2023-04-24T10:51:51.196Z) 0% 0%,--sidebar",
    "background-size": "cover",
    "md-padding": "0 0 0 0",
    "lg-padding": "48px 0 4px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "block",
    "justify-content": "center",
    "overflow-y": "hidden",
    "overflow-x": "hidden",
    "lg-width": "100%",
    width: "50%",
    padding: "0px 36px 0px 0px",
    "text-align": "right",
    "md-padding": "0px 24px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "sm-padding": "0px 18px 0px 0px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/mobile.png?v=2023-04-24T02:10:28.648Z",
    width: "400px",
    "max-width": "100%",
    transition: "transform 0.5s ease-in-out 0s",
    "hover-transform": "translateY(0px)",
    "sm-width": "100%",
    filter: "--dropShadow",
    padding: "76px 0px 76px 0px",
    "lg-padding": "0px 0px 32px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 40px 0px",
    "sm-margin": "0px 0px 40px 0px",
    "sm-padding": "0px 0px 0px 18px",
    padding: "0px 0px 0px 36px",
    "md-padding": "0px 0px 0px 24px",
    "lg-max-width": "320px"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm",
    "lg-margin": "0px 0px 16px 0px",
    margin: "0px 0px 24px 0px",
    "md-margin": "0px 0px 18px 0px"
  }, "Targeted practice means you'll never forget a move"), /*#__PURE__*/React.createElement(Text, {
    color: "--lightD1",
    font: "--lead",
    "lg-text-align": "center",
    "lg-width": "100%",
    "md-font": "--leadMd",
    "sm-font": "--leadSm",
    "lg-margin": "0px 0px 0px 0px",
    margin: "0px 0px 0px 0px",
    display: "block"
  }, /*#__PURE__*/React.createElement(Span, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto",
    display: "block"
  }, "Chessbook uses", " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "spaced repetition,")), "a scientifically proven technique to memorize openings quickly and thoroughly."), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "sm-flex-direction": "column",
    "sm-width": "100%",
    "sm-text-align": "center",
    "justify-content": "flex-start",
    "align-items": "center"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "88px 0 80px 0",
    "sm-padding": "60px 0 52px 0",
    "inner-max-width": "1000px",
    background: "--sidebar",
    "md-padding": "68px 0 56px 0",
    "lg-padding": "44px 0 40px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "block",
    width: "100%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "sm-margin": "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1",
    "text-align": "center",
    margin: "0px 0px 60px 0px",
    "lg-max-width": "320px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 16px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm"
  }, "Collect all your openings in one place"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "md-font": "--leadMd",
    "md-margin": "12px 0px 12px 0px",
    "sm-font": "--leadSm",
    "lg-margin": "0px 0px 0px 0px"
  }, "Nobody gets their whole repertoire from a single course or book. Chessbook lets you combine openings from multiple sources to create a custom repertoire just for you.")), /*#__PURE__*/React.createElement(Box, {
    display: "block",
    width: "100%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/diagram.svg?v=2023-04-24T10:01:03.577Z",
    "object-fit": "cover",
    width: "100%",
    height: "100%"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "0px 0 100px 0",
    background: "url(),--sidebar",
    "inner-max-width": "1000px",
    "lg-padding": "48px 0 44px 0",
    "md-padding": "0px 0 80px 0",
    "sm-padding": "0px 0 60px 0",
    "lg-background": "--sidebarDarker"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "block",
    width: "100%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1",
    "text-align": "center",
    margin: "0px 0px 40px 0px",
    "lg-max-width": "320px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 8px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "md-font": "--headline2Md",
    "md-margin": "0px 0px 0p 0px",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm"
  }, "Learn middlegame plans for any\xA0opening"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "md-font": "--leadMd",
    "md-margin": "12px 0px 12px 0px",
    "sm-font": "--leadSm",
    "lg-margin": "12px 0px 0px 0px"
  }, "See how top players handle the positions that result from the openings you play.")), /*#__PURE__*/React.createElement(Box, {
    display: "block",
    width: "100%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/how-to-play.png?v=2023-04-24T02:19:18.668Z",
    "object-fit": "cover",
    width: "100%",
    height: "100%",
    "border-radius": "16px",
    "box-shadow": "--xl",
    display: "block"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "88px 0 100px 0",
    "inner-max-width": "1000px",
    background: "url(/homepage_imgs/pexels-cottonbro-studio.jpg?v=2023-04-25T07:11:32.398Z) 0% 0%/cover scroll,--sidebar",
    "md-padding": "68px 0 80px 0",
    "lg-padding": "44px 0 48px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "align-items": "center",
    "flex-direction": "column",
    "justify-content": "center",
    margin: "0px 0px 46px 0px",
    width: "100%",
    "sm-margin": "0px 0px 30px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline2",
    "text-align": "center",
    "md-font": "--headline2Md",
    margin: "0px 0px 0px 0px",
    "lg-font": "--headline2Sm",
    "sm-font": "--headline2Sm",
    "lg-width": "100%",
    "lg-max-width": "320px"
  }, "Endorsed by masters, loved by adult\xA0improvers")), /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "grid-template-columns": "repeat(3, 1fr)",
    "grid-gap": "24px",
    "md-order": "0",
    "md-display": "grid",
    "md-grid-gap": "18px",
    "sm-grid-gap": "12px",
    "lg-grid-template-rows": "repeat(3, 1fr)",
    "lg-grid-template-columns": "1fr",
    "lg-grid-gap": "16px"
  }, /*#__PURE__*/React.createElement(Box, {
    padding: "48px 48px 48px 48px",
    "border-width": 0,
    "border-style": "solid",
    "border-radius": "16px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start",
    "box-shadow": "--xl",
    background: "#ffffff",
    "md-padding": "24px 24px 24px 24px",
    "sm-padding": "16px 16px 16px 16px",
    "lg-padding": "24px 24px 24px 24px",
    "lg-max-width": "320px",
    "sm-border-radius": "12px",
    "md-border-radius": "12px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--grey",
    font: "--lead",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto",
    "md-font": "--leadMd",
    "lg-font": "--leadMd"
  }, "\u201CA great, free way to build your opening repertoire ... really smooth\u201D"), /*#__PURE__*/React.createElement(Image, {
    width: "40px",
    height: "40px",
    src: "/homepage_imgs/-qKIY2uU_400x400.jpg?v=2023-04-24T07:37:29.398Z",
    "border-radius": "22px",
    margin: "0px 15px 12px 0px",
    "md-margin": "0px 15px 9px 0px",
    "sm-height": "36px",
    "sm-width": "36px"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--twitterBlue",
    font: "--base",
    margin: "0px 0px 2px 0px",
    "md-font": "--baseMd"
  }, "Nate Solon", /*#__PURE__*/React.createElement("br", null), "FIDE Master"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--base",
    margin: "0px 0px 0px 0px",
    "md-font": "--baseMd"
  }, "2422 USCF")))), /*#__PURE__*/React.createElement(Box, {
    padding: "48px 48px 48px 48px",
    "border-style": "solid",
    "border-radius": "16px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start",
    "box-shadow": "--xl",
    "border-width": "0px",
    background: "#ffffff",
    "md-padding": "24px 24px 24px 24px",
    "sm-padding": "16px 16px 16px 16px",
    "lg-padding": "24px 24px 24px 24px",
    "lg-max-width": "320px",
    "sm-border-radius": "12px",
    "md-border-radius": "12px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--grey",
    font: "--lead",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto",
    "md-font": "--leadMd",
    "lg-font": "--leadMd"
  }, "\u201CThe best free chess websites?\xA0My picks: Lichess, OpeningTree, Chessbook\u201D"), /*#__PURE__*/React.createElement(Image, {
    width: "40px",
    height: "40px",
    src: "/homepage_imgs/MEi_9zB0_400x400.jpg?v=2023-04-24T07:37:48.338Z",
    "border-radius": "22px",
    margin: "0px 15px 12px 0px",
    "md-margin": "0px 15px 9px 0px",
    "sm-width": "36px",
    "sm-height": "36px"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--twitterBlue",
    font: "--base",
    margin: "0px 0px 2px 0px",
    "md-font": "--baseMd"
  }, "No\xEBl Studer", /*#__PURE__*/React.createElement("br", null), "Grandmaster"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--base",
    margin: "0px 0px 0px 0px",
    "md-font": "--baseMd"
  }, "2582 FIDE")))), /*#__PURE__*/React.createElement(Box, {
    padding: "48px 48px 48px 48px",
    "border-width": "0px",
    "border-style": "solid",
    "border-radius": "16px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start",
    "box-shadow": "--xl",
    background: "#ffffff",
    "md-padding": "24px 24px 24px 24px",
    "sm-padding": "16px 16px 16px 16px",
    "lg-padding": "24px 24px 24px 24px",
    "lg-max-width": "320px",
    "sm-border-radius": "12px",
    "md-border-radius": "12px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--grey",
    font: "--lead",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto",
    "md-font": "--leadMd",
    "lg-font": "--leadMd"
  }, "\"Absolutely amazing and unlike what anybody else has developed. It\u2019s exactly what I\u2019ve wanted since I started playing seriously.\""), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--twitterBlue",
    font: "--base",
    margin: "0px 0px 2px 0px",
    "md-font": "--baseMd"
  }, "Jon Myers", /*#__PURE__*/React.createElement("br", null), "Adult improver"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    font: "--base",
    margin: "0px 0px 0px 0px",
    "md-font": "--baseMd"
  }, "1275 Chess.com")))))), /*#__PURE__*/React.createElement(Section, {
    padding: "88px 0 68px 0",
    "lg-padding": "60px 0 60px 0",
    "sm-padding": "30px 0 30px 0",
    background: "--sidebar",
    "inner-max-width": "1000px",
    "md-display": "none"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    display: "block"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "align-items": "center",
    "flex-direction": "column",
    "justify-content": "center",
    width: "100%",
    "sm-margin": "0px 0px 30px 0px",
    margin: "0px 0px 16px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--light",
    font: "--headline2",
    "text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "The only tool made for creating a custom opening repertoire")), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 40px 0px",
    "md-margin": "0px 0px 40px 0px",
    "lg-margin": "0px 0px 32px 0px",
    display: "flex",
    "flex-direction": "row",
    "align-items": "center",
    "sm-margin": "0px 0px 10px 0px",
    "justify-content": "space-between",
    "lg-align-items": "center",
    "lg-flex-direction": "column",
    "lg-justify-content": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    display: "grid",
    "grid-template-columns": "repeat(4, 1fr)",
    "grid-gap": "24px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 0px 0px 0px",
    "flex-wrap": "wrap",
    width: "100%",
    padding: "110px 0px 64px 0px",
    "align-items": "flex-start",
    "flex-direction": "column",
    "justify-content": "flex-start",
    "md-padding": "92px 0px 64px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Create\xA0a\xA0custom\xA0repertoire"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Train\xA0with\xA0spaced\xA0repetition"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Find\xA0gaps\xA0automatically"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Avoid\xA0obscure\xA0moves"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Handle\xA0transpositions"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 300 16px/1.5 --fontFamily-googleInter",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Fast\xA0& modern\xA0interface"))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    background: "--sidebar",
    "border-width": "0px",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 16px 0px",
    "flex-direction": "column",
    "align-items": "center",
    "box-shadow": "--xl"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline3",
    margin: "0px 0px 0px 0px",
    "lg-text-align": "center",
    "lg-font": "normal 600 20px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 500 12px/1.2 \"Source Sans Pro\", sans-serif",
    height: "72px",
    "lg-height": "64px"
  }, "Chessbook", /*#__PURE__*/React.createElement("br", null)), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--chessbookGreen",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 0px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px"
  }))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 16px 0px",
    "flex-direction": "column",
    "align-items": "center",
    "border-width": "0px",
    background: "--sidebar",
    "box-shadow": "--xl"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline3",
    margin: "0px 0px 0px 0px",
    "lg-text-align": "center",
    "lg-font": "normal 600 20px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 500 12px/1.2 \"Source Sans Pro\", sans-serif",
    height: "72px",
    "lg-height": "64px"
  }, "Lichess\xA0studies"), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 0px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px"
  })))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 16px 0px",
    "flex-direction": "column",
    "align-items": "center",
    "border-width": "0px",
    background: "--sidebar",
    "box-shadow": "--xl"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline3",
    margin: "0px 0px 0px 0px",
    "lg-text-align": "center",
    "lg-font": "normal 600 20px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 500 12px/1.2 \"Source Sans Pro\", sans-serif",
    height: "72px",
    "lg-height": "64px"
  }, "Chessable"), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
    "flex-shrink": "0",
    width: "40px",
    height: "40px",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px",
    opacity: ".25",
    size: "30px"
  })), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 0px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px"
  })))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "88px 0 100px 0",
    margin: "0px 0px 0px 0px",
    "inner-max-width": "1000px",
    background: "rgb(20, 18, 19) url(/homepage_imgs/hero%20illustration.svg?v=2023-04-25T09:19:10.485Z) 0% 0% /100% repeat scroll padding-box",
    "md-padding": "68px 0 80px 0",
    "lg-padding": "44px 0 48px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "lg-flex-direction": "column",
    "lg-align-items": "center"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "align-items": "center",
    "flex-direction": "column",
    "justify-content": "center",
    margin: "0px 0px 60px 0px",
    width: "100%",
    "lg-padding": "0px 0px 0px 0px",
    "md-margin": "0px 0px 45px 0px",
    "lg-max-width": "320px",
    "lg-margin": "0px 0px 24px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 16px 0px",
    font: "--headline2",
    "text-align": "center",
    color: "--light",
    "md-font": "--headline2Md",
    "md-margin": "0px 0px 12px 0px",
    "sm-font": "--headline2Sm"
  }, "Get started for free, no signup\xA0required"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    "text-align": "center",
    font: "--lead",
    "md-font": "--leadMd",
    "sm-font": "--leadSm"
  }, "Create a simple repertoire in minutes with our free starter plan.")), /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "flex-wrap": "wrap",
    width: "100%",
    "align-items": "center",
    "justify-content": "center",
    "grid-gap": "24px",
    "grid-template-columns": "repeat(2, 1fr)",
    "md-display": "grid",
    "md-justify-content": "normal",
    "md-flex-wrap": "nowrap",
    "md-grid-gap": "18px",
    "sm-grid-gap": "12px",
    "lg-grid-template-rows": "repeat(2, 1fr)",
    "lg-grid-template-columns": "1fr",
    "lg-max-width": "320px",
    "lg-grid-gap": "16px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    padding: "48px 4px 48px 4px",
    "border-radius": "16px",
    "align-items": "center",
    "justify-content": "center",
    "flex-direction": "column",
    "border-style": "solid",
    "border-color": "--color-lightD2",
    "border-width": "0px",
    "box-shadow": "--xl",
    background: "--color-light",
    "md-flex": "0 1 auto",
    "md-padding": "36px 4px 36px 4px",
    "lg-padding": "24px 4px 24px 4px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    font: "--headline3",
    color: "--dark",
    "md-font": "--headline3Md",
    "md-margin": "0px 0px 18px 0px",
    "lg-margin": "0px 0px 16px 0px"
  }, "Starter"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 8px 0px",
    font: "--headline1",
    color: "--dark",
    "md-font": "--headline1Md",
    "md-margin": "0px 0px 6px 0px",
    "lg-font": "--headline1Sm",
    "lg-margin": "0px 0px 2px 0px"
  }, "Free"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 32px 0px",
    color: "--grey",
    "text-align": "center",
    font: "--base",
    "border-color": "--color-grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0px 24px 0px",
    "lg-margin": "0px 0px 18px 0px"
  }, "forever"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 48px 0px",
    color: "--grey",
    "text-align": "center",
    font: "--base",
    "border-color": "--color-grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0px 36px 0px",
    "lg-margin": "0px 0px 24px 0px"
  }, "Build a repertoire of up to 400 moves."), /*#__PURE__*/React.createElement(Link, {
    onClick: () => {
      props.onClick("free_get_started");
    },
    href: "#",
    "text-decoration-line": "initial",
    color: "--dark",
    font: "--headline3",
    padding: "12px 24px 12px 24px",
    "border-radius": "8px",
    transition: "background-color 0.2s ease-in-out 0s",
    "hover-transition": "background-color 0.2s ease-in-out 0s",
    "hover-background": "--color-orange",
    background: "--color-orange",
    "md-font": "--headline3Md",
    "md-padding": "9px 18px 9px 18px"
  }, "Get started"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--small",
    padding: "8px 0px 0px 0px",
    "md-font": "--smallMd",
    "md-padding": "6px 0px 0px 0px"
  }, "No signup required")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    padding: "48px 4px 48px 4px",
    "border-radius": "16px",
    "align-items": "center",
    "justify-content": "center",
    "flex-direction": "column",
    "border-style": "solid",
    position: "relative",
    "border-width": "0px",
    "box-shadow": "--xl",
    background: "--color-light",
    "md-padding": "36px 4px 36px 4px",
    "lg-padding": "24px 4px 24px 4px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    font: "--headline3",
    color: "--dark",
    "md-font": "--headline3Md",
    "md-margin": "0px 0px 18px 0px",
    "lg-margin": "0px 0px 16px 0px"
  }, "Pro"), /*#__PURE__*/React.createElement(Text, {
    display: "block",
    margin: "0px 0px 8px 0px",
    font: "--headline1",
    color: "--dark",
    "md-font": "--headline1Md",
    "md-margin": "0px 0px 6px 0px",
    "lg-font": "--headline1Sm",
    "lg-margin": "0px 0px 2px 0px"
  }, /*#__PURE__*/React.createElement(Span, {
    font: "--headline2",
    position: "relative",
    bottom: "16px",
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto",
    "md-font": "--headline2Md",
    "lg-font": "--headline2Sm",
    "lg-top": "-10px",
    "md-top": "-15px"
  }, "$"), "4"), /*#__PURE__*/React.createElement(Text, {
    color: "--grey",
    "text-align": "center",
    font: "--base",
    "border-color": "--color-grey",
    display: "block",
    margin: "0px 0px 32px 0px",
    "md-font": "--baseMd",
    "md-margin": "0px 0px 24px 0px",
    "lg-margin": "0px 0px 18px 0px"
  }, "per month"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 48px 0px",
    color: "--grey",
    "text-align": "center",
    font: "--base",
    "border-color": "--color-grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0px 36px 0px",
    "lg-margin": "0px 0px 24px 0px"
  }, "Add unlimited moves to any depth."), /*#__PURE__*/React.createElement(Link, {
    onClick: () => {
      props.onClick("pro_try_it_for_free");
    },
    "text-decoration-line": "initial",
    color: "--dark",
    font: "--headline3",
    padding: "12px 24px 12px 24px",
    "border-radius": "8px",
    transition: "background-color 0.2s ease-in-out 0s",
    "hover-transition": "background-color 0.2s ease-in-out 0s",
    "hover-background": "--color-orange",
    background: "--color-orange",
    "md-font": "--headline3Md",
    "md-padding": "9px 18px 9px 18px"
  }, "Try it for free"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--small",
    padding: "8px 0px 0px 0px",
    "md-font": "--smallMd",
    "md-padding": "6px 0px 0px 0px"
  }, "No signup required")))), /*#__PURE__*/React.createElement(Section, {
    padding: "88px 0 68px 0",
    color: "--dark",
    background: "--sidebar",
    "md-padding": "68px 0 48px 0",
    "lg-padding": "44px 0 44px 0"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h1",
    font: "--headline2",
    margin: "0 0 68px 0",
    color: "--light",
    "text-align": "center",
    "md-font": "--headline2Md",
    "sm-font": "--headline2Sm",
    "md-margin": "0 0 48px 0",
    "sm-margin": "0 0 36px 0"
  }, "Frequently asked questions"), /*#__PURE__*/React.createElement(Box, {
    margin: "-16px -16px -16px -16px",
    display: "flex",
    "flex-wrap": "wrap",
    "flex-direction": "row"
  }, /*#__PURE__*/React.createElement(Box, {
    padding: "16px 16px 16px 16px",
    width: "33.333%",
    "md-width": "50%",
    "sm-width": "100%",
    "md-padding": "16px 16px 0px 16px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    margin: "0px 0 12px 0",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm"
  }, "What is an \"opening repertoire\"?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 12px 0"
  }, "An", " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "opening repertoire"), " ", "is a set of pre-planned moves for the early part of a chess game. A complete repertoire will include responses to all of the opponent's potential moves during this phase of the game."))), /*#__PURE__*/React.createElement(Box, {
    width: "33.333%",
    padding: "16px 16px 16px 16px",
    "md-width": "50%",
    "sm-width": "100%",
    "md-padding": "16px 16px 0p 16px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    margin: "0px 0 12px 0",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm"
  }, "What's the benefit of having one?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 0px 0"
  }, "Having a well constructed repertoire that fits with your style can be a huge advantage. It can let you steer the game toward positions you are comfortable in and enjoy playing, improving your results."))), /*#__PURE__*/React.createElement(Box, {
    width: "33.333%",
    padding: "16px 16px 16px 16px",
    "md-width": "50%",
    "sm-width": "100%"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm",
    margin: "0px 0 12px 0"
  }, "What's the difference between an \"opening repertoire\" and an \"opening\"?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 0px 0"
  }, "An", " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "opening repertoire"), " ", "consists of", " ", /*#__PURE__*/React.createElement(Span, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "multiple"), " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "openings"), " ", "to combat different moves by the opponent. For example an e4 player will need to learn different openings to deal with the Sicilian, French, Caro-Kann etc."))), /*#__PURE__*/React.createElement(Box, {
    padding: "16px 16px 16px 16px",
    width: "33.333%",
    "md-width": "50%",
    "sm-width": "100%"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    margin: "0px 0 12px 0",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm"
  }, "What's the difference between an \"opening\" and a \"line\"?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 0px 0"
  }, "A", " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "line"), " ", "is a sequence of moves, one after another. An", " ", /*#__PURE__*/React.createElement(Strong, {
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "opening"), " ", "is made up of many lines. For example, someone who plays the Sicilian Dragon will need to learn many individual lines to master that opening."))), /*#__PURE__*/React.createElement(Box, {
    padding: "16px 16px 16px 16px",
    width: "33.333%",
    "md-width": "50%",
    "sm-width": "100%"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    margin: "0px 0 12px 0",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm"
  }, "I'm new to chess, do I need an opening repertoire?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 0px 0"
  }, "While having a solid repertoire becomes more important as you improve, even beginners can benefit from having a simple opening repertoire that prepares them for common moves at their level."))), /*#__PURE__*/React.createElement(Box, {
    padding: "16px 16px 16px 16px",
    width: "33.333%",
    "md-width": "50%",
    "sm-width": "100%"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    as: "h3",
    font: "--headline3",
    margin: "0px 0 12px 0",
    color: "--light",
    "md-font": "--headline3Md",
    "md-margin": "0px 0 12px 0",
    "sm-font": "--headline3Sm"
  }, "What's involved in learning a repertoire?"), /*#__PURE__*/React.createElement(Text, {
    as: "p",
    font: "--base",
    margin: "12px 0",
    color: "--grey",
    "md-font": "--baseMd",
    "md-margin": "0px 0 0px 0"
  }, "Learning a repertoire generally consists of choosing which openings and lines to play, memorising specific sequences of moves and understanding why those moves are played."))))), /*#__PURE__*/React.createElement(Section, {
    "background-color": "--dark",
    "text-align": "center",
    padding: "100px 0 100px 0",
    background: "--sidebar",
    "md-padding": "80px 0 80px 0",
    "lg-padding": "64px 0 64px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    display: "flex"
  }), /*#__PURE__*/React.createElement(LinkBox, {
    href: "https://discord.gg/vNzfu5VetQ",
    width: "127px",
    "align-self": "center"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "/homepage_imgs/discord-logo-white.svg?v=2023-04-26T12:21:14.409Z",
    display: "block",
    height: "24px",
    opacity: "0.5",
    "md-height": "18px"
  })), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--small",
    padding: "12px 0px 0px 0px",
    "md-font": "--smallMd",
    "md-padding": "9px 0px 0px 0px",
    display: "block"
  }, "Questions? Feedback? Ideas? Join the", " ", /*#__PURE__*/React.createElement(Link, {
    href: "https://discord.gg/vNzfu5VetQ",
    color: "--grey",
    "hover-color": "--orange",
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, "Chessbook Discord server"))), /*#__PURE__*/React.createElement(RawHtml, null, /*#__PURE__*/React.createElement("style", {
    place: "endOfHead",
    rawKey: "640ea4c14b38c40020027429"
  }, ":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}")));
});