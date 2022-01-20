import { getInitialProps } from '@expo/next-adapter/document'
import { c } from 'app/styles'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'

class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <script
            src="https://kit.fontawesome.com/76ce5ca5af.js"
            // @ts-ignore
            crossorigin="anonymous"
          ></script>
          <script
            async
            src="https://ackee.mbuffett.com/tracker.js"
            data-ackee-server="https://ackee.mbuffett.com"
            data-ackee-domain-id="70e91043-cea0-45ab-8b7b-1d3a2297311e"
            data-ackee-opts='{ "detailed": true }'
          ></script>
        </Head>
        <body style={{ backgroundColor: c.grays[10] }}>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

Document.getInitialProps = getInitialProps

export default Document
