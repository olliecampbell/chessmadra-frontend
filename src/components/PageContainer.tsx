import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { NavBar } from "~/components/NavBar";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "../utils/intersperse";
import { Meta, Title } from "solid-start";
import { mergeProps, Show } from "solid-js";
import { isChessmadra } from "~/utils/env";

export const PageContainer = (props: any) => {
  const isMobile = useIsMobile();
  const icons = [
    {
      icon: "fa fa-hand-holding-dollar",
      link: "https://patreon.com/marcusbuffett",
    },
    {
      icon: "fa fa-twitter",
      link: "https://twitter.com/intent/tweet?url=https%3A%2F%2Fchessmadra.com&text=Check%20out%20this%20chess%20visualization%20site%20by%20%40marcusbuffett",
    },
    { icon: "fa fa-envelope", link: "mailto:me@mbuffett.com" },
  ];
  return (
    <div style={s(c.column, c.minHeight("100vh"), c.alignCenter)}>
      {!props.hideNavBar && <NavBar />}
      <div
        style={s(
          c.grow,
          c.fullWidth,
          c.column,
          c.alignCenter,
          props.centered && c.justifyCenter,
          !isMobile && !props.hideNavBar && c.mt(48)
        )}
      >
        {props.children}
      </div>
      <Show when={!props.hideIcons}>
        <>
          <Spacer height={32} />
          <div
            style={s(
              c.fullWidth,
              c.row,
              c.minHeight(48),
              c.py(32),
              // c.bg(c.gray[40]),
              c.center
            )}
          >
            {intersperse(
              icons.map((icon) => {
                return (
                  <a href={icon.link}>
                    <i
                      style={s(c.fg(c.colors.text.primary), c.fontSize(24))}
                      class={`fas ${icon.icon}`}
                    />
                  </a>
                );
              }),
              (i) => {
                return <Spacer width={24} />;
              }
            )}
          </div>
        </>
      </Show>
    </div>
  );
};

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
