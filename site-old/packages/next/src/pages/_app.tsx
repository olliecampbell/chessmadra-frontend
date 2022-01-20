import '../styles/global.scss'
import { c } from 'app/styles'

import 'raf/polyfill'
// @ts-ignore
global.setImmediate = requestAnimationFrame
import 'setimmediate'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import Head from 'next/head'
import { AppProps } from 'next/app'

import { theme } from 'app/theme'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Chess madra</title>
        <meta
          name="description"
          content="Improve your chess visualization. 100,000+ puzzles. See moves play out on the board."
        />
        <meta property="og:title" content="Chess Madra" />
        <meta
          property="og:description"
          content="Improve your chess visualization. 100,000+ puzzles. See moves play out on the board."
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
      <SafeAreaProvider>
        <Component {...pageProps} />
      </SafeAreaProvider>
    </>
  )
}
