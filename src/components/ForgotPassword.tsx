import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-yup";
import { Show, createSignal } from "solid-js";
import { Puff } from "solid-spinner";
import * as yup from "yup";
import { clsx } from "~/utils/classes";
import client from "~/utils/client";
import { c, s } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { TextInput } from "./TextInput";
import { InputError } from "./forms/InputError";

type ForgotPasswordForm = {
	email: string;
};

export default function ForgotPassword() {
	const onSubmit = async (values: ForgotPasswordForm) => {
		setServerError("");
		console.log("handle submit");
		return client
			.post("/api/forgot_password", { email: values.email })
			.then((resp) => {
				trackEvent("auth.forgot_password.success");
				alert("Email sent!");
			})
			.catch((err) => {
				trackEvent("auth.forgot_password.error");
				setServerError(err?.response?.data?.error ?? "Something went wrong");
			});
	};
	const { form, setFields, isSubmitting, errors, createSubmitHandler } =
		createForm<ForgotPasswordForm>({
			initialValues: { email: "" },
			onSubmit,
			extend: [
				validator({
					schema: yup.object({
						email: yup.string().email().required().label("Email"),
					}),
				}),
			],
		});
	const handleSubmit = createSubmitHandler({
		onSubmit,
	});

	const [serverError, setServerError] = createSignal("");

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
				header={"Forgot your password?"}
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
                  setFields={setFields}
											placeholder="example@gmail.com"
											type="email"
											name="email"
											label="Email"
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
