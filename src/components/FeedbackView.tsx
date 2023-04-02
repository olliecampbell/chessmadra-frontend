import { Spacer } from "~/components/Space";
import { isEmpty } from "lodash-es";
import { useResponsive } from "~/utils/useResponsive";
import { CMTextInput } from "./CMTextInput";
import { SidebarTemplate } from "./SidebarTemplate";
import { useUserState } from "~/utils/app_state";
import { createSignal, Show } from "solid-js";
import { trackEvent } from "~/utils/trackEvent";
import client from "~/utils/client";

export const FeedbackView = () => {
  const responsive = useResponsive();
  const user = useUserState((s) => s.user);
  const [feedback, setFeedback] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const submitFeedback = () => {
    if (isEmpty(feedback)) {
      return;
    }
    setLoading(true);
    client
      .post("/api/v1/submit-feedback", {
        feedback,
        email: user?.email ?? email ?? null,
      })
      .then(() => {
        setSuccess(true);
        setLoading(false);
      });
  };
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
      loading={loading() && "Submitting feedback..."}
      bodyPadding={true}
    >
      {/*<CMText style={s(c.sidebarDescriptionStyles(responsive))}>
        Feature request? Bug report? Etc? Let us know
      </CMText>
      <Spacer height={12} />
*/}
      <Spacer height={12} />
      <Show when={!success}>
        <>
          <Show when={isEmpty(user?.email)}>
            <>
              <CMTextInput
                value={email()}
                setValue={setEmail}
                placeholder={"Email (optional)"}
              />
              <Spacer height={8} />
            </>
          </Show>
          <CMTextInput
            value={feedback()}
            textInputProps={{ multiline: true, numberOfLines: 8 }}
            setValue={setFeedback}
            placeholder={"Your feedback here..."}
          />
        </>
      </Show>
    </SidebarTemplate>
  );
};
