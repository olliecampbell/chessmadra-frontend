import React, { useState } from "react";
import { Spacer } from "app/Space";
import { isEmpty } from "lodash-es";
import { useResponsive } from "app/utils/useResponsive";
import { CMTextInput } from "./TextInput";
import { SidebarTemplate } from "./SidebarTemplate";
import client from "app/client";
import { useUserState } from "app/utils/app_state";

export const FeedbackView = () => {
  const responsive = useResponsive();
  const user = useUserState((s) => s.user);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
        success
          ? "We got it! Thanks!"
          : "Feature request? Bug report? Let us know"
      }
      actions={
        success || loading
          ? []
          : [
              {
                onPress: () => {
                  submitFeedback();
                },
                style: "primary",
                text: "Submit",
              },
            ]
      }
      loading={loading && "Submitting feedback..."}
      bodyPadding={true}
    >
      {/*<CMText style={s(c.sidebarDescriptionStyles(responsive))}>
        Feature request? Bug report? Etc? Let us know
      </CMText>
      <Spacer height={12} />
*/}
      <Spacer height={12} />
      {!success && (
        <>
          {isEmpty(user?.email) && (
            <>
              <CMTextInput
                value={email}
                setValue={setEmail}
                placeholder={"Email (optional)"}
              />
              <Spacer height={8} />
            </>
          )}
          <CMTextInput
            value={feedback}
            textInputProps={{ multiline: true, numberOfLines: 8 }}
            setValue={setFeedback}
            placeholder={"Your feedback here..."}
          />
        </>
      )}
    </SidebarTemplate>
  );
};
