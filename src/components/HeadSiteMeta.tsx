import { Meta, Title } from "@solidjs/meta";
import { mergeProps } from "solid-js";
import { isChessmadra } from "~/utils/env";

export interface SiteMetadata {
	title?: string;
	description?: string;
}

export const HeadSiteMeta = (_props: { siteMeta?: SiteMetadata }) => {
	const props = mergeProps({ siteMeta: {} as SiteMetadata }, _props);
	const title =
		props.siteMeta?.title ?? (isChessmadra ? "Chessmadra" : "Chessbook");
	const imageUrl = "/splash_og.png";
	const description =
		props.siteMeta?.description ??
		(isChessmadra
			? "Level up your chess tactics"
			: "Chessbook is the fastest way to build a bulletproof opening repertoire.");
	return (
		<>
			<Title>{title}</Title>
			{/*
      // @ts-ignore */}
			<Meta itemProp="name" content={title} key="meta_name" />
			{/*
      // @ts-ignore */}
			<Meta name="description" content={description} />
			<Meta name="twitter:site" content="chessbook.com" />
			<Meta name="twitter:title" content={title} />
			<Meta name="twitter:description" content={description} />
			<Meta property="og:title" content={title} />
			<Meta property="og:description" content={description} />
			<Meta property="og:site_name" content="chessbook.com" />
			<Meta name="description" content={description} />

			<Meta property="og:image" content={imageUrl} />
			<Meta name="twitter:image" content={imageUrl} />
		</>
	);
};
