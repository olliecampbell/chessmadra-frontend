import { getInitialProps } from "@expo/next-adapter/document";
import Document, { Head, Main, NextScript } from "next/document";
import React from "react";
import { c } from "app/styles";
import { HeadSiteMeta } from "app/components/PageContainer";

class CustomDocument extends Document {
  render() {
    return (
      <html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,75..125,100..900&display=swap"
            rel="stylesheet"
          />
          <style>
            {`

a:link { text-decoration: none; }

a:visited { text-decoration: none; }

a:hover { text-decoration: none; }

a:active { text-decoration: none; }
              input:focus {
                outline: none;
                border: none;
              }
              a { color: unset; }

        `}
          </style>
          <meta charSet="UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <script
            src="https://kit.fontawesome.com/b1f0634f74.js"
            // @ts-ignore
            crossorigin="anonymous"
          ></script>
          <script
            async
            src="https://ackee.mbuffett.com/tracker.js"
            data-ackee-server="https://ackee.mbuffett.com"
            data-ackee-domain-id="122ae037-d7f5-40d7-9c36-5a6cc8f540a2"
            data-ackee-opts='{ "detailed": true }'
          ></script>
          <HeadSiteMeta
            siteMeta={{
              title: "Chess Madra",
              description:
                "Build your opening repertoire, improve your visualization, train your tactics, and more.",
            }}
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="theme-color" content={c.grays[10]} />
          <meta
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
            name="viewport"
          />
        </Head>
        <body style={{ backgroundColor: c.grays[8], lineHeight: 1.5 }}>
          <div className="" />
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

// Import the getInitialProps method and assign it to your component to ensure the react-native-web styles are used.
CustomDocument.getInitialProps = getInitialProps;

export default CustomDocument;
