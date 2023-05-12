import React from "react";
import { transformVar } from "@quarkly/atomize";
import { createGlobalStyle } from "styled-components";
const pageStyles = {
  index: {
    background: "--color-dark url(https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/hero-illustration@3x.png?v=2023-05-07T03:05:23.225Z) 0% 0% /100% repeat scroll padding-box",
    "max-width": ""
  }
};
const PageStyles = createGlobalStyle`
    body {
        ${({
  styles
}) => Object.entries(styles || {}).map(([prop, value]) => `${prop}: ${transformVar(prop, value)};`)}
    }
`;
export const GlobalQuarklyPageStyles = ({
  pageUrl
}) => /*#__PURE__*/React.createElement(PageStyles, {
  styles: pageStyles[pageUrl]
});