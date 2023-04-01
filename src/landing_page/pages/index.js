import React from "react";
import theme from "../theme";
import { Theme, Link, Text, Box, Section, Image, Icon } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "../global-page-styles";
import { RawHtml, Override, Menu } from "@quarkly/components";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
export default (props => {
  console.log("props", props);
  return /*#__PURE__*/React.createElement(Theme, {
    theme: theme
  }, /*#__PURE__*/React.createElement(GlobalQuarklyPageStyles, {
    pageUrl: "index"
  }), /*#__PURE__*/React.createElement(Helmet, null, /*#__PURE__*/React.createElement("title", null, "Quarkly export"), /*#__PURE__*/React.createElement("meta", {
    name: "description",
    content: "Web site created using quarkly.io"
  }), /*#__PURE__*/React.createElement("link", {
    rel: "shortcut icon",
    href: "https://uploads.quarkly.io/readme/cra/favicon-32x32.ico",
    type: "image/x-icon"
  })), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    padding: "12px 0",
    "justify-content": "space-between",
    "align-items": "center",
    "flex-direction": "row",
    "md-flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0",
    "md-margin": "0px 0 20px 0",
    "text-align": "left",
    font: "--lead",
    color: "--light"
  }, "Chessbook"), /*#__PURE__*/React.createElement(Menu, {
    display: "flex",
    "justify-content": "center",
    font: "--base",
    "font-weight": "700",
    "md-flex-direction": "column",
    "md-align-items": "center"
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
  })))), /*#__PURE__*/React.createElement(Section, {
    padding: "140px 0 140px 0",
    "min-height": "100vh",
    "lg-background": "#fff",
    "md-padding": "96px 0 70px 0",
    "sm-padding": "72px 0 70px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 60px 0px",
    "sm-margin": "0px 0px 40px 0px",
    "sm-padding": "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline1",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Your personal opening book"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--grey",
    font: "--headline3",
    "lg-text-align": "center",
    width: "90%"
  }, "Chessbook is the fastest way to build a bulletproof opening repertoire."), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "sm-flex-direction": "column",
    "sm-text-align": "center"
  }, /*#__PURE__*/React.createElement(Link, {
    onClick: props.onClick,
    padding: "12px 24px 12px 24px",
    color: "--dark",
    background: "--color-secondary",
    "text-decoration-line": "initial",
    font: "--lead",
    "border-radius": "8px",
    margin: "0px 16px 0px 0px",
    "sm-margin": "0px 0px 16px 0px",
    "sm-text-align": "center",
    "hover-background": "--color-orange",
    "hover-transition": "background-color 0.2s ease-in-out 0s",
    transition: "background-color 0.2s ease-in-out 0s",
    "flex-direction": "row"
  }, "Try it for free"))), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "justify-content": "center",
    "overflow-y": "hidden",
    "overflow-x": "hidden",
    "lg-width": "100%"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/board%20test.png?v=2023-04-01T03:42:53.358Z",
    display: "block",
    "box-shadow": "--xl"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "sm-padding": "60px 0 60px 0",
    background: "--sidebar"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    width: "50%",
    "lg-width": "100%",
    "lg-display": "flex",
    "lg-justify-content": "center",
    "lg-padding": "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "grid-template-rows": "repeat(9, 60px)",
    "grid-template-columns": "repeat(2, 1fr)",
    "grid-gap": "16px",
    "lg-margin": "0px 0px 16px 0px",
    "sm-grid-template-rows": "repeat(9, 10vw)",
    width: "90%"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/817b58d40d53b5c4542045ca00717c4e.jpg?v=2023-04-01T04:57:58.994Z",
    "border-radius": "24px",
    "object-fit": "cover",
    width: "100%",
    "grid-row": "1 / span 5",
    "grid-column": "1 / span 1",
    height: "100%"
  }), /*#__PURE__*/React.createElement(Image, {
    src: "https://images.unsplash.com/photo-1560174038-da43ac74f01b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&h=2000",
    "border-radius": "24px",
    "object-fit": "cover",
    "grid-column": "2 / span 1",
    "grid-row": "2 / span 3",
    width: "100%",
    height: "100%"
  }), /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/chessableSquarev2.jpg?v=2023-04-01T04:55:29.415Z",
    "border-radius": "24px",
    "object-fit": "cover",
    width: "100%",
    "grid-column": "1 / span 1",
    "grid-row": "6 / span 3",
    height: "100%"
  }), /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/img_0003_17_4.jpg?v=2023-04-01T04:56:42.365Z",
    "border-radius": "24px",
    "object-fit": "cover",
    width: "100%",
    "grid-column": "2 / span 1",
    "grid-row": "5 / span 5",
    height: "100%"
  }))), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "flex-start",
    "lg-align-items": "center",
    "sm-margin": "20px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    "lg-width": "100%",
    "lg-padding": "24px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Get all your lines in one place"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center"
  }, "Nobody gets their whole repertoire from a single course or book. Chessbook lets you combine openings from multiple sources into a custom repertoire just for you.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Start from scratch or import from either PGN files or games played in your Lichess account."))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "sm-padding": "60px 0 60px 0",
    background: "--sidebar"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "30%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "sm-margin": "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    padding: "0px 4px 0px 0px",
    "justify-content": "center",
    "lg-order": "1"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Find the gaps in your repertoire before your opponents do"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center"
  }, "Chessbook automatically identifies the gaps in your repertoire so you know what you need to work on.")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "70%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    padding: "0px 0px 0px 32px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/test.png?v=2023-04-01T03:28:01.272Z",
    "object-fit": "cover",
    width: "100%",
    height: "100%",
    "border-radius": "24px",
    transform: "translateY(0px)",
    transition: "transform 0.2s ease-in-out 0s",
    "sm-min-height": "100vw",
    "box-shadow": "--xl"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "sm-padding": "60px 0 60px 0",
    background: "--sidebar"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    width: "50%",
    "lg-width": "100%",
    "lg-display": "flex",
    "lg-justify-content": "center",
    padding: "0px 16px 0px 0px",
    "lg-padding": "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "grid-gap": "16px",
    "lg-margin": "0px 0px 16px 0px",
    "sm-grid-template-rows": "repeat(9, 10vw)"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/move_stats.png?v=2023-04-01T04:15:53.809Z",
    "border-radius": "24px",
    "object-fit": "cover",
    width: "90%",
    "grid-row": "1 / span 5",
    "grid-column": "1 / span 1",
    height: "100%",
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
    "sm-margin": "20px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    padding: "16px 0px 16px 16px",
    "lg-width": "100%",
    "lg-padding": "24px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Choose the best moves to maximise your win-rate"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center"
  }, "Chessbook let you weigh up your options by looking at stats from master games, engine evaluation and results at your level."))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "sm-padding": "60px 0 60px 0",
    background: "--sidebar"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "sm-margin": "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    padding: "16px 16px 16px 0px",
    "justify-content": "center",
    "lg-order": "1"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Only spend time on the lines you'll actually see"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center"
  }, "Most books and courses are written by masters for masters. Chessbook lets you avoid obscure GM lines and focus your effort on the moves that are most common at your level.")), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "justify-content": "flex-end",
    "lg-width": "100%",
    "align-items": "flex-start",
    "lg-margin": "0px 0px 32px 0px",
    margin: "0px 0px 0px 0px",
    padding: "0px 0px 0px 32px",
    "lg-padding": "0px 0px 0px 0px",
    "lg-justify-content": "center"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=2000",
    "object-fit": "cover",
    width: "100%",
    height: "100%",
    "border-radius": "24px",
    "min-height": "600px",
    "max-width": "480px",
    "sm-min-height": "100vw"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "sm-padding": "60px 0 60px 0",
    "overflow-x": "visible",
    "flex-direction": "row",
    background: "--color-grey"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "md-flex-wrap": "wrap",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    margin: "0px 0px 0px 0px",
    "md-margin": "0px 0px 30px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--light",
    font: "--headline2",
    width: "100%",
    "lg-width": "100%",
    "lg-text-align": "center",
    "text-align": "center"
  }, "Understand every move you play")), /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    margin: "0px 0px 64px 0px",
    "md-margin": "0px 0px 30px 0px"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "100%",
    "md-flex-wrap": "wrap"
  }, /*#__PURE__*/React.createElement(Box, {
    width: "48.5%",
    display: "flex",
    "flex-direction": "column",
    "justify-content": "flex-start",
    "md-width": "100%",
    padding: "0px 0px 0px 0px",
    "md-padding": "0px 0px 0px 0px",
    "md-margin": "0px 0px 40px 0px",
    margin: "0px 3% 0px 0px"
  }, /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    height: "auto",
    "overflow-x": "hidden",
    "overflow-y": "hidden",
    position: "relative",
    padding: "60% 0px 0px 0px",
    "border-radius": "24px",
    "md-margin": "0px 0px 20px 0px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/annotations.png?v=2023-04-01T04:10:32.771Z",
    width: "100%",
    "object-fit": "cover",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    "max-height": "100%"
  })), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "100%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "sm-margin": "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    padding: "40px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline3",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Hundreds of move annotations"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--light",
    font: "--lead",
    "lg-text-align": "center"
  }, "Chessbook's move-by-move annotations explain the key ideas behind common moves. Don't like the built-in annotations? It's simple to edit them or add your own."))), /*#__PURE__*/React.createElement(Box, {
    width: "48.5%",
    display: "flex",
    "flex-direction": "column",
    "md-width": "100%",
    padding: "0px 0px 0px 0px",
    "md-padding": "0px 0px 0px 0px",
    "md-margin": "0px 0px 40px 0px",
    margin: "0px 3% 0px 0px",
    "justify-content": "flex-start"
  }, /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    height: "auto",
    "overflow-x": "hidden",
    "overflow-y": "hidden",
    position: "relative",
    padding: "60% 0px 0px 0px",
    "border-radius": "24px",
    "md-margin": "0px 0px 20px 0px"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/plans.png?v=2023-04-01T04:11:31.204Z",
    width: "100%",
    "object-fit": "cover",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    "max-height": "100%"
  })), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "100%",
    "flex-direction": "column",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 0px 0px",
    "sm-margin": "0px 0px 0px 0px",
    "sm-padding": "0px 0px 0px 0px",
    "justify-content": "center",
    "lg-order": "1",
    color: "--light",
    padding: "40px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline3",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Middlegame plans for any position"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--light",
    font: "--lead",
    "lg-text-align": "center"
  }, "Learn how top players handle the positions that result from the openings you play."))))), /*#__PURE__*/React.createElement(Section, {
    padding: "112px 0 112px 0",
    background: "--sidebar",
    "md-padding": "96px 0 0px 0",
    "sm-padding": "72px 0 0px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "justify-content": "center",
    "overflow-y": "hidden",
    "overflow-x": "hidden",
    "lg-width": "100%"
  }, /*#__PURE__*/React.createElement(Image, {
    src: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/phone_test.png?v=2023-04-01T03:56:39.359Z",
    width: "400px",
    "max-width": "100%",
    transition: "transform 0.5s ease-in-out 0s",
    "hover-transform": "translateY(0px)",
    "sm-width": "100%"
  })), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    width: "50%",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "flex-start",
    "lg-width": "100%",
    "lg-align-items": "center",
    "lg-margin": "0px 0px 60px 0px",
    "sm-margin": "0px 0px 40px 0px",
    "sm-padding": "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    color: "--light",
    font: "--headline2",
    "lg-text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Memorize your repertoire with next-gen spaced repetition"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 40px 0px",
    color: "--grey",
    font: "--lead",
    "lg-text-align": "center",
    "lg-width": "80%"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "https://en.wikipedia.org/wiki/Spaced_repetition"
  }, "Spaced repetition"), " ", "is a scientifically proven way to learn openings quickly and thoroughly."), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "sm-flex-direction": "column",
    "sm-width": "100%",
    "sm-text-align": "center",
    "justify-content": "flex-start",
    "align-items": "center"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "align-items": "center",
    "flex-direction": "column",
    "justify-content": "center",
    margin: "0px 0px 56px 0px",
    width: "100%",
    "sm-margin": "0px 0px 30px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 16px 0px",
    color: "--light",
    font: "--headline2",
    "text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif"
  }, "Recommended by masters, loved by adult improvers")), /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "grid-template-columns": "repeat(3, 1fr)",
    "grid-gap": "16px",
    "lg-grid-template-columns": "repeat(2, 1fr)",
    "md-grid-template-columns": "1fr"
  }, /*#__PURE__*/React.createElement(Box, {
    padding: "50px 55px 50px 55px",
    "sm-padding": "55px 40px 50px 55px",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "24px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--light",
    font: "--lead",
    "lg-margin": "0px 0px 50px 0px",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto"
  }, "\u201CA great, free way to build your opening repertoire ... really smooth\u201D"), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 600 16px/1.5 --fontFamily-googleSourceSansPro",
    margin: "0px 0px 2px 0px"
  }, "Nate Solon, FIDE Master"), /*#__PURE__*/React.createElement(Text, {
    color: "--greyD1",
    font: "--base",
    margin: "0px 0px 0px 0px"
  }, "2422 USCF")))), /*#__PURE__*/React.createElement(Box, {
    padding: "50px 55px 50px 55px",
    "sm-padding": "55px 40px 50px 55px",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "24px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--light",
    font: "--lead",
    "lg-margin": "0px 0px 50px 0px",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto"
  }, "\u201CThe best free chess websites?", /*#__PURE__*/React.createElement("br", null), "My picks:", /*#__PURE__*/React.createElement("br", null), "Lichess", /*#__PURE__*/React.createElement(Link, {
    href: "https://twitter.com/lichess?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1637040832539774979%7Ctwgr%5E%7Ctwcon%5Es1_&ref_url=about%3Asrcdoc",
    "overflow-wrap": "normal",
    "word-break": "normal",
    "white-space": "normal",
    "text-indent": "0",
    "text-overflow": "clip",
    hyphens: "manual",
    "user-select": "auto",
    "pointer-events": "auto"
  }, /*#__PURE__*/React.createElement("br", null)), "OpeningTree", /*#__PURE__*/React.createElement("br", null), "Chessbook\u201D"), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 600 16px/1.5 --fontFamily-googleSourceSansPro",
    margin: "0px 0px 2px 0px"
  }, "No\xEBl Studer, Grandmaster"), /*#__PURE__*/React.createElement(Text, {
    color: "--greyD1",
    font: "--base",
    margin: "0px 0px 0px 0px"
  }, "2582 FIDE")))), /*#__PURE__*/React.createElement(Box, {
    padding: "50px 55px 50px 55px",
    "sm-padding": "55px 40px 50px 55px",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "24px",
    "border-color": "--color-grey",
    display: "flex",
    "flex-direction": "column",
    "align-items": "flex-start"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 35px 0px",
    color: "--light",
    font: "--lead",
    "lg-margin": "0px 0px 50px 0px",
    "sm-margin": "0px 0px 30px 0px",
    flex: "1 0 auto"
  }, "\"Absolutely amazing and unlike what anybody else has developed. It\u2019s exactly what I\u2019ve wanted since I started playing seriously.\""), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    margin: "0px 17px 0px 0px",
    "align-items": "flex-start",
    "flex-direction": "column"
  }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "normal 600 16px/1.5 --fontFamily-googleSourceSansPro",
    margin: "0px 0px 2px 0px"
  }, "Jon Myers, adult improver"), /*#__PURE__*/React.createElement(Text, {
    color: "--greyD1",
    font: "--base",
    margin: "0px 0px 0px 0px"
  }, "1275 on Chess.com")))))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    "lg-padding": "60px 0 60px 0",
    "sm-padding": "30px 0 30px 0",
    background: "--color-dark"
  }, /*#__PURE__*/React.createElement(Box, {
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
    "grid-gap": "32px"
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
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Create a custom repertoire"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Train with spaced repetition"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Find gaps automatically"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Avoid obscure lines"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Handle transpositions"), /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--lead",
    margin: "0px 0px 0px 0px",
    "md-font": "normal 500 16px/1.2 \"Source Sans Pro\", sans-serif",
    height: "68px"
  }, "Fast and modern interface"))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    background: "--color-primary",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 64px 0px",
    "flex-direction": "column",
    "align-items": "center"
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
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
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
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
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
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
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
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
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
    width: "40px",
    height: "40px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    color: "#F7FBFF",
    margin: "0px 0px 28px 0px"
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
  }))), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }, /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    background: "--color-darkL2",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 64px 0px",
    "flex-direction": "column",
    "align-items": "center"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline3",
    margin: "0px 0px 0px 0px",
    "lg-text-align": "center",
    "lg-font": "normal 600 20px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 500 12px/1.2 \"Source Sans Pro\", sans-serif",
    height: "72px",
    "lg-height": "64px"
  }, "Lichess studies"), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "rgba(247, 251, 255, 0.15)",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdCheckmark,
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
    display: "flex",
    "flex-wrap": "wrap",
    width: "100%",
    background: "--color-darkL2",
    "border-width": "1px",
    "border-style": "solid",
    "border-radius": "16px",
    padding: "32px 0px 64px 0px",
    "flex-direction": "column",
    "align-items": "center"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "--light",
    font: "--headline3",
    margin: "0px 0px 0px 0px",
    "lg-text-align": "center",
    "lg-font": "normal 600 20px/1.2 \"Source Sans Pro\", sans-serif",
    "md-font": "normal 500 12px/1.2 \"Source Sans Pro\", sans-serif",
    height: "72px",
    "lg-height": "64px"
  }, "Chessable", /*#__PURE__*/React.createElement("br", null)), /*#__PURE__*/React.createElement(Box, {
    margin: "0px 0px 28px 0px",
    background: "--color-darkL1",
    "border-radius": "100%",
    height: "40px",
    "md-margin": "0px 0px 15px 0px",
    "sm-margin": "0px 0px 14px 0px"
  }, /*#__PURE__*/React.createElement(Icon, {
    category: "io",
    icon: IoMdClose,
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
  })), /*#__PURE__*/React.createElement(Box, {
    "sm-padding": "15px 4px 15px 4px"
  }))), /*#__PURE__*/React.createElement(Section, {
    padding: "80px 0 80px 0",
    margin: "0px 0px 0px 0px",
    background: "--sidebar"
  }, /*#__PURE__*/React.createElement(Override, {
    slot: "SectionContent",
    "flex-direction": "row",
    "flex-wrap": "wrap"
  }), /*#__PURE__*/React.createElement(Box, {
    display: "flex",
    "align-items": "center",
    "flex-direction": "column",
    "justify-content": "center",
    margin: "0px 0px 60px 0px",
    width: "100%",
    "sm-margin": "0px 0px 30px 0px",
    padding: "0px 200px 0px 200px",
    "lg-padding": "0px 0px 0px 0px"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 16px 0px",
    font: "--headline2",
    "text-align": "center",
    "sm-font": "normal 700 42px/1.2 \"Source Sans Pro\", sans-serif",
    color: "--light"
  }, "Price"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 0px 0px",
    color: "--grey",
    "text-align": "center",
    font: "--lead"
  }, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua")), /*#__PURE__*/React.createElement(Box, {
    display: "grid",
    "flex-wrap": "wrap",
    width: "100%",
    "align-items": "center",
    "justify-content": "center",
    "grid-gap": "30px",
    "grid-template-columns": "repeat(2, 1fr)",
    "md-grid-template-columns": "1fr"
  }, /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    display: "flex",
    padding: "48px 40px 56px 40px",
    background: "--color-light",
    "border-radius": "24px",
    "align-items": "center",
    "justify-content": "center",
    "flex-direction": "column",
    "lg-padding": "48px 35px 56px 35px",
    "border-style": "solid",
    "border-color": "--color-lightD2"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    font: "--headline3"
  }, "Freelance"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 8px 0px",
    font: "--headline2"
  }, "Free"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 32px 0px",
    color: "--greyD2",
    "text-align": "center",
    font: "--base"
  }, "forever"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 48px 0px",
    color: "--greyD2",
    "text-align": "center",
    font: "--base"
  }, "Curabitur lobortis id lorem id bibendum. Ut id consectetur magna. Quisque volutpat augue enim, pulvinar lobortis nibh lacinia at"), /*#__PURE__*/React.createElement(Link, {
    href: "#",
    "text-decoration-line": "initial",
    color: "--dark",
    font: "--lead",
    padding: "12px 24px 12px 24px",
    "border-radius": "8px",
    background: "--color-secondary",
    transition: "background-color 0.2s ease-in-out 0s",
    "hover-transition": "background-color 0.2s ease-in-out 0s",
    "hover-background": "--color-orange"
  }, "Select plan")), /*#__PURE__*/React.createElement(Box, {
    width: "100%",
    display: "flex",
    padding: "48px 40px 56px 40px",
    background: "--color-light",
    "border-radius": "24px",
    "align-items": "center",
    "justify-content": "center",
    "flex-direction": "column",
    "border-width": 0,
    "border-style": "solid",
    "border-color": "--color-secondary",
    "lg-padding": "48px 35px 56px 35px",
    position: "relative"
  }, /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 24px 0px",
    font: "--headline3"
  }, "Startup"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 8px 0px",
    font: "--headline2"
  }, "$3"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 32px 0px",
    color: "--greyD2",
    "text-align": "center",
    font: "--base"
  }, "per month"), /*#__PURE__*/React.createElement(Text, {
    margin: "0px 0px 48px 0px",
    color: "--greyD2",
    "text-align": "center",
    font: "--base"
  }, "Curabitur lobortis id lorem id bibendum. Ut id consectetur magna. Quisque volutpat augue enim, pulvinar lobortis nibh lacinia at"), /*#__PURE__*/React.createElement(Link, {
    href: "#",
    "text-decoration-line": "initial",
    color: "--dark",
    font: "--lead",
    padding: "12px 24px 12px 24px",
    "border-radius": "8px",
    background: "--color-secondary",
    transition: "background-color 0.2s ease-in-out 0s",
    "hover-transition": "background-color 0.2s ease-in-out 0s",
    "hover-background": "--color-orange"
  }, "Select plan")))), /*#__PURE__*/React.createElement(Link, {
    font: "--capture",
    "font-size": "10px",
    position: "fixed",
    bottom: "12px",
    right: "12px",
    "z-index": "4",
    "border-radius": "4px",
    padding: "5px 12px 4px",
    "background-color": "--dark",
    opacity: "0.6",
    "hover-opacity": "1",
    color: "--light",
    cursor: "pointer",
    transition: "--opacityOut",
    "quarkly-title": "Badge",
    "text-decoration-line": "initial",
    href: "https://quarkly.io/",
    target: "_blank"
  }, "Made on Quarkly"), /*#__PURE__*/React.createElement(RawHtml, null, /*#__PURE__*/React.createElement("style", {
    place: "endOfHead",
    rawKey: "640ea4c14b38c40020027429"
  }, ":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}")));
});