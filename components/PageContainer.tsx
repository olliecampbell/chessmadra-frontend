import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import React from "react";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { NavBar } from "app/components/NavBar";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "../utils/intersperse";
import Head from "next/head";

export const PageContainer = ({ children, centered, hideNavBar }: any) => {
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
    <View style={s(c.column, c.minHeight("100vh"), c.alignCenter)}>
      <React.StrictMode>
        {!hideNavBar && <NavBar />}
        <View
          style={s(
            c.grow,
            c.fullWidth,
            c.column,
            c.alignCenter,
            centered && c.justifyCenter
          )}
        >
          {children}
        </View>
        <Spacer height={32} />
        <View
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
                    className={`fas ${icon.icon}`}
                  ></i>
                </a>
              );
            }),
            (i) => {
              return <Spacer key={i} width={24} />;
            }
          )}
        </View>
      </React.StrictMode>
    </View>
  );
};

export interface SiteMetadata {
  title: string;
  description: string;
}

export const HeadSiteMeta = ({ siteMeta }: { siteMeta: SiteMetadata }) => {
  return (
    <Head>
      <title>{siteMeta.title}</title>
      {/*
      // @ts-ignore */}
      <meta itemProp="name" content={siteMeta.title} key="meta_name" />
      {/*
      // @ts-ignore */}
      <meta
        name="description"
        content={siteMeta.description}
        key="meta_description"
      />
      <meta
        name="twitter:site"
        content="chessmadra.com"
        key="meta_twitter:site"
      />
      <meta
        name="twitter:title"
        content={siteMeta.title}
        key="meta_twitter:title"
      />
      <meta
        name="twitter:description"
        content={siteMeta.description}
        key="meta_twitter:description"
      />
      <meta property="og:title" content={siteMeta.title} key="meta_og:title" />
      <meta
        property="og:description"
        content={siteMeta.description}
        key="meta_og:description"
      />
      <meta
        property="og:site_name"
        content="chessmadra.com"
        key="meta_og:site_name"
      />
      <meta
        name="description"
        content={siteMeta.description}
        key="meta_description"
      />
    </Head>
  );
};
