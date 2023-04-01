import client from "~/utils/client";
import { HeadSiteMeta } from "./PageContainer";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { Button } from "./Button";
import { CMText } from "./CMText";
import { createSignal, Match, Show, Switch } from "solid-js";
import { PieceView } from "./chessboard/Chessboard";
import { trackEvent } from "~/utils/trackEvent";
import { Puff } from "solid-spinner";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { CMTextInput } from "./TextInput";

export default function Login({ signup }: { signup?: boolean }) {
  const [email, setEmail] = createSignal("");
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
  return (
    <>
      <HeadSiteMeta
        siteMeta={{
          title: "Login",
          description: "Login to Chess Madra",
        }}
      />
      <RepertoirePageLayout centered>
        <div
          style={s(
            // c.bg(c.grays[80]),
            c.maxWidth(300),
            c.selfCenter
            // c.br(4)
            // c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
          )}
        >
          <Show when={!submitted()}>
            <div style={s(c.column, c.alignCenter, c.fullWidth)}>
              <div style={s(c.size(48))}>
                <PieceView
                  piece={{ color: "w", type: "n" }}
                  pieceSet={"alpha"}
                />
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
          <Show
            when={submitted()}
            fallback={
              <div style={s(c.br(4), c.px(0), c.py(0))}>
                <div style={s()}>
                  <div style={s()}>
                    <div>
                      <div style={s()}>
                        <CMTextInput
                          // todo: enter to submit
                          placeholder="E-mail"
                          value={email()}
                          setValue={setEmail}
                          // @ts-ignore
                          type="email"
                          autoComplete="email"
                          required
                          style={s(
                            c.bg(c.grays[100]),
                            c.fg(c.colors.textInverse),
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
                      <Switch fallback={"Log in"}>
                        <Match when={loading()}>
                          <Puff color={c.primaries[65]} />
                        </Match>
                        <Match when={signup}>{"Sign up"}</Match>
                      </Switch>
                    </Button>
                  </div>
                </div>
              </div>
            }
          >
            <div style={s()}>
              <div style={s(c.column, c.alignCenter, c.textAlign("center"))}>
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
      </RepertoirePageLayout>
    </>
  );
}
