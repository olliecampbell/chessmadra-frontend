import React, { useState } from "react";
import { View, TextInput } from "react-native";
import { Fragment } from "react";
import client from "~/utils/client";
import { BeatLoader } from "react-spinners";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { c, s } from "~/utils/styles";
import KnightWhiteIcon from "./chessboard/pieces/KnightWhiteIcon";
import { Spacer } from "~/components/Space";
import { Button } from "./Button";
import { CMText } from "./CMText";
import { useTrack } from "~/hooks/useTrackEvent";
import { Show } from "solid-js";

export default function Login({ signup }: { signup?: boolean }) {
  const onSubmit = (data) => console.log(data);
  // let applicationName = AppStore.useState((s) => s.meta.applicationMeta?.name);
  let [email, setEmail] = useState("");
  const track = useTrack();
  // let [password, setPassword] = useState("");
  // EmailValidator.validate("test@email.com"); // true
  // let errors: string[] = [];
  // if (!EmailValidator.validate(email)) {
  //   errors.push("Email is not valid");
  // }
  // if (password.length < 6) {
  //   errors.push("Password is too short, must be at least 6 characters");
  // }

  // let router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  let signIn = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    let { data } = await client.post("/api/send_auth_email", {
      email,
    });
    track("login.email_sent", { email: email });
    setLoading(false);
    setSubmitted(true);
  };
  return (
    <Fragment>
      <HeadSiteMeta
        siteMeta={{
          title: "Login",
          description: "Login to Chess Madra",
        }}
      />
      <PageContainer centered>
        <div
          style={s(
            // c.bg(c.grays[80]),
            c.maxWidth(300),
            c.selfCenter
            // c.br(4)
            // c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
          )}
        >
        <Show when={!submitted }>
            <div style={s(c.column, c.alignCenter, c.fullWidth)}>
              <div style={s(c.size(48))}>
                <KnightWhiteIcon />
              </div>
              <Spacer height={12} />
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(24),
                  c.selfCenter,
                  c.weightBold
                )}
              >
                Log in / Register
              </CMText>
              <Spacer height={12} />
              <CMText
                style={s(
                  c.fg(c.colors.textSecondary),
                  c.fontSize(14),
                  c.weightRegular
                  // c.textAlign("center")
                )}
              >
                Just enter your email and you'll get a link to sign you in; no
                password or sign-up needed.
              </CMText>
            </div>
            </Show>
          <Spacer height={24} />
          {submitted ? (
            <div style={s()}>
              <div style={s(c.column, c.alignCenter, c.textAlign("center"))}>
                <div style={s()}>
                  <i
                    style={s(c.fg(c.colors.successColor), c.fontSize(28))}
                    className={`fas fa-check`}
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
          ) : (
            <div style={s(c.br(4), c.px(0), c.py(0))}>
              <div style={s()}>
                <div style={s()}>
                  <div>
                    <div style={s()}>
                      <TextInput
                        // onKeyPress={onEnter(signIn)}
                        onSubmitEditing={() => {
                          signIn();
                        }}
                        placeholder="E-mail"
                        // @ts-ignore
                        type="email"
                        onChange={(e) => {
                          // @ts-ignore
                          setEmail(e.target.value);
                        }}
                        autoComplete="email"
                        required
                        style={s(
                          c.bg(c.grays[100]),
                          c.br(2),
                          c.px(8),
                          c.py(8),
                          c.fontSize(16)
                        )}
                      />
                    </div>
                  </div>

                  <Spacer height={12} />
                  <Button
                    onPress={() => {
                      signIn();
                    }}
                    style={s(c.buttons.primary)}
                  >
                    {loading ? (
                      <BeatLoader size={10} color={"white"} />
                    ) : signup ? (
                      "Sign up"
                    ) : (
                      "Log in"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </Fragment>
  );
}
