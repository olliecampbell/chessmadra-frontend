import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { NavBar } from "~/components/NavBar";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "../utils/intersperse";
import { View } from "./View";
import { Helmet } from "~/mocks";
import { Meta, Title } from "solid-start";
import { Show } from "solid-js";

export const PageContainer = ({
  children,
  centered,
  hideNavBar,
  hideIcons,
}: any) => {
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
      {!hideNavBar && <NavBar />}
      <div
        style={s(
          c.grow,
          c.fullWidth,
          c.column,
          c.alignCenter,
          centered && c.justifyCenter,
          !isMobile && !hideNavBar && c.mt(48)
        )}
      >
        {children}
      </div>
      <Show when={!hideIcons}>
        <>
          <Spacer height={32} />
          <div
            style={s(
              c.fullWidth,
              c.row,
              c.minHeight(48),
              c.py(32),
              // c.bg(c.grays[40]),
              c.center
            )}
          >
            {intersperse(
              icons.map((icon) => {
                return (
                  <a href={icon.link} key={icon.link}>
                    <i
                      style={s(c.fg(c.colors.textPrimary), c.fontSize(24))}
                      class={`fas ${icon.icon}`}
                    ></i>
                  </a>
                );
              }),
              (i) => {
                return <Spacer key={i} width={24} />;
              }
            )}
          </div>
        </>
      </Show>
    </div>
  );
};

export interface SiteMetadata {
  title: string;
  description: string;
}

export const HeadSiteMeta = ({ siteMeta }: { siteMeta: SiteMetadata }) => {
  return (
    <>
      <Title>{siteMeta.title}</Title>
      {/*
      // @ts-ignore */}
      <Meta itemProp="name" content={siteMeta.title} key="meta_name" />
      {/*
      // @ts-ignore */}
      <Meta name="description" content={siteMeta.description} />
      <Meta name="twitter:site" content="chessmadra.com" />
      <Meta name="twitter:title" content={siteMeta.title} />
      <Meta name="twitter:description" content={siteMeta.description} />
      <Meta property="og:title" content={siteMeta.title} />
      <Meta property="og:description" content={siteMeta.description} />
      <Meta property="og:site_name" content="chessmadra.com" />
      <Meta name="description" content={siteMeta.description} />
    </>
  );
};
