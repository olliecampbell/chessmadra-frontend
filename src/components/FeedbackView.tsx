import { Spacer } from "~/components/Space";
import { isEmpty } from "lodash-es";
import { useResponsive } from "~/utils/useResponsive";
import { CMTextInput } from "./CMTextInput";
import { SidebarTemplate } from "./SidebarTemplate";
import { useUserState } from "~/utils/app_state";
import { createEffect, createSignal, Show } from "solid-js";
import { trackEvent } from "~/utils/trackEvent";
import client from "~/utils/client";
import { TextArea, TextInput } from "./TextInput";
import { createForm } from "@felte/solid";
import * as yup from "yup";
import { validator } from "@felte/validator-yup";
type Form = {
  email: string;
  feedback: string;
};

export const FeedbackView = () => {
  const responsive = useResponsive();
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
          <form ref={form} class={`col gap-4`}>
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
