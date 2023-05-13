import { AxiosResponse } from "axios";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import client from "~/utils/client";
import { AuthResponse } from "~/utils/models";
import { quick, useUserState, useRepertoireState } from "~/utils/app_state";
import {
  createForm,
  email,
  Field,
  Form,
  minLength,
  required,
  SubmitHandler,
} from "@modular-forms/solid";
import { trackEvent } from "~/utils/trackEvent";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";
import { CMText } from "./CMText";
import { Puff } from "solid-spinner";
import { InputError } from "./forms/InputError";
import { A } from "solid-start";
import { TextInput } from "./TextInput";
import { c, s } from "~/utils/styles";
import { HeadSiteMeta } from "./PageContainer";
type AuthType = "login" | "register";
import ForgotPassword from "./ForgotPassword";
import { OnboardingComplete } from "./SidebarOnboarding";
import { clsx } from "~/utils/classes";

type LoginForm = {
  email: string;
  password: string;
};

export const LoginSidebar = (props: { authType?: AuthType }) => {
  const [loginForm] = createForm<LoginForm>({
    initialValues: { email: "", password: "" },
  });

  const [authType, setAuthType] = createSignal(
    props.authType ?? ("login" as AuthType)
  );
  const [serverError, setServerError] = createSignal("");
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [ref, setRef] = createSignal<HTMLInputElement>();

  const handleSubmit: SubmitHandler<LoginForm> = (values, event) => {
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

          if (onboarding().isOnboarding) {
            trackEvent(`onboarding.${authType()}.success`);
            s.repertoireState.browsingState.replaceView(OnboardingComplete);
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

  // createEffect(() => {
  //   console.log("errors", loginForm.internal.erro);
  // });
  return (
    <>
      <SidebarTemplate
        actions={[
          {
            submitsForm: "login-form",
            text: authType() === "login" ? "Log in" : "Register",
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
        header={authType() == "login" ? "Login" : "Register"}
      >
        <HeadSiteMeta
          siteMeta={{
            title: "Login",
            description: "Login to Chessbook",
          }}
        />
        <div class={clsx(loginForm.submitting && "opacity-0")}>
          <div class="col items-center">
            <div class={`min-w-80 padding-sidebar w-full self-stretch`}>
              <div style={s(c.br(4), c.px(0), c.py(0))}>
                <Form
                  ref={setRef}
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
                          <a
                            onClick={() => {
                              quick((s) => {
                                s.repertoireState.browsingState.replaceView(
                                  ForgotPassword
                                );
                              });
                            }}
                            class={
                              "text-tertiary &hover:text-primary -mt-6 cursor-pointer text-sm font-semibold"
                            }
                          >
                            Forgot your password?
                          </a>
                        </Show>
                      </>
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
};
