import { RawHtml } from "@quarkly/components";
import { Link, Theme } from "@quarkly/widgets";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import React from "react";
import { Helmet } from "react-helmet";
import theme from "theme";
export default () => {
	return /*#__PURE__*/ React.createElement(
		Theme,
		{
			theme: theme,
		},
		/*#__PURE__*/ React.createElement(GlobalQuarklyPageStyles, {
			pageUrl: "404",
		}),
		/*#__PURE__*/ React.createElement(
			Helmet,
			null,
			/*#__PURE__*/ React.createElement("title", null, "Chessbook"),
			/*#__PURE__*/ React.createElement("meta", {
				name: "description",
				content:
					"Chessbook is the fastest way to build a bulletproof opening repertoire.",
			}),
			/*#__PURE__*/ React.createElement("meta", {
				property: "og:title",
				content: "Chessbook",
			}),
			/*#__PURE__*/ React.createElement("meta", {
				property: "og:description",
				content:
					"Chessbook is the fastest way to build a bulletproof opening repertoire.",
			}),
			/*#__PURE__*/ React.createElement("meta", {
				property: "og:image",
				content:
					"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/chessbook_og.png?v=2023-05-07T01:26:28.251Z",
			}),
			/*#__PURE__*/ React.createElement("link", {
				rel: "shortcut icon",
				href: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/favicon-32x32.png?v=2023-05-07T01:15:08.702Z",
				type: "image/x-icon",
			}),
			/*#__PURE__*/ React.createElement("link", {
				rel: "apple-touch-icon",
				href: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z",
			}),
			/*#__PURE__*/ React.createElement("link", {
				rel: "apple-touch-icon",
				sizes: "76x76",
				href: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z",
			}),
			/*#__PURE__*/ React.createElement("link", {
				rel: "apple-touch-icon",
				sizes: "152x152",
				href: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z",
			}),
			/*#__PURE__*/ React.createElement("link", {
				rel: "apple-touch-startup-image",
				href: "https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z",
			}),
		),
		/*#__PURE__*/ React.createElement(
			Link,
			{
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
				target: "_blank",
			},
			"Made on Quarkly",
		),
		/*#__PURE__*/ React.createElement(
			RawHtml,
			null,
			/*#__PURE__*/ React.createElement(
				"style",
				{
					place: "endOfHead",
					rawKey: "640ea4c14b38c40020027429",
				},
				":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}",
			),
		),
	);
};
