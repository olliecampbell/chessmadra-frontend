import React from "react";
import ReactDOM from "react-dom";
import Index from "./Index";
import QAPI from "./qapi";
window.QAPI = QAPI;
ReactDOM.render( /*#__PURE__*/React.createElement(Index, null), document.getElementById("root"));