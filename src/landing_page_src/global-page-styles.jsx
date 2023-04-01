import React from "react";
import { transformVar } from "@quarkly/atomize";
import { createGlobalStyle } from "styled-components";

const pageStyles = {
  404: {
    background: "#0f0f13",
  },
  index: {
    background: "#0f0f13",
  },
};

const PageStyles = createGlobalStyle`
    body {
        ${({ styles }) =>
          Object.entries(styles || {}).map(
            ([prop, value]) => `${prop}: ${transformVar(prop, value)};`
          )}
    }
`;
export const GlobalQuarklyPageStyles = ({ pageUrl }) => (
  <PageStyles styles={pageStyles[pageUrl]} />
);
