import client from "~/utils/client";
import { HeadSiteMeta } from "./PageContainer";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { Button } from "./Button";
import { CMText } from "./CMText";
import { createEffect, createSignal, For, Match, Show, Switch } from "solid-js";
import { PieceView } from "./chessboard/Chessboard";
import { trackEvent } from "~/utils/trackEvent";
import { Puff } from "solid-spinner";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { TextInput } from "./TextInput";
import { capitalize } from "lodash-es";
// import { createFormGroup, createFormControl } from "solid-forms";
import { isServer } from "solid-js/web";
import {
  createForm,
  email,
  Field,
  Form,
  minLength,
  required,
  SubmitHandler,
} from "@modular-forms/solid";
import { InputError } from "./forms/InputError";
import { A, Link } from "solid-start";
import { quick } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { clsx } from "~/utils/classes";
import { SidebarTemplate } from "./SidebarTemplate";

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPassword() {
  const [loginForm] = createForm<ForgotPasswordForm>({
    initialValues: { email: "" },
  });

  const [serverError, setServerError] = createSignal("");

  const handleSubmit: SubmitHandler<ForgotPasswordForm> = (values, event) => {
    setServerError("");
    return client
      .post("/api/forgot_password", { email: values.email })
      .then((resp) => {
        trackEvent(`auth.forgot_password.success`);
        alert("Email sent!");
      })
      .catch((err) => {
        trackEvent(`auth.forgot_password.error`);
        setServerError(err?.response?.data?.error ?? "Something went wrong");
      });
  };

  // createEffect(() => {
  //   console.log("errors", loginForm.internal.erro);
  // });
  return (
    <>
      <SidebarTemplate
        actions={[
          {
            submitsForm: "login-form",
            text: "Submit",
            style: "focus",
          },
        ]}
        header={"Forgot your password?"}
      >
        <div class={clsx(loginForm.submitting && "opacity-0")}>
          <div class="col items-center">
            <div class={`min-w-80 padding-sidebar w-full self-stretch`}>
              <div style={s(c.br(4), c.px(0), c.py(0))}>
                <Form
                  id={"login-form"}
                  of={loginForm}
                  class={`col gap-8`}
                  onSubmit={handleSubmit}
                >
                  <Field
                    of={loginForm}
                    name="email"
                    validate={[
                      required("Please enter your email."),
                      email("The email address is badly formatted."),
                    ]}
                  >
                    {(field, props) => (
                      <TextInput
                        value={field.value}
                        error={field.error}
                        placeholder="example@email.com"
                        label="Email"
                        {...props}
                        type="email"
                      />
                    )}
                  </Field>
                  <InputError
                    name={"Server error"}
                    error={serverError()}
                    class={"inline-block"}
                  />
                </Form>
              </div>
            </div>
          </div>
        </div>
      </SidebarTemplate>
    </>
  );
}
