import React, { useState } from "react";
import { signupUser } from "app/utils/auth";
import { useRouter } from "next/router";
import { View, TextInput, Text } from "react-native";

import { AppStore } from "app/store";
import { Fragment } from "react";
import Link from "next/link";
import client from "app/client";
import { onEnter } from "app/utils/onEnter";
import { BeatLoader } from "react-spinners";
import axios from "axios";
import { useForm } from "react-hook-form";
import { PageContainer } from "./PageContainer";
import { c, s } from "app/styles";
import KnightWhiteIcon from "./chessboard/pieces/KnightWhiteIcon";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { CMText } from "./CMText";
import { CMTextInput } from "./TextInput";

export default function Login({ signup }: { signup?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => console.log(data);
  console.log(errors);
  // let applicationName = AppStore.useState((s) => s.meta.applicationMeta?.name);
  let [email, setEmail] = useState("");
  // let [password, setPassword] = useState("");
  // EmailValidator.validate("test@email.com"); // true
  // let errors: string[] = [];
  // if (!EmailValidator.validate(email)) {
  //   errors.push("Email is not valid");
  // }
  // if (password.length < 6) {
  //   errors.push("Password is too short, must be at least 6 characters");
  // }

  let router = useRouter();
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
    setLoading(false);
    setSubmitted(true);
  };
  return (
    <Fragment>
      <PageContainer centered>
        <View
          style={s(
            // c.bg(c.grays[80]),
            c.maxWidth(300),
            c.selfCenter
            // c.br(4)
            // c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
          )}
        >
          {!submitted && (
            <View style={s(c.column, c.alignCenter, c.fullWidth)}>
              <View style={s(c.size(48))}>
                <KnightWhiteIcon />
              </View>
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
            </View>
          )}
          <Spacer height={24} />
          {submitted ? (
            <View style={s()}>
              <View style={s(c.column, c.alignCenter, c.textAlign("center"))}>
                <View style={s()}>
                  <i
                    style={s(c.fg(c.colors.successColor), c.fontSize(28))}
                    className={`fas fa-check`}
                  ></i>
                </View>
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
              </View>
            </View>
          ) : (
            <View style={s(c.br(4), c.px(0), c.py(0))}>
              <View style={s()}>
                <View style={s()}>
                  <View>
                    <View style={s()}>
                      <TextInput
                        onKeyDown={onEnter(signIn)}
                        onSubmitEditing={() => {
                          signIn();
                        }}
                        placeholder="E-mail"
                        id="email"
                        name="email"
                        type="email"
                        onChange={(e) => {
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
                    </View>
                  </View>

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
                </View>
              </View>
            </View>
          )}
        </View>
      </PageContainer>
    </Fragment>
  );
}
