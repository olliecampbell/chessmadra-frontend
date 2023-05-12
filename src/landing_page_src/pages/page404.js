import React from "react";
import theme from "theme";
import { Theme, Link } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { RawHtml } from "@quarkly/components";
export default (() => {
	return <Theme theme={theme}>
		<GlobalQuarklyPageStyles pageUrl={"404"} />
		<Helmet>
			<title>
				Chessbook
			</title>
			<meta name={"description"} content={"Chessbook is the fastest way to build a bulletproof opening repertoire."} />
			<meta property={"og:title"} content={"Chessbook"} />
			<meta property={"og:description"} content={"Chessbook is the fastest way to build a bulletproof opening repertoire."} />
			<meta property={"og:image"} content={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/chessbook_og.png?v=2023-05-07T01:26:28.251Z"} />
			<link rel={"shortcut icon"} href={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/favicon-32x32.png?v=2023-05-07T01:15:08.702Z"} type={"image/x-icon"} />
			<link rel={"apple-touch-icon"} href={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z"} />
			<link rel={"apple-touch-icon"} sizes={"76x76"} href={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z"} />
			<link rel={"apple-touch-icon"} sizes={"152x152"} href={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z"} />
			<link rel={"apple-touch-startup-image"} href={"https://uploads.quarkly.io/640ea4c14b38c4002002742b/images/apple-touch-icon.png?v=2023-05-07T01:14:52.500Z"} />
		</Helmet>
		<Link
			font={"--capture"}
			font-size={"10px"}
			position={"fixed"}
			bottom={"12px"}
			right={"12px"}
			z-index={"4"}
			border-radius={"4px"}
			padding={"5px 12px 4px"}
			background-color={"--dark"}
			opacity={"0.6"}
			hover-opacity={"1"}
			color={"--light"}
			cursor={"pointer"}
			transition={"--opacityOut"}
			quarkly-title={"Badge"}
			text-decoration-line={"initial"}
			href={"https://quarkly.io/"}
			target={"_blank"}
		>
			Made on Quarkly
		</Link>
		<RawHtml>
			<style place={"endOfHead"} rawKey={"640ea4c14b38c40020027429"}>
				{":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}"}
			</style>
		</RawHtml>
	</Theme>;
});