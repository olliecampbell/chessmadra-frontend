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

export default (props) => (
  <Router>
    <GlobalStyles />
    <Switch>
      <Route>
        <Index onClick={props.onClick} onLogin={props.onLogin} />
      </Route>
    </Switch>
  </Router>
);
