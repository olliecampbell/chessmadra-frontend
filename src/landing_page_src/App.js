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

export default ({ onClick, onLogin }) => (
  <Router>
    <GlobalStyles />
    <Switch>
      <Route>
        <Index onClick={onClick} onLogin={onLogin} />
      </Route>
    </Switch>
  </Router>
);
