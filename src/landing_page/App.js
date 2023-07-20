import React from "react";
import Index from "./pages/index";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
const GlobalStyles = createGlobalStyle`
    body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
    }
`;
export default ({ onClick, onLogin }) =>
  /*#__PURE__*/ React.createElement(
    Router,
    null,
    /*#__PURE__*/ React.createElement(GlobalStyles, null),
    /*#__PURE__*/ React.createElement(
      Switch,
      null,
      /*#__PURE__*/ React.createElement(
        Route,
        null,
        /*#__PURE__*/ React.createElement(Index, {
          onClick: onClick,
          onLogin: onLogin,
        }),
      ),
    ),
  );
