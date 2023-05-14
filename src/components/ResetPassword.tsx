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
type AuthType = "login" | "register";
const AUTH_TYPES: AuthType[] = ["login", "register"];
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
import { A, Link, useParams, useSearchParams } from "solid-start";
import { quick } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { AxiosResponse } from "axios";
import { AuthResponse } from "~/utils/models";

type ResetPasswordForm = {
  password: string;
};

export default function ResetPassword() {
  const [loginForm] = createForm<ResetPasswordForm>({
    initialValues: { password: "" },
  });

  const [serverError, setServerError] = createSignal("");
  const [params] = useSearchParams();

  const handleSubmit: SubmitHandler<ResetPasswordForm> = (values, event) => {
    setServerError("");
    client
      .post("/api/reset_password", { password: values.password, id: params.id })
      .then((resp: AxiosResponse<AuthResponse>) => {
        trackEvent(`auth.reset_password.success`);
        quick((s) => {
          s.userState.handleAuthResponse(resp.data);
          s.navigationState.push("/");
        });
        // todo: actually log them in
      })
      .catch((err) => {
        trackEvent(`auth.reset_password.error`);
        setServerError(err?.response?.data?.error ?? "Something went wrong");
      });
  };

  // createEffect(() => {
  //   console.log("errors", loginForm.internal.erro);
  // });
  return (
    <>
      <RepertoirePageLayout centered>
        <HeadSiteMeta
          siteMeta={{
            title: "Reset password",
            description: "",
          }}
        />
        <div style={s(c.selfCenter)}>
          <div class="col items-center">
            <div style={s(c.size(48))}>
              <PieceView piece={{ color: "w", type: "n" }} pieceSet={"alpha"} />
            </div>
            <Spacer height={12} />
            <div class={`bg-gray-16 min-w-80 w-full self-stretch p-4`}>
              <p class="text-lg font-semibold">Enter your new password</p>
              <Spacer height={12} />
              <div style={s(c.br(4), c.px(0), c.py(0))}>
                <Form
                  of={loginForm}
                  class={`col gap-8`}
                  onSubmit={handleSubmit}
                >
                  <Field
                    of={loginForm}
                    name="password"
                    validate={[
                      required("Please enter your password."),
                      minLength(
                        8,
                        "You password must have 8 characters or more."
                      ),
                    ]}
                  >
                    {(field, props) => (
                      <>
                        <TextInput
                          value={field.value}
                          error={field.error}
                          {...props}
                          type="password"
                        />
                      </>
                    )}
                  </Field>
                  <div class={"min-w-full max-w-min"}>
                    <InputError
                      name={"Server error"}
                      error={serverError()}
                      class={"inline-block"}
                    />
                    <input
                      type="submit"
                      value={"Reset password"}
                      class="btn w-fit self-end px-8 py-4"
                    ></input>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </RepertoirePageLayout>
    </>
  );
}
