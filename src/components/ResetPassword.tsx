import { Show, createSignal } from "solid-js";
import { Puff } from "solid-spinner";
import client from "~/utils/client";
import { c, s } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { TextInput } from "./TextInput";
type AuthType = "login" | "register";
const AUTH_TYPES: AuthType[] = ["login", "register"];
import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-yup";
import { useSearchParams } from "@solidjs/router";
import { AxiosResponse } from "axios";
import * as yup from "yup";
import { quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { AuthResponse } from "~/utils/models";
import { SidebarTemplate } from "./SidebarTemplate";
import { InputError } from "./forms/InputError";

type ResetPasswordForm = {
	password: string;
};

export default function ResetPassword() {
	const onSubmit = async (values: any) => {
		setServerError("");
		client
			.post("/api/reset_password", {
				password: values.password,
				id: params.id,
			})
			.then((resp: AxiosResponse<AuthResponse>) => {
				trackEvent("auth.reset_password.success");
				quick((s) => {
					s.userState.handleAuthResponse(resp.data);
					s.repertoireState.initState();
					s.repertoireState.browsingState.clearViews();
					window.history.replaceState({}, "", "/");
				});
				// todo: actually log them in
			})
			.catch((err) => {
				trackEvent("auth.reset_password.error");
				setServerError(err?.response?.data?.error ?? "Something went wrong");
			});
	};
	const { form, isSubmitting, setFields, errors, createSubmitHandler } =
		createForm<ResetPasswordForm>({
			initialValues: { password: "" },
			onSubmit,
			extend: [
				validator({
					schema: yup.object({
						password: yup.string().min(8).required().label("Password"),
					}),
				}),
			],
		});

	const [serverError, setServerError] = createSignal("");
	const [params] = useSearchParams();

	const handleSubmit = createSubmitHandler({
		onSubmit,
	});

	// createEffect(() => {
	//   console.log("errors", loginForm.internal.erro);
	// });
	return (
		<>
			<SidebarTemplate
				actions={[
					{
						onPress: handleSubmit,
						text: "Submit",
						style: "focus",
					},
				]}
				header={"Reset your password"}
			>
				<Show
					when={!isSubmitting()}
					fallback={
						<div class={"row w-full justify-center"}>
							<Puff />
						</div>
					}
				>
					<div class={clsx(isSubmitting() && "opacity-0")}>
						<div class="col items-center">
							<div class={"min-w-80 padding-sidebar w-full self-stretch"}>
								<div style={s(c.br(4), c.px(0), c.py(0))}>
									<form ref={form} class={"col gap-8"}>
										<TextInput
											placeholder="New password"
											type="password"
											name="password"
											autocomplete="new-password"
											label="New password"
											errors={errors()}
										/>
										<InputError
											name={"Server error"}
											error={serverError()}
											class={"inline-block"}
										/>
										<input type="submit" hidden />
									</form>
								</div>
							</div>
						</div>
					</div>
				</Show>
			</SidebarTemplate>
		</>
	);
}
