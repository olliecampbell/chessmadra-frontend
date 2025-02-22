import { Show } from "solid-js";
import {
	Body,
	ErrorBoundary,
	Head,
	Html,
	Meta,
	Scripts,
	Style,
} from "solid-start";
import "tippy.js/animations/shift-away.css";
import "tippy.js/dist/tippy.css";

import { isServer } from "solid-js/web";
import "~/global.css";
import { App } from "./app";
import { HeadSiteMeta } from "./components/HeadSiteMeta";
import { c, stylex } from "./utils/styles";
import "virtual:uno.css";
import { APPLE_APP_ID } from "./constants";

export default function Root() {
	return (
		<Html lang="en">
			<Head>
				<meta charset="utf-8" />
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<meta
					http-equiv="Cache-Control"
					content="no-cache, no-store, must-revalidate"
				/>
				<meta http-equiv="Pragma" content="no-cache" />
				<meta name="apple-itunes-app" content={`app-id=${APPLE_APP_ID}`} />
				<meta http-equiv="Expires" content="0" />
				<meta name="theme-color" content={c.gray[8]} />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
				/>
				<HeadSiteMeta />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
					rel="stylesheet"
				/>
				<link rel="manifest" href="site_manifest.json" />

				<Meta charset="utf-8" />
				<meta content="yes" name="apple-mobile-web-app-capable" />
				<meta content="yes" name="mobile-web-app-capable" />

				<meta name="apple-mobile-web-app-status-bar-style" content="default" />

				<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
				<link
					id="apple-touch-icon"
					rel="apple-touch-icon"
					href="/apple-touch-icon.png"
				/>

				<script
					src="https://kit.fontawesome.com/b1f0634f74.js"
					crossorigin="anonymous"
				/>
			</Head>
			<Style>
				{`
    body {
      color: ${c.colors.text.primary}
    }
  `}
			</Style>

			<Body class="bg-gray-7 text-primary">
				<ErrorBoundary
					fallback={(e) => {
						console.log("error!", e);
						return null;
					}}
				>
					<Show when={!isServer} fallback={null}>
						<App />
					</Show>
				</ErrorBoundary>
				<Scripts />
			</Body>
		</Html>
	);
}
