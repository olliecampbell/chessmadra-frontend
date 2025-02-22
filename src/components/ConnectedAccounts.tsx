import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-yup";
import { noop } from "lodash-es";
import { Show } from "solid-js";
import { Puff } from "solid-spinner";
import * as yup from "yup";
import { getAppState, quick, useUserState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { SeeMoreActions, SidebarFullWidthButton } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { TextInput } from "./TextInput";
import { InputError } from "./forms/InputError";

export const ConnectAccountsSetting = () => {
	const user = () => getAppState().userState?.user;
	return (
		<SidebarTemplate
			header={"Connected accounts"}
			bodyPadding={false}
			actions={[]}
		>
			<p class="body-text mb-8 md:mb-12 padding-sidebar">
				This will let you review the opening mistakes in your online games.
			</p>
			<ConnectedAccount
				username={user()?.lichessUsername}
				platform="Lichess"
				onClick={() => {
					quick((s) => {
						s.userState.authWithLichess({ source: "setting" });
					});
				}}
				onDisconnect={() => {
					quick((s) => {
						s.userState.setLichessToken(null, null);
					});
				}}
			/>
			<div class="h-8 md:h-12" />
			<ConnectedAccount
				username={user()?.chesscomUsername}
				platform="Chess.com"
				onClick={() => {
					quick((s) => {
						s.repertoireState.ui.pushView(ConnectChesscom);
					});
				}}
				onDisconnect={() => {
					quick((s) => {
						s.userState.setChesscomUsername(null);
					});
				}}
			/>
		</SidebarTemplate>
	);
};

const ConnectedAccount = (props: {
	username?: string;
	platform: string;
	onClick: () => void;
	onDisconnect: () => void;
}) => {
	return (
		<div class="flex">
			<SidebarFullWidthButton
				action={{
					style: "secondary",
					text: props.platform,
					class: "border-t-1 border-t-border border-t-solid",
					static: !!props.username,
					onPress: !props.username ? props.onClick : noop,
					right: (
						<ConnectedAccountIconAndText
							text={props.username ?? "Connect…"}
							connected={!!props.username}
							hideIcon={!props.username}
						/>
					),
				}}
			/>
			{props.username && (
				<SeeMoreActions text="Disconnect" onClick={props.onDisconnect} />
			)}
		</div>
	);
};

export const ConnectedAccountIconAndText = (props: {
	text: string;
	connected: boolean;
	hideIcon?: boolean;
}) => {
	return (
		<div
			class={clsx(
				"flex center row text-xs",
				props.connected ? "text-primary" : "text-tertiary",
			)}
		>
			<p>{props.text}</p>
			{!props.hideIcon && (
				<i
					class={clsx(
						"ml-2",
						"fa fa-solid text-[12px]",
						props.connected ? "fa-check" : "fa-xmark",
					)}
				/>
			)}
		</div>
	);
};

type ConnectChesscomForm = {
	username: string;
};

export const ConnectChesscom = () => {
	const onSubmit = async (values: ConnectChesscomForm) => {
		console.log("submit", values);
		quick((s) => {
			s.userState.setChesscomUsername(values.username);
			s.repertoireState.needsToRefetchLichessMistakes = true;
			s.repertoireState.backToOverview();
		});
	};
	const { form, setFields, isSubmitting, errors, createSubmitHandler } =
		createForm<ConnectChesscomForm>({
			initialValues: { username: "" },
			onSubmit,
			extend: [
				validator({
					schema: yup.object({
						username: yup.string().required().label("Username"),
					}),
				}),
			],
		});
	const handleSubmit = createSubmitHandler({
		onSubmit,
	});

	return (
		<>
			<SidebarTemplate
				actions={[
					{
						onPress: handleSubmit,
						text: "Connect",
						style: "focus",
					},
				]}
				header={"What is your chess.com username?"}
				bodyPadding={true}
			>
				<Show
					when={!isSubmitting()}
					fallback={
						<div class={"row w-full justify-center"}>
							<Puff />
						</div>
					}
				>
					<div class="col items-center">
						<div class={"self-stretch"}>
							<form ref={form} class={"col gap-8"}>
								<TextInput
									setFields={setFields}
									placeholder="username"
									type="text"
									name="username"
									errors={errors()}
								/>
								<InputError
									name={"Server error"}
									error={null}
									class={"inline-block"}
								/>
								<input type="submit" hidden />
							</form>
						</div>
					</div>
				</Show>
			</SidebarTemplate>
		</>
	);
};
