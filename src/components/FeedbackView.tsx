import { createForm } from "@felte/solid";
import { isEmpty } from "lodash-es";
import { Show, createEffect, createSignal } from "solid-js";
import { Spacer } from "~/components/Space";
import { useUserState } from "~/utils/app_state";
import client from "~/utils/client";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { TextArea, TextInput } from "./TextInput";
type Form = {
	email: string;
	feedback: string;
};

export const FeedbackView = () => {
	const [user] = useUserState((s) => [s.user]);
	const [loading, setLoading] = createSignal(false);
	const [success, setSuccess] = createSignal(false);
	const feedback = () => data().feedback;
	const email = () => data().email;
	const submitFeedback = () => {
		if (isEmpty(feedback())) {
			return;
		}
		setLoading(true);
		client
			.post("/api/v1/submit-feedback", {
				feedback: feedback(),
				email: user()?.email ?? email() ?? null,
			})
			.then(() => {
				setSuccess(true);
				setLoading(false);
			});
	};
	const { form, data } = createForm<Form>({
		initialValues: { email: user()?.email },
	});
	createEffect(() => {
		console.log("loading", loading());
	});
	return (
		<SidebarTemplate
			header={
				success()
					? "We got it! Thanks!"
					: "Feature request? Bug report? Let us know"
			}
			actions={
				success() || loading()
					? []
					: [
							{
								onPress: () => {
									trackEvent("give_feedback.sent");
									submitFeedback();
								},
								style: "primary",
								text: "Submit",
							},
					  ]
			}
			loading={loading()}
			bodyPadding={true}
		>
			<Spacer height={12} />
			<Show when={!success()}>
				<>
					<form ref={form} class={"col gap-4"}>
						<Show when={isEmpty(user()?.email)}>
							<TextInput name="email" placeholder={"Email (optional)"} />
						</Show>
						<TextArea name="feedback" placeholder={"Your feedback here..."} />
					</form>
				</>
			</Show>
		</SidebarTemplate>
	);
};
