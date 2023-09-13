import { Link } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "solid-start";
import { LichessLogoIcon } from "~/components/icons/LichessLogoIcon";
import { Logo } from "~/components/icons/Logo";
import { getAppState, quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import client from "~/utils/client";
import { LICHESS_CLIENT_ID, LICHESS_REDIRECT_URI } from "~/utils/oauth";

export default () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [status, setStatus] = createSignal<"loading" | "success" | "error">(
		"loading",
	);
	const [error, setError] = createSignal<string | null>(null);
	const navigate = useNavigate();
	onMount(() => {
		const {
			code,
			state,
			error,
			error_description: errorDescription,
		} = searchParams;
		if (errorDescription === "user cancelled authorization") {
			navigate("/");
		}
		const storedState = localStorage.getItem("lichess.state");
		const storedCodeVerifier = localStorage.getItem("lichess.code_verifier");
		if (state !== storedState) {
			setStatus("error");
			setError("The stored state did not match the state from Lichess.");
		}
		if (code && storedCodeVerifier && storedState) {
			const params = new URLSearchParams();
			params.append("grant_type", "authorization_code");
			params.append("code", code);
			params.append("client_id", LICHESS_CLIENT_ID);
			params.append("code_verifier", storedCodeVerifier);
			params.append("redirect_uri", LICHESS_REDIRECT_URI);

			client
				.post("https://lichess.org/api/token", params)
				.then((resp) => {
					const token = resp.data.accessToken;
					client
						.get("https://lichess.org/api/account", {
							headers: {
								authorization: `Bearer ${token}`,
							},
						})
						.then((resp) => {
							getAppState().userState.setLichessToken(
								token,
								resp.data.username,
							);
							setStatus("success");
							quick((s) => {
								s.repertoireState.fetchLichessMistakes();
								setTimeout(() => {
									navigate("/");
								}, 1000);
							});
						})
						.catch((err) => {
							setStatus("error");
							setError("Failed to get Lichess profile");
						});
				})
				.catch((err) => {
					setStatus("error");
					setError("Failed to fetch a token from Lichess.");
				});
		}
	});

	return (
		<>
			<div class="flex flex-col center w-screen h-screen">
				<Show when={status() !== "error"}>
					<div class="flex row items-center space-x-3">
						<div class="w-12 aspect-square pt-1">
							<Logo />
						</div>
						<i class="fa-regular fa-arrow-right text-2xl" />
						<div class="w-12 aspect-square ">
							<LichessLogoIcon color="white" />
						</div>
					</div>
					<p
						class={clsx(
							"text-xl md:text-2xl font-semibold pt-6",
							status() === "loading" && "animate-pulse",
						)}
					>
						<Show when={status() === "loading"}>
							Authenticating with Lichess
						</Show>
						<Show when={status() === "success"}>Authenticated!</Show>
					</p>
				</Show>
				<Show when={status() === "error"}>
					<div class="flex col px-6 max-w-[600px]">
						<div class="flex row items-center space-x-3">
							<i class="fa-solid fa-circle-xmark text-2xl text-red-60" />
							<p class="text-xl font-semibold">Error authenticating</p>
						</div>
						<p class="body-text pt-6">
							{error()} Please try again. <br />
							You can also{"r"}
							<Link href="/" class="underline!">
								go back home
							</Link>
						</p>
					</div>
				</Show>
			</div>
		</>
	);
};
