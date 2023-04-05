import React from "react";
import Index from "./pages/index";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
    .landing-page {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
      color: black !important;
    }
`;

export default (props) => (
  <Router>
    <GlobalStyles />
    <Switch>
      <Route component={() => <Index {...props} />} />
    </Switch>
  </Router>
);
