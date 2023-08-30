import React, { useRef, useEffect } from "react";
import theme from "../theme";
import { HomePageStickyNav } from "../../components/HomePageStickyNav";
import {
  Theme,
  Link,
  Image,
  Box,
  Section,
  Text,
  Strong,
  Span,
  Icon,
  LinkBox,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "../global-page-styles";
import { RawHtml, Override, Menu } from "@quarkly/components";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { posthog } from "posthog-js";
export default (props) => {
  const stickyHomepageCTA = posthog.getFeatureFlag("sticky-homepage-cta");
  console.log("feature?", stickyHomepageCTA, HomePageStickyNav());

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"index"} />
      <Helmet>
        <title>Chessbook</title>
        <meta property={"og:title"} content={"Chessbook"} />
      </Helmet>

      <Section md-padding="18px 0 18px 0">
        <div
          ref={(x) => {
            if (x) {
              x.appendChild(
                HomePageStickyNav({
                  onClick: () => props?.onClick("sticky-homepage-cta"),
                }),
              );
            }
          }}
        />

        <Box
          display="flex"
          padding="12px 0"
          justify-content="space-between"
          align-items="center"
          flex-direction="row"
          md-padding="9px 0 9px 0"
        >
          <Image
            src="/homepage_imgs/chessbook.svg?v=2023-04-11T09:44:19.974Z"
            display="block"
            height="24px"
            md-height="18px"
          />
          <Menu
            display="flex"
            justify-content="center"
            font="--base"
            font-weight="700"
            md-flex-direction="column"
            md-align-items="center"
            padding="0px 0px 0px 0px"
          >
            <Override
              slot="link"
              text-decoration="none"
              color="--dark"
              padding="6px 12px"
            />
            <Override slot="link-active" color="--primary" />
            <Override slot="item" padding="6px" />
            <Box
              slot="link-index"
              display={"flex"}
              flex-direction="row"
              align-items="center"
              style={{
                gap: "8px",
              }}
            >
              <Link
                onClick={() => {
                  props.onLogin();
                }}
                href="/login"
                border-color="--color-lightD1"
                hover-color="--orange"
                font="--lead"
                color="--grey"
                md-font="--leadMd"
                lg-padding="6px 0px 6px 9px"
                padding="0px 0px 0px 0px"
              >
                Log in
              </Link>
              <div
                style={{
                  width: "1px",
                  height: "16px",
                  background: "white",
                  opacity: "0.35",
                }}
              />
              <Link
                onClick={() => {
                  props.onClick("signup");
                }}
                href="/login"
                border-color="--color-lightD1"
                hover-color="--orange"
                font="--lead"
                color="--grey"
                md-font="--leadMd"
                lg-padding="6px 0px 6px 9px"
                padding="0px 0px 0px 0px"
              >
                Sign up
              </Link>
            </Box>
          </Menu>
        </Box>
      </Section>
      <Section
        padding="64px 0 0px 0"
        md-padding="68px 0 0px 0"
        sm-padding="72px 0 0px 0"
        inner-max-width="1000px"
        background="rgba(0, 0, 0, 0) url() 0% 0% /auto repeat scroll padding-box"
        lg-padding="60px 0 0px 0"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="flex"
          width="100%"
          flex-direction="column"
          justify-content="center"
          align-items="center"
          lg-margin="0px 0px 48px 0px"
          sm-margin="0px 0px 40px 0px"
          margin="0px 0px 48px 0px"
          padding="0px 0px 0px 0px"
          sm-padding="0px 0px 0px 0px"
          lg-max-width="320px"
          lg-order="0"
        >
          <Text
            margin="0px 0px 20px 0px"
            color="--light"
            font="--headline1"
            lg-text-align="center"
            sm-font='normal 700 42px/1.2 "Source Sans Pro", sans-serif'
            text-align="center"
            width="100%"
            md-font="--headline1Md"
            sm-width="100%"
            md-margin="0px 0px 15px 0px"
            lg-font="--headline1Sm"
            lg-margin="0px 0px 16px 0px"
          >
            Your personal opening book
          </Text>
          <Text
            margin="0px 0px 36px 0px"
            color="--lightD1"
            font="--headline3"
            lg-text-align="center"
            text-align="center"
            md-font="--headline3Md"
            md-margin="0px 0px 27px 0px"
            sm-font="--headline3Sm"
            lg-margin="0px 0px 24px 0px"
          >
            Chessbook is the fastest way to build a bulletproof opening
            repertoire.
          </Text>
          <Link
            onClick={() => {
              props.onClick("splash_cta");
            }}
            padding="12px 24px 12px 24px"
            color="--dark"
            text-decoration-line="initial"
            font="--headline3"
            border-radius="8px"
            margin="0px 0px 0px 0px"
            sm-margin="0px 0px 0px 0px"
            sm-text-align="center"
            hover-transition="background-color 0.2s linear 0s"
            hover-background="--color-orange"
            transition="background-color 0.2s linear 0s"
            background="--color-light"
            md-font="--headline3Md"
            md-padding="9px 18px 9px 18px"
          >
            Try it for free
          </Link>
          <Text
            margin="0px 0px 0px 0px"
            color="--grey"
            font="--small"
            padding="8px 0px 0px 0px"
            md-font="--smallMd"
            md-padding="6px 0px 0px 0px"
          >
            No signup required
          </Text>
        </Box>
        <Box
          display="flex"
          width="100%"
          justify-content="center"
          overflow-y="hidden"
          overflow-x="hidden"
          lg-width="100%"
        >
          <Image
            src="/homepage_imgs/desktop-hero.png?v=2023-04-24T11:44:36.906Z"
            hover-transform="translateY(0px)"
            padding="0px 0px 0px 0px"
            margin="0px 0px 0px 50"
          />
        </Box>
      </Section>
      <Section
        padding="100px 0 100px 0"
        background="--sidebar"
        inner-max-width="1000px"
        md-padding="80px 0 80px 0"
        lg-padding="24px 0 40px 0"
        lg-background="--sidebarDarker"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="flex"
          width="50%"
          flex-direction="column"
          align-items="flex-start"
          lg-align-items="center"
          lg-margin="0px 0px 0px 0px"
          justify-content="center"
          lg-order="1"
          padding="0px 36px 0px 0px"
          md-padding="0px 24px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-max-width="320px"
          lg-width="100%"
          sm-padding="0px 18px 0px 0px"
        >
          <Text
            margin="0px 0px 24px 0px"
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            md-margin="0px 0px 18px 0px"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
            lg-margin="0px 0px 16px 0px"
          >
            Find the gaps in your repertoire before your opponents do
          </Text>
          <Text
            color="--grey"
            font="--lead"
            lg-text-align="center"
            md-font="--leadMd"
            margin="0px 0px 0px 0px"
            sm-font="--leadSm"
          >
            Chessbook calculates your coverage per opening so you always know
            what to work on.
          </Text>
        </Box>
        <Box
          display="flex"
          width="50%"
          justify-content="flex-end"
          lg-width="100%"
          align-items="flex-start"
          lg-margin="0px 0px 32px 0px"
          margin="0px 0px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-justify-content="center"
          padding="0px 0px 0px 36px"
          md-padding="0px 0px 0px 24px"
          sm-padding="0px 0px 0px 18px"
        >
          <Image
            src="/homepage_imgs/coverage.png?v=2023-04-26T12:10:10.140Z"
            object-fit="cover"
            width="100%"
            border-radius="16px"
            transform="translateY(0px)"
            transition="transform 0.2s ease-in-out 0s"
            box-shadow="--xl"
          />
        </Box>
      </Section>
      <Section
        background="--sidebar"
        padding="0px 0 100px 0"
        inner-max-width="1000px"
        md-padding="0px 0 80px 0"
        lg-padding="0px 0 40px 0"
        lg-background="--sidebarDarker"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          width="50%"
          lg-width="100%"
          lg-display="flex"
          lg-justify-content="center"
          lg-padding="0px 0px 0px 0px"
          padding="0px 36px 0px 0px"
          md-padding="0px 24px 0px 0px"
          sm-padding="0px 18px 0px 0px"
        >
          <Box display="grid" grid-gap="16px" lg-margin="0px 0px 16px 0px">
            <Image
              src="/homepage_imgs/move_stats.png?v=2023-04-26T12:10:26.979Z"
              border-radius="16px"
              object-fit="cover"
              width="100%"
              grid-row="1 / span 5"
              grid-column="1 / span 1"
              align-self="auto"
              justify-self="auto"
              box-shadow="--xl"
            />
          </Box>
        </Box>
        <Box
          display="flex"
          width="50%"
          flex-direction="column"
          justify-content="center"
          align-items="flex-start"
          lg-align-items="center"
          lg-width="100%"
          padding="0px 0px 0px 36px"
          md-padding="0px 0px 0px 24px"
          lg-max-width="320px"
          sm-padding="0px 0px 0px 18px"
          lg-padding="18px 0px 0px 0px"
        >
          <Text
            margin="0px 0px 24px 0px"
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            md-margin="0px 0px 18px 0px"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
            lg-margin="0px 0px 16px 0px"
          >
            Pick the best moves to maximize your win-rate
          </Text>
          <Text
            margin="0px 0px 0px 0px"
            color="--grey"
            font="--lead"
            lg-text-align="center"
            md-font="--leadMd"
            sm-font="--leadSm"
          >
            Weigh up your options by looking at stats from master games, engine
            evaluation and results at your level.
          </Text>
        </Box>
      </Section>
      <Section
        background="--sidebar"
        inner-max-width="1000px"
        padding="0 0 100px 0"
        md-padding="0 0 80px 0"
        lg-padding="0 0 44px 0"
        lg-background="--sidebarDarker"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="flex"
          width="50%"
          flex-direction="column"
          align-items="flex-start"
          lg-width="100%"
          lg-align-items="center"
          lg-margin="0px 0px 0px 0px"
          justify-content="center"
          lg-order="1"
          padding="0px 36px 0px 0px"
          md-padding="0px 24px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-max-width="320px"
          sm-padding="0px 18px 0px 0px"
        >
          <Text
            margin="0px 0px 24px 0px"
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            md-margin="0px 0px 18px 0px"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
            lg-margin="0px 0px 16px 0px"
          >
            Only spend time on the moves you'll actually see
          </Text>
          <Text
            margin="0px 0px 0px 0px"
            color="--grey"
            font="--lead"
            lg-text-align="center"
            md-font="--leadMd"
            sm-font="--leadSm"
            display={"block"}
          >
            Most books and courses are written{" "}
            <Span
              overflow-wrap="normal"
              word-break="normal"
              white-space="normal"
              text-indent="0"
              text-overflow="clip"
              hyphens="manual"
              user-select="auto"
              pointer-events="auto"
            >
              <Strong>by</Strong>
            </Span>{" "}
            masters{" "}
            <Span
              overflow-wrap="normal"
              word-break="normal"
              white-space="normal"
              text-indent="0"
              text-overflow="clip"
              hyphens="manual"
              user-select="auto"
              pointer-events="auto"
            >
              <Strong>for</Strong>
            </Span>{" "}
            masters. Chessbook lets you avoid obscure grandmaster lines and
            focus your effort on the moves that are common at your level.
          </Text>
        </Box>
        <Box
          display="flex"
          width="50%"
          justify-content="flex-end"
          lg-width="100%"
          align-items="flex-start"
          lg-margin="0px 0px 32px 0px"
          margin="0px 0px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-justify-content="center"
          padding="0px 0px 0px 36px"
          md-padding="0px 0px 0px 24px"
          sm-padding="0px 0px 0px 18px"
        >
          <Image
            src="/homepage_imgs/incidence.png?v=2023-04-02T09:04:04.254Z"
            object-fit="cover"
            width="1000%"
            border-radius="16px"
            box-shadow="--xl"
          />
        </Box>
      </Section>
      <Section
        inner-max-width="1000px"
        background="url(/homepage_imgs/bobby.png?v=2023-04-24T10:51:51.196Z) 0% 0%,--sidebar"
        background-size="cover"
        md-padding="0 0 0 0"
        lg-padding="48px 0 4px 0"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="block"
          justify-content="center"
          overflow-y="hidden"
          overflow-x="hidden"
          lg-width="100%"
          width="50%"
          padding="0px 36px 0px 0px"
          text-align="right"
          md-padding="0px 24px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          sm-padding="0px 18px 0px 0px"
        >
          <Image
            src="/homepage_imgs/mobile.png?v=2023-04-24T02:10:28.648Z"
            width="400px"
            max-width="100%"
            transition="transform 0.5s ease-in-out 0s"
            hover-transform="translateY(0px)"
            sm-width="100%"
            filter="--dropShadow"
            padding="76px 0px 76px 0px"
            lg-padding="0px 0px 32px 0px"
          />
        </Box>
        <Box
          display="flex"
          width="50%"
          flex-direction="column"
          justify-content="center"
          align-items="flex-start"
          lg-width="100%"
          lg-align-items="center"
          lg-margin="0px 0px 40px 0px"
          sm-margin="0px 0px 40px 0px"
          sm-padding="0px 0px 0px 18px"
          padding="0px 0px 0px 36px"
          md-padding="0px 0px 0px 24px"
          lg-max-width="320px"
        >
          <Text
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
            lg-margin="0px 0px 16px 0px"
            margin="0px 0px 24px 0px"
            md-margin="0px 0px 18px 0px"
          >
            Targeted practice means you'll never forget a move
          </Text>
          <Text
            color="--lightD1"
            font="--lead"
            lg-text-align="center"
            lg-width="100%"
            md-font="--leadMd"
            sm-font="--leadSm"
            lg-margin="0px 0px 0px 0px"
            margin="0px 0px 0px 0px"
            display="block"
          >
            <Span
              overflow-wrap="normal"
              word-break="normal"
              white-space="normal"
              text-indent="0"
              text-overflow="clip"
              hyphens="manual"
              user-select="auto"
              pointer-events="auto"
              display="block"
            >
              Chessbook uses{" "}
              <Strong
                overflow-wrap="normal"
                word-break="normal"
                white-space="normal"
                text-indent="0"
                text-overflow="clip"
                hyphens="manual"
                user-select="auto"
                pointer-events="auto"
              >
                spaced repetition,
              </Strong>
            </Span>
            a scientifically proven technique to memorize openings quickly and
            thoroughly.
          </Text>
          <Box
            display="flex"
            sm-flex-direction="column"
            sm-width="100%"
            sm-text-align="center"
            justify-content="flex-start"
            align-items="center"
          />
        </Box>
      </Section>
      <Section
        padding="88px 0 80px 0"
        sm-padding="60px 0 52px 0"
        inner-max-width="1000px"
        background="--sidebar"
        md-padding="68px 0 56px 0"
        lg-padding="44px 0 40px 0"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="block"
          width="100%"
          flex-direction="column"
          align-items="flex-start"
          lg-width="100%"
          lg-align-items="center"
          sm-margin="0px 0px 0px 0px"
          sm-padding="0px 0px 0px 0px"
          justify-content="center"
          lg-order="1"
          text-align="center"
          margin="0px 0px 60px 0px"
          lg-max-width="320px"
        >
          <Text
            margin="0px 0px 16px 0px"
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
          >
            Collect all your openings in one place
          </Text>
          <Text
            color="--grey"
            font="--lead"
            lg-text-align="center"
            md-font="--leadMd"
            md-margin="12px 0px 12px 0px"
            sm-font="--leadSm"
            lg-margin="0px 0px 0px 0px"
          >
            Nobody gets their whole repertoire from a single course or book.
            Chessbook lets you combine openings from multiple sources to create
            a custom repertoire just for you.
          </Text>
        </Box>
        <Box
          display="block"
          width="100%"
          justify-content="flex-end"
          lg-width="100%"
          align-items="flex-start"
          lg-margin="0px 0px 32px 0px"
          margin="0px 0px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-justify-content="center"
        >
          <Image
            src="/homepage_imgs/diagram.svg?v=2023-04-24T10:01:03.577Z"
            object-fit="cover"
            width="100%"
            height="100%"
          />
        </Box>
      </Section>
      <Section
        padding="0px 0 100px 0"
        background="url(),--sidebar"
        inner-max-width="1000px"
        lg-padding="48px 0 44px 0"
        md-padding="0px 0 80px 0"
        sm-padding="0px 0 60px 0"
        lg-background="--sidebarDarker"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="block"
          width="100%"
          flex-direction="column"
          align-items="flex-start"
          lg-width="100%"
          lg-align-items="center"
          lg-margin="0px 0px 0px 0px"
          justify-content="center"
          lg-order="1"
          text-align="center"
          margin="0px 0px 40px 0px"
          lg-max-width="320px"
        >
          <Text
            margin="0px 0px 8px 0px"
            color="--light"
            font="--headline2"
            lg-text-align="center"
            md-font="--headline2Md"
            md-margin="0px 0px 0p 0px"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
          >
            Learn middlegame plans for any opening
          </Text>
          <Text
            color="--grey"
            font="--lead"
            lg-text-align="center"
            md-font="--leadMd"
            md-margin="12px 0px 12px 0px"
            sm-font="--leadSm"
            lg-margin="12px 0px 0px 0px"
          >
            See how top players handle the positions that result from the
            openings you play.
          </Text>
        </Box>
        <Box
          display="block"
          width="100%"
          justify-content="flex-end"
          lg-width="100%"
          align-items="flex-start"
          lg-margin="0px 0px 32px 0px"
          margin="0px 0px 0px 0px"
          lg-padding="0px 0px 0px 0px"
          lg-justify-content="center"
        >
          <Image
            src="/homepage_imgs/how-to-play.png?v=2023-04-24T02:19:18.668Z"
            object-fit="cover"
            width="100%"
            height="100%"
            border-radius="16px"
            box-shadow="--xl"
            display="block"
          />
        </Box>
      </Section>
      <Section
        padding="88px 0 100px 0"
        inner-max-width="1000px"
        background="url(/homepage_imgs/pexels-cottonbro-studio.jpg?v=2023-04-25T07:11:32.398Z) 0% 0%/cover scroll,--sidebar"
        md-padding="68px 0 80px 0"
        lg-padding="44px 0 48px 0"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="flex"
          align-items="center"
          flex-direction="column"
          justify-content="center"
          margin="0px 0px 46px 0px"
          width="100%"
          sm-margin="0px 0px 30px 0px"
        >
          <Text
            color="--light"
            font="--headline2"
            text-align="center"
            md-font="--headline2Md"
            margin="0px 0px 0px 0px"
            lg-font="--headline2Sm"
            sm-font="--headline2Sm"
            lg-width="100%"
            lg-max-width="320px"
          >
            Endorsed by masters, loved by adult improvers
          </Text>
        </Box>
        <Box
          display="grid"
          grid-template-columns="repeat(3, 1fr)"
          grid-gap="24px"
          md-order="0"
          md-display="grid"
          md-grid-gap="18px"
          sm-grid-gap="12px"
          lg-grid-template-rows="repeat(3, 1fr)"
          lg-grid-template-columns="1fr"
          lg-grid-gap="16px"
        >
          <Box
            padding="48px 48px 48px 48px"
            border-width={0}
            border-style="solid"
            border-radius="16px"
            border-color="--color-grey"
            display="flex"
            flex-direction="column"
            align-items="flex-start"
            box-shadow="--xl"
            background="#ffffff"
            md-padding="24px 24px 24px 24px"
            sm-padding="16px 16px 16px 16px"
            lg-padding="24px 24px 24px 24px"
            lg-max-width="320px"
            sm-border-radius="12px"
            md-border-radius="12px"
          >
            <Text
              margin="0px 0px 35px 0px"
              color="--grey"
              font="--lead"
              sm-margin="0px 0px 30px 0px"
              flex="1 0 auto"
              md-font="--leadMd"
              lg-font="--leadMd"
            >
              “A great, free way to build your opening repertoire ... really
              smooth”
            </Text>
            <Image
              width="40px"
              height="40px"
              src="/homepage_imgs/-qKIY2uU_400x400.jpg?v=2023-04-24T07:37:29.398Z"
              border-radius="22px"
              margin="0px 15px 12px 0px"
              md-margin="0px 15px 9px 0px"
              sm-height="36px"
              sm-width="36px"
            />
            <Box
              display="flex"
              margin="0px 17px 0px 0px"
              align-items="flex-start"
              flex-direction="column"
            >
              <Box>
                <Text
                  color="--twitterBlue"
                  font="--base"
                  margin="0px 0px 2px 0px"
                  md-font="--baseMd"
                >
                  Nate Solon
                  <br />
                  FIDE Master
                </Text>
                <Text
                  color="--grey"
                  font="--base"
                  margin="0px 0px 0px 0px"
                  md-font="--baseMd"
                >
                  2422 USCF
                </Text>
              </Box>
            </Box>
          </Box>
          <Box
            padding="48px 48px 48px 48px"
            border-style="solid"
            border-radius="16px"
            border-color="--color-grey"
            display="flex"
            flex-direction="column"
            align-items="flex-start"
            box-shadow="--xl"
            border-width="0px"
            background="#ffffff"
            md-padding="24px 24px 24px 24px"
            sm-padding="16px 16px 16px 16px"
            lg-padding="24px 24px 24px 24px"
            lg-max-width="320px"
            sm-border-radius="12px"
            md-border-radius="12px"
          >
            <Text
              margin="0px 0px 35px 0px"
              color="--grey"
              font="--lead"
              sm-margin="0px 0px 30px 0px"
              flex="1 0 auto"
              md-font="--leadMd"
              lg-font="--leadMd"
            >
              “The best free chess websites? My picks: Lichess, OpeningTree,
              Chessbook”
            </Text>
            <Image
              width="40px"
              height="40px"
              src="/homepage_imgs/MEi_9zB0_400x400.jpg?v=2023-04-24T07:37:48.338Z"
              border-radius="22px"
              margin="0px 15px 12px 0px"
              md-margin="0px 15px 9px 0px"
              sm-width="36px"
              sm-height="36px"
            />
            <Box
              display="flex"
              margin="0px 17px 0px 0px"
              align-items="flex-start"
              flex-direction="column"
            >
              <Box>
                <Text
                  color="--twitterBlue"
                  font="--base"
                  margin="0px 0px 2px 0px"
                  md-font="--baseMd"
                >
                  Noël Studer
                  <br />
                  Grandmaster
                </Text>
                <Text
                  color="--grey"
                  font="--base"
                  margin="0px 0px 0px 0px"
                  md-font="--baseMd"
                >
                  2582 FIDE
                </Text>
              </Box>
            </Box>
          </Box>
          <Box
            padding="48px 48px 48px 48px"
            border-width="0px"
            border-style="solid"
            border-radius="16px"
            border-color="--color-grey"
            display="flex"
            flex-direction="column"
            align-items="flex-start"
            box-shadow="--xl"
            background="#ffffff"
            md-padding="24px 24px 24px 24px"
            sm-padding="16px 16px 16px 16px"
            lg-padding="24px 24px 24px 24px"
            lg-max-width="320px"
            sm-border-radius="12px"
            md-border-radius="12px"
          >
            <Text
              margin="0px 0px 35px 0px"
              color="--grey"
              font="--lead"
              sm-margin="0px 0px 30px 0px"
              flex="1 0 auto"
              md-font="--leadMd"
              lg-font="--leadMd"
            >
              "Absolutely amazing and unlike what anybody else has developed.
              It’s exactly what I’ve wanted since I started playing seriously."
            </Text>
            <Box
              display="flex"
              margin="0px 17px 0px 0px"
              align-items="flex-start"
              flex-direction="column"
            >
              <Box>
                <Text
                  color="--twitterBlue"
                  font="--base"
                  margin="0px 0px 2px 0px"
                  md-font="--baseMd"
                >
                  Jon Myers
                  <br />
                  Adult improver
                </Text>
                <Text
                  color="--grey"
                  font="--base"
                  margin="0px 0px 0px 0px"
                  md-font="--baseMd"
                >
                  1275 Chess.com
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Section>
      <Section
        padding="88px 0 68px 0"
        lg-padding="60px 0 60px 0"
        sm-padding="30px 0 30px 0"
        background="--sidebar"
        inner-max-width="1000px"
        md-display="none"
      >
        <Override slot="SectionContent" display="block" />
        <Box
          display="flex"
          align-items="center"
          flex-direction="column"
          justify-content="center"
          width="100%"
          sm-margin="0px 0px 30px 0px"
          margin="0px 0px 16px 0px"
        >
          <Text
            margin="0px 0px 0px 0px"
            color="--light"
            font="--headline2"
            text-align="center"
            sm-font='normal 700 42px/1.2 "Source Sans Pro", sans-serif'
          >
            The only tool made for creating a custom opening repertoire
          </Text>
        </Box>
        <Box
          margin="0px 0px 40px 0px"
          md-margin="0px 0px 40px 0px"
          lg-margin="0px 0px 32px 0px"
          display="flex"
          flex-direction="row"
          align-items="center"
          sm-margin="0px 0px 10px 0px"
          justify-content="space-between"
          lg-align-items="center"
          lg-flex-direction="column"
          lg-justify-content="center"
        />
        <Box
          width="100%"
          display="grid"
          grid-template-columns="repeat(4, 1fr)"
          grid-gap="24px"
        >
          <Box display="flex">
            <Box
              display="flex"
              margin="0px 0px 0px 0px"
              flex-wrap="wrap"
              width="100%"
              padding="110px 0px 64px 0px"
              align-items="flex-start"
              flex-direction="column"
              justify-content="flex-start"
              md-padding="92px 0px 64px 0px"
            >
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Create a custom repertoire
              </Text>
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Train with spaced repetition
              </Text>
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Find gaps automatically
              </Text>
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Avoid obscure moves
              </Text>
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Handle transpositions
              </Text>
              <Text
                color="--light"
                font="normal 300 16px/1.5 --fontFamily-googleInter"
                margin="0px 0px 0px 0px"
                md-font='normal 500 16px/1.2 "Source Sans Pro", sans-serif'
                height="68px"
              >
                Fast & modern interface
              </Text>
            </Box>
          </Box>
          <Box sm-padding="15px 4px 15px 4px">
            <Box
              display="flex"
              flex-wrap="wrap"
              width="100%"
              background="--sidebar"
              border-width="0px"
              border-style="solid"
              border-radius="16px"
              padding="32px 0px 16px 0px"
              flex-direction="column"
              align-items="center"
              box-shadow="--xl"
            >
              <Text
                color="--light"
                font="--headline3"
                margin="0px 0px 0px 0px"
                lg-text-align="center"
                lg-font='normal 600 20px/1.2 "Source Sans Pro", sans-serif'
                md-font='normal 500 12px/1.2 "Source Sans Pro", sans-serif'
                height="72px"
                lg-height="64px"
              >
                Chessbook
                <br />
              </Text>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  background="--chessbookGreen"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  background="--chessbookGreen"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  background="--chessbookGreen"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 28px 0px"
                background="--chessbookGreen"
                border-radius="100%"
                height="40px"
                md-margin="0px 0px 15px 0px"
                sm-margin="0px 0px 14px 0px"
              >
                <Icon
                  category="io"
                  icon={IoMdCheckmark}
                  flex-shrink="0"
                  width="40px"
                  height="40px"
                  border-radius="100%"
                  color="#F7FBFF"
                  margin="0px 0px 28px 0px"
                />
              </Box>
              <Box
                margin="0px 0px 0px 0px"
                background="rgba(247, 251, 255, 0.15)"
                border-radius="100%"
                height="40px"
              />
            </Box>
          </Box>
          <Box sm-padding="15px 4px 15px 4px">
            <Box sm-padding="15px 4px 15px 4px">
              <Box
                display="flex"
                flex-wrap="wrap"
                width="100%"
                border-style="solid"
                border-radius="16px"
                padding="32px 0px 16px 0px"
                flex-direction="column"
                align-items="center"
                border-width="0px"
                background="--sidebar"
                box-shadow="--xl"
              >
                <Text
                  color="--light"
                  font="--headline3"
                  margin="0px 0px 0px 0px"
                  lg-text-align="center"
                  lg-font='normal 600 20px/1.2 "Source Sans Pro", sans-serif'
                  md-font='normal 500 12px/1.2 "Source Sans Pro", sans-serif'
                  height="72px"
                  lg-height="64px"
                >
                  Lichess studies
                </Text>
                <Box
                  margin="0px 0px 28px 0px"
                  background="rgba(247, 251, 255, 0.15)"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdCheckmark}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    background="rgba(247, 251, 255, 0.15)"
                    border-radius="100%"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="rgba(247, 251, 255, 0.15)"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdCheckmark}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    background="rgba(247, 251, 255, 0.15)"
                    border-radius="100%"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                  />
                </Box>
                <Box
                  margin="0px 0px 0px 0px"
                  background="rgba(247, 251, 255, 0.15)"
                  border-radius="100%"
                  height="40px"
                />
              </Box>
            </Box>
          </Box>
          <Box sm-padding="15px 4px 15px 4px">
            <Box sm-padding="15px 4px 15px 4px">
              <Box
                display="flex"
                flex-wrap="wrap"
                width="100%"
                border-style="solid"
                border-radius="16px"
                padding="32px 0px 16px 0px"
                flex-direction="column"
                align-items="center"
                border-width="0px"
                background="--sidebar"
                box-shadow="--xl"
              >
                <Text
                  color="--light"
                  font="--headline3"
                  margin="0px 0px 0px 0px"
                  lg-text-align="center"
                  lg-font='normal 600 20px/1.2 "Source Sans Pro", sans-serif'
                  md-font='normal 500 12px/1.2 "Source Sans Pro", sans-serif'
                  height="72px"
                  lg-height="64px"
                >
                  Chessable
                </Text>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="rgba(247, 251, 255, 0.15)"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdCheckmark}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    background="rgba(247, 251, 255, 0.15)"
                    border-radius="100%"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 28px 0px"
                  background="--color-darkL1"
                  border-radius="100%"
                  height="40px"
                  md-margin="0px 0px 15px 0px"
                  sm-margin="0px 0px 14px 0px"
                >
                  <Icon
                    category="io"
                    icon={IoMdClose}
                    flex-shrink="0"
                    width="40px"
                    height="40px"
                    color="#F7FBFF"
                    margin="0px 0px 28px 0px"
                    opacity=".25"
                    size="30px"
                  />
                </Box>
                <Box
                  margin="0px 0px 0px 0px"
                  background="rgba(247, 251, 255, 0.15)"
                  border-radius="100%"
                  height="40px"
                />
              </Box>
            </Box>
          </Box>
          <Box sm-padding="15px 4px 15px 4px" />
        </Box>
      </Section>
      <Section
        padding="88px 0 100px 0"
        margin="0px 0px 0px 0px"
        inner-max-width="1000px"
        background="rgb(20, 18, 19) url(/homepage_imgs/hero%20illustration.svg?v=2023-04-25T09:19:10.485Z) 0% 0% /100% repeat scroll padding-box"
        md-padding="68px 0 80px 0"
        lg-padding="44px 0 48px 0"
      >
        <Override
          slot="SectionContent"
          flex-direction="row"
          flex-wrap="wrap"
          lg-flex-direction="column"
          lg-align-items="center"
        />
        <Box
          display="flex"
          align-items="center"
          flex-direction="column"
          justify-content="center"
          margin="0px 0px 60px 0px"
          width="100%"
          lg-padding="0px 0px 0px 0px"
          md-margin="0px 0px 45px 0px"
          lg-max-width="320px"
          lg-margin="0px 0px 24px 0px"
        >
          <Text
            margin="0px 0px 16px 0px"
            font="--headline2"
            text-align="center"
            color="--light"
            md-font="--headline2Md"
            md-margin="0px 0px 12px 0px"
            sm-font="--headline2Sm"
          >
            Get started for free, no signup required
          </Text>
          <Text
            margin="0px 0px 0px 0px"
            color="--grey"
            text-align="center"
            font="--lead"
            md-font="--leadMd"
            sm-font="--leadSm"
          >
            Create a simple repertoire in minutes with our free starter plan.
          </Text>
        </Box>
        <Box
          display="grid"
          flex-wrap="wrap"
          width="100%"
          align-items="center"
          justify-content="center"
          grid-gap="24px"
          grid-template-columns="repeat(2, 1fr)"
          md-display="grid"
          md-justify-content="normal"
          md-flex-wrap="nowrap"
          md-grid-gap="18px"
          sm-grid-gap="12px"
          lg-grid-template-rows="repeat(2, 1fr)"
          lg-grid-template-columns="1fr"
          lg-max-width="320px"
          lg-grid-gap="16px"
        >
          <Box
            display="flex"
            padding="48px 4px 48px 4px"
            border-radius="16px"
            align-items="center"
            justify-content="center"
            flex-direction="column"
            border-style="solid"
            border-color="--color-lightD2"
            border-width="0px"
            box-shadow="--xl"
            background="--color-light"
            md-flex="0 1 auto"
            md-padding="36px 4px 36px 4px"
            lg-padding="24px 4px 24px 4px"
          >
            <Text
              margin="0px 0px 24px 0px"
              font="--headline3"
              color="--dark"
              md-font="--headline3Md"
              md-margin="0px 0px 18px 0px"
              lg-margin="0px 0px 16px 0px"
            >
              Starter
            </Text>
            <Text
              margin="0px 0px 8px 0px"
              font="--headline1"
              color="--dark"
              md-font="--headline1Md"
              md-margin="0px 0px 6px 0px"
              lg-font="--headline1Sm"
              lg-margin="0px 0px 2px 0px"
            >
              Free
            </Text>
            <Text
              margin="0px 0px 32px 0px"
              color="--grey"
              text-align="center"
              font="--base"
              border-color="--color-grey"
              md-font="--baseMd"
              md-margin="0px 0px 24px 0px"
              lg-margin="0px 0px 18px 0px"
            >
              forever
            </Text>
            <Text
              margin="0px 0px 48px 0px"
              color="--grey"
              text-align="center"
              font="--base"
              border-color="--color-grey"
              md-font="--baseMd"
              md-margin="0px 0px 36px 0px"
              lg-margin="0px 0px 24px 0px"
            >
              Build a repertoire of up to 400 moves.
            </Text>
            <Link
              onClick={() => {
                props.onClick("free_get_started");
              }}
              href="#"
              text-decoration-line="initial"
              color="--dark"
              font="--headline3"
              padding="12px 24px 12px 24px"
              border-radius="8px"
              transition="background-color 0.2s ease-in-out 0s"
              hover-transition="background-color 0.2s ease-in-out 0s"
              hover-background="--color-orange"
              background="--color-orange"
              md-font="--headline3Md"
              md-padding="9px 18px 9px 18px"
            >
              Get started
            </Link>
            <Text
              margin="0px 0px 0px 0px"
              color="--grey"
              font="--small"
              padding="8px 0px 0px 0px"
              md-font="--smallMd"
              md-padding="6px 0px 0px 0px"
            >
              No signup required
            </Text>
          </Box>
          <Box
            display="flex"
            padding="48px 4px 48px 4px"
            border-radius="16px"
            align-items="center"
            justify-content="center"
            flex-direction="column"
            border-style="solid"
            position="relative"
            border-width="0px"
            box-shadow="--xl"
            background="--color-light"
            md-padding="36px 4px 36px 4px"
            lg-padding="24px 4px 24px 4px"
          >
            <Text
              margin="0px 0px 24px 0px"
              font="--headline3"
              color="--dark"
              md-font="--headline3Md"
              md-margin="0px 0px 18px 0px"
              lg-margin="0px 0px 16px 0px"
            >
              Pro
            </Text>
            <Text
              display="block"
              margin="0px 0px 8px 0px"
              font="--headline1"
              color="--dark"
              md-font="--headline1Md"
              md-margin="0px 0px 6px 0px"
              lg-font="--headline1Sm"
              lg-margin="0px 0px 2px 0px"
            >
              <Span
                font="--headline2"
                position="relative"
                bottom="16px"
                overflow-wrap="normal"
                word-break="normal"
                white-space="normal"
                text-indent="0"
                text-overflow="clip"
                hyphens="manual"
                user-select="auto"
                pointer-events="auto"
                md-font="--headline2Md"
                lg-font="--headline2Sm"
                lg-top="-10px"
                md-top="-15px"
              >
                $
              </Span>
              4
            </Text>
            <Text
              color="--grey"
              text-align="center"
              font="--base"
              border-color="--color-grey"
              display="block"
              margin="0px 0px 32px 0px"
              md-font="--baseMd"
              md-margin="0px 0px 24px 0px"
              lg-margin="0px 0px 18px 0px"
            >
              per month
            </Text>
            <Text
              margin="0px 0px 48px 0px"
              color="--grey"
              text-align="center"
              font="--base"
              border-color="--color-grey"
              md-font="--baseMd"
              md-margin="0px 0px 36px 0px"
              lg-margin="0px 0px 24px 0px"
            >
              Add unlimited moves to any depth.
            </Text>
            <Link
              onClick={() => {
                props.onClick("pro_try_it_for_free");
              }}
              text-decoration-line="initial"
              color="--dark"
              font="--headline3"
              padding="12px 24px 12px 24px"
              border-radius="8px"
              transition="background-color 0.2s ease-in-out 0s"
              hover-transition="background-color 0.2s ease-in-out 0s"
              hover-background="--color-orange"
              background="--color-orange"
              md-font="--headline3Md"
              md-padding="9px 18px 9px 18px"
            >
              Try it for free
            </Link>
            <Text
              margin="0px 0px 0px 0px"
              color="--grey"
              font="--small"
              padding="8px 0px 0px 0px"
              md-font="--smallMd"
              md-padding="6px 0px 0px 0px"
            >
              No signup required
            </Text>
          </Box>
        </Box>
      </Section>
      <Section
        padding="88px 0 68px 0"
        color="--dark"
        background="--sidebar"
        md-padding="68px 0 48px 0"
        lg-padding="44px 0 44px 0"
      >
        <Text
          as="h1"
          font="--headline2"
          margin="0 0 68px 0"
          color="--light"
          text-align="center"
          md-font="--headline2Md"
          sm-font="--headline2Sm"
          md-margin="0 0 48px 0"
          sm-margin="0 0 36px 0"
        >
          Frequently asked questions
        </Text>
        <Box
          margin="-16px -16px -16px -16px"
          display="flex"
          flex-wrap="wrap"
          flex-direction="row"
        >
          <Box
            padding="16px 16px 16px 16px"
            width="33.333%"
            md-width="50%"
            sm-width="100%"
            md-padding="16px 16px 0px 16px"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                margin="0px 0 12px 0"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
              >
                What is an "opening repertoire"?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 12px 0"
              >
                An{" "}
                <Strong
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  opening repertoire
                </Strong>{" "}
                is a set of pre-planned moves for the early part of a chess
                game. A complete repertoire will include responses to all of the
                opponent's potential moves during this phase of the game.
              </Text>
            </Box>
          </Box>
          <Box
            width="33.333%"
            padding="16px 16px 16px 16px"
            md-width="50%"
            sm-width="100%"
            md-padding="16px 16px 0p 16px"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                margin="0px 0 12px 0"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
              >
                What's the benefit of having one?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 0px 0"
              >
                Having a well constructed repertoire that fits with your style
                can be a huge advantage. It can let you steer the game toward
                positions you are comfortable in and enjoy playing, improving
                your results.
              </Text>
            </Box>
          </Box>
          <Box
            width="33.333%"
            padding="16px 16px 16px 16px"
            md-width="50%"
            sm-width="100%"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
                margin="0px 0 12px 0"
              >
                What's the difference between an "opening repertoire" and an
                "opening"?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 0px 0"
              >
                An{" "}
                <Strong
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  opening repertoire
                </Strong>{" "}
                consists of{" "}
                <Span
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  multiple
                </Span>{" "}
                <Strong
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  openings
                </Strong>{" "}
                to combat different moves by the opponent. For example an e4
                player will need to learn different openings to deal with the
                Sicilian, French, Caro-Kann etc.
              </Text>
            </Box>
          </Box>
          <Box
            padding="16px 16px 16px 16px"
            width="33.333%"
            md-width="50%"
            sm-width="100%"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                margin="0px 0 12px 0"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
              >
                What's the difference between an "opening" and a "line"?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 0px 0"
              >
                A{" "}
                <Strong
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  line
                </Strong>{" "}
                is a sequence of moves, one after another. An{" "}
                <Strong
                  overflow-wrap="normal"
                  word-break="normal"
                  white-space="normal"
                  text-indent="0"
                  text-overflow="clip"
                  hyphens="manual"
                  user-select="auto"
                  pointer-events="auto"
                >
                  opening
                </Strong>{" "}
                is made up of many lines. For example, someone who plays the
                Sicilian Dragon will need to learn many individual lines to
                master that opening.
              </Text>
            </Box>
          </Box>
          <Box
            padding="16px 16px 16px 16px"
            width="33.333%"
            md-width="50%"
            sm-width="100%"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                margin="0px 0 12px 0"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
              >
                I'm new to chess, do I need an opening repertoire?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 0px 0"
              >
                While having a solid repertoire becomes more important as you
                improve, even beginners can benefit from having a simple opening
                repertoire that prepares them for common moves at their level.
              </Text>
            </Box>
          </Box>
          <Box
            padding="16px 16px 16px 16px"
            width="33.333%"
            md-width="50%"
            sm-width="100%"
          >
            <Box display="flex" flex-direction="column">
              <Text
                as="h3"
                font="--headline3"
                margin="0px 0 12px 0"
                color="--light"
                md-font="--headline3Md"
                md-margin="0px 0 12px 0"
                sm-font="--headline3Sm"
              >
                What's involved in learning a repertoire?
              </Text>
              <Text
                as="p"
                font="--base"
                margin="12px 0"
                color="--grey"
                md-font="--baseMd"
                md-margin="0px 0 0px 0"
              >
                Learning a repertoire generally consists of choosing which
                openings and lines to play, memorising specific sequences of
                moves and understanding why those moves are played.
              </Text>
            </Box>
          </Box>
        </Box>
      </Section>
      <Section
        background-color="--dark"
        text-align="center"
        padding="100px 0 100px 0"
        background="--sidebar"
        md-padding="80px 0 80px 0"
        lg-padding="64px 0 64px 0"
      >
        <Override slot="SectionContent" display="flex" />
        <LinkBox
          href="https://discord.gg/vNzfu5VetQ"
          width="127px"
          align-self="center"
        >
          <Image
            src="/homepage_imgs/discord-logo-white.svg?v=2023-04-26T12:21:14.409Z"
            display="block"
            height="24px"
            opacity="0.5"
            md-height="18px"
          />
        </LinkBox>
        <Text
          margin="0px 0px 0px 0px"
          color="--grey"
          font="--small"
          padding="12px 0px 0px 0px"
          md-font="--smallMd"
          md-padding="9px 0px 0px 0px"
          display={"block"}
        >
          Questions? Feedback? Ideas? Join the{" "}
          <Link
            href="https://discord.gg/vNzfu5VetQ"
            color="--grey"
            hover-color="--orange"
            overflow-wrap="normal"
            word-break="normal"
            white-space="normal"
            text-indent="0"
            text-overflow="clip"
            hyphens="manual"
            user-select="auto"
            pointer-events="auto"
          >
            Chessbook Discord server
          </Link>
        </Text>
      </Section>
      <RawHtml>
        <style place={"endOfHead"} rawKey={"640ea4c14b38c40020027429"}>
          {
            ":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}"
          }
        </style>
      </RawHtml>
    </Theme>
  );
};
