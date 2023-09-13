import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import Index from "./pages/index";

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
