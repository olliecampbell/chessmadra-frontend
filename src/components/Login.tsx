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
import { A, Link } from "solid-start";
import { quick } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { clsx } from "~/utils/classes";
import logo from "/logomark.png";
import { AuthResponse } from "~/utils/models";
import { AxiosResponse } from "axios";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login({ signup }: { signup?: boolean }) {
  const loginForm = createForm<LoginForm>({
    initialValues: { email: "", password: "" },
  });

  const [loading, setLoading] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);
  const signIn = async () => {
    if (loading()) {
      return;
    }
    setLoading(true);
    const { data } = await client.post("/api/send_auth_email", {
      email: email(),
    });
    trackEvent("login.email_sent", { email: email });
    setLoading(false);
    setSubmitted(true);
  };
  const [authType, setAuthType] = createSignal("login");
  const group = {};
  const [serverError, setServerError] = createSignal("");

  const handleSubmit: SubmitHandler<LoginForm> = (values, event) => {
    setServerError("");
    client
      .post(authType() === "register" ? "/api/register" : "/api/login", {
        email: values.email,
        password: values.password,
      })
      .then((resp: AxiosResponse<AuthResponse>) => {
        quick((s) => {
          s.userState.handleAuthResponse(resp.data);
          s.navigationState.push("/");
          trackEvent(`auth.${authType()}.success`);
        });
      })
      .catch((err) => {
        console.log("error", err);
        trackEvent(`auth.${authType()}.error`);
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
            title: "Login",
            description: "Login to Chessbook",
          }}
        />
        <div
          style={s(
            // c.bg(c.grays[80]),
            c.selfCenter
            // c.br(4)
            // c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
          )}
        >
          <Show when={!submitted()}>
            <div class="col items-center">
              <div items-center row>
                <img style={s(c.size(48))} src={logo} alt="logo" />

                <p class={`pl-3 text-center text-xl font-bold`}>Chessbook</p>
              </div>
              <Spacer height={12} />
              <div class={`row w-full gap-4`}>
                <For each={AUTH_TYPES}>
                  {(auth) => (
                    <div
                      onClick={() => {
                        setAuthType(auth);
                      }}
                      class={clsx(
                        `text-primary grow cursor-pointer border-0 border-b-2 border-solid p-4 text-center text-xl font-semibold transition-all`
                      )}
                      classList={{
                        "border-gray-80 ": authType() === auth,
                        "border-transparent &hover:border-gray-600":
                          authType() !== auth,
                      }}
                    >
                      {capitalize(auth)}
                    </div>
                  )}
                </For>
              </div>
              <div class={`bg-gray-16 min-w-80 w-full self-stretch p-4`}>
                <Show
                  when={submitted()}
                  fallback={
                    <div style={s(c.br(4), c.px(0), c.py(0))}>
                      <Form
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
                          {(field) => (
                            <TextInput
                              value={field.value}
                              error={field.error}
                              placeholder="example@email.com"
                              label="Email"
                              {...field.props}
                              type="email"
                            />
                          )}
                        </Field>
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
                          {(field) => (
                            <>
                              <TextInput
                                label="Password"
                                value={field.value}
                                error={field.error}
                                {...field.props}
                                type="password"
                              />
                              <Show when={authType() === "login"}>
                                <A
                                  href="/forgot-password"
                                  class={
                                    "text-blue-60 &hover:text-blue-70 -mt-6 text-sm"
                                  }
                                >
                                  Forgot your password?
                                </A>
                              </Show>
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
                            class="btn w-fit self-end px-8 py-4"
                          >
                            <Switch fallback={"Log in"}>
                              <Match when={loading()}>
                                <Puff color={c.primaries[65]} />
                              </Match>
                              <Match when={authType() === "register"}>
                                {"Sign up"}
                              </Match>
                            </Switch>
                          </input>
                        </div>
                      </Form>
                    </div>
                  }
                >
                  <div style={s()}>
                    <div
                      style={s(c.column, c.alignCenter, c.textAlign("center"))}
                    >
                      <div style={s()}>
                        <i
                          style={s(c.fg(c.colors.successColor), c.fontSize(28))}
                          class={`fas fa-check`}
                        ></i>
                      </div>
                      <Spacer height={12} />
                      <CMText
                        style={s(
                          c.fg(c.colors.textPrimary),
                          c.fontSize(16),
                          c.weightSemiBold
                        )}
                      >
                        Success! Check your email and click the link to log in.
                      </CMText>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </RepertoirePageLayout>
    </>
  );
}
