import { AxiosResponse } from "axios";
import { Show, createSignal } from "solid-js";
import { quick, useRepertoireState } from "~/utils/app_state";
import client from "~/utils/client";
import { AuthResponse } from "~/utils/models";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { TextInput } from "./TextInput";
import { InputError } from "./forms/InputError";
type AuthType = "login" | "register";
import { clsx } from "~/utils/classes";
import ForgotPassword from "./ForgotPassword";
import { OnboardingComplete } from "./SidebarOnboarding";

import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-yup";
import * as yup from "yup";

type LoginForm = {
	email: string;
	password: string;
};

export const LoginSidebar = (props: { authType?: AuthType }) => {
	const onSubmit = (values: LoginForm) => {
		console.log("values,", values);
		setServerError("");
		return client
			.post(authType() === "register" ? "/api/register" : "/api/login", {
				email: values.email,
				password: values.password,
			})
			.then((resp: AxiosResponse<AuthResponse>) => {
				quick((s) => {
					s.userState.handleAuthResponse(resp.data);
					s.navigationState.push("/");

					console.log("onboarding? ", onboarding().isOnboarding);
					if (onboarding().isOnboarding) {
						trackEvent(`onboarding.${authType()}.success`);
						s.repertoireState.ui.replaceView(OnboardingComplete);
					} else {
						s.repertoireState.backToOverview();
					}
					trackEvent(`auth.${authType()}.success`);
				});
			})
			.catch((err) => {
				console.log("error", err);
				trackEvent(`auth.${authType()}.error`);
				setServerError(err?.response?.data?.error ?? "Something went wrong");
			});
	};
	const {
		form,
		data: formData,
		setFields,
		isSubmitting,
		errors,
		createSubmitHandler,
	} = createForm<LoginForm>({
		initialValues: { email: "", password: "" },
		onSubmit: onSubmit,
		extend: [
			validator({
				schema: yup.object({
					email: yup.string().email().required().label("Email"),
					password: yup.string().min(8).required().label("Password"),
				}),
			}),
		],
	});
	const handleSubmit = createSubmitHandler({
		onSubmit,
	});

	const [authType, setAuthType] = createSignal(
		props.authType ?? ("login" as AuthType),
	);
	const [serverError, setServerError] = createSignal("");
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	return (
		<>
			<SidebarTemplate
				actions={[
					{
						onPress: () => {
							handleSubmit();
						},
						text: authType() === "login" ? "Log in" : "Create account",
						style: "focus",
					},
					{
						onPress: () => {
							setAuthType(authType() === "login" ? "register" : "login");
						},
						text:
							authType() === "register"
								? "I already have an account"
								: "I don't have an account",
						style: "primary",
					},
				]}
				header={
					authType() === "login" ? "Log in" : "Create your Chessbook account"
				}
			>
				<div class={clsx(isSubmitting() && "opacity-0")}>
					<div class="col items-center">
						<div class={"min-w-80 padding-sidebar w-full self-stretch"}>
							<div style={stylex(c.br(4), c.px(0), c.py(0))}>
								<form ref={form} class={"col gap-8"}>
									<TextInput
										placeholder="example@gmail.com"
										setFields={setFields}
										type="email"
										name="email"
										label="Email"
										errors={errors()}
									/>
									<TextInput
										setFields={setFields}
										type="password"
										name="password"
										label="Password"
										autocomplete="current-password"
									/>
									<Show when={authType() === "login"}>
										<button
											type="button"
											onClick={() => {
												quick((s) => {
													s.repertoireState.ui.pushView(
														ForgotPassword,
													);
												});
											}}
											class={
												"text-tertiary &hover:text-primary -mt-6 cursor-pointer text-sm font-semibold"
											}
										>
											Forgot your password?
										</button>
									</Show>
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
			</SidebarTemplate>
		</>
	);
};
