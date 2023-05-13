// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, last } from "lodash-es";
import { CMText } from "./CMText";
import {
  getAppState,
  quick,
  useRepertoireState,
  useSidebarState,
  useUserState,
} from "~/utils/app_state";
import {
  SidebarOnboardingImportType,
  SidebarOnboardingStage,
} from "~/utils/browsing_state";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { CMTextInput } from "./CMTextInput";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { useOutsideClick } from "./useOutsideClick";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  Component,
  createEffect,
  createSignal,
  Match,
  Switch,
  For,
} from "solid-js";
import { Pressable } from "./Pressable";
import { Motion } from "@motionone/solid";
import { destructure } from "@solid-primitives/destructure";
import {
  RatingSelection,
  RatingSource,
  THRESHOLD_OPTIONS,
} from "./SidebarSettings";
import { clsx } from "~/utils/classes";
import { TextArea, TextInput } from "./TextInput";
import { Side, SIDES } from "~/utils/repertoire";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { DEFAULT_ELO_RANGE } from "~/utils/repertoire_state";
import { CoverageBar } from "./CoverageBar";
import { CoverageAndBar } from "./RepertoirtOverview";
import { Bullet } from "./Bullet";

export const OnboardingIntro = () => {
  const responsive = useResponsive();
  const bullets = [
    "Adding your first opening line",
    "Practicing it using spaced repetition",
  ];
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>
        Let's start creating your repertoire!
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <div style={s(c.column, c.px(c.getSidebarPadding(responsive)))}>
        <CMText class={"body-text"}>
          This setup process will help you get started and introduce some of the
          key ideas behind Chessbook. It should only take a few minutes to
          complete.
        </CMText>
        <div style={s(c.gridColumn({ gap: 8 }), c.pt(12))}>
          {bullets.map((bullet, i) => (
            <Bullet>{bullet}</Bullet>
          ))}
        </div>
      </div>
      <Spacer height={36} />
      <SidebarFullWidthButton
        action={{
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.pushView(SetRatingOnboarding);
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.SetRating
              );
            });
          },
          style: "primary",
          text: "Get started",
        }}
      />
    </div>
  );
};

export const ConnectAccountOnboarding = () => {
  const responsive = useResponsive();
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>
        Connect your online chess account
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <div style={s(c.column, c.px(c.getSidebarPadding(responsive)))}>
        <CMText class={"body-text"}>
          We'll use your rating to prepare you for common lines you'll encounter
          at your level. This will also let you save your repertoire. Chess.com
          integration coming soon.
        </CMText>
      </div>
      <Spacer height={36} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        {/*
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {});
            },
            style: "primary",
            text: "Connect chess.com account",
          }}
        />
      */}
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.startLichessOauthFlow();
              });
            },
            style: "primary",
            text: "Connect lichess account",
          }}
        />
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                  SidebarOnboardingStage.SetRating
                );
              });
            },
            style: "primary",
            text: "Skip this step for now",
          }}
        />
      </div>
    </div>
  );
};

// const CoverageGoalOnboarding = () => {
//   const responsive = useResponsive();
//   const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
//   return (
//     <SidebarTemplate
//       bodyPadding={true}
//       header={`Your coverage goal has been set to 1 in ${Math.round(
//         1 / threshold()
//       )} games`}
//       actions={[
//         {
//           onPress: () => {
//             quick((s) => {
//               s.repertoireState.browsingState.moveSidebarState("right");
//               s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
//                 SidebarOnboardingStage.AskAboutExistingRepertoire
//               );
//             });
//           },
//           text: "Got it!",
//           style: "primary",
//         },
//       ]}
//     >
//       <CMText style={s()} class={"text-secondary leading-5"}>
//         This would give you a solid repertoire for your rating. You can alway
//         increase this in the future.
//       </CMText>
//     </SidebarTemplate>
//   );
// };

export const SetRatingOnboarding = () => {
  const responsive = useResponsive();
  const [user] = useUserState((s) => [s.user]);
  return (
    <SidebarTemplate
      header={"What's your current rating"}
      bodyPadding={true}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              Promise.all([
                // this is dumb, but just so we get the latest elo range from the backend
                s.userState.setRatingRange(
                  s.userState.user?.ratingRange ?? DEFAULT_ELO_RANGE.join("-")
                ),
              ]).then(() => {
                quick((s) => {
                  let recommendedThreshold = getRecommendedMissThreshold(
                    s.userState.user?.eloRange ?? DEFAULT_ELO_RANGE.join("-")
                  );
                  s.userState.setTargetDepth(recommendedThreshold);
                  s.repertoireState.browsingState.pushView(
                    ChooseColorOnboarding
                  );
                });
              });
            });
          },
          style: "primary",
          text: "Set rating and continue",
        },
        {
          onPress: () => {
            quick((s) => {
              let recommendedThreshold = getRecommendedMissThreshold(
                s.userState.user?.eloRange ?? DEFAULT_ELO_RANGE.join("-")
              );
              s.userState.setTargetDepth(recommendedThreshold);
              s.repertoireState.browsingState.pushView(ChooseColorOnboarding);
            });
          },
          style: "primary",
          text: "I don't know, skip this step",
        },
      ]}
    >
      <CMText class={"body-text"}>
        This is used to determine common moves and their win rates at your
        level.
      </CMText>
      <Spacer height={24} />
      <RatingSelection />
    </SidebarTemplate>
  );
};

type TFake = any;
export const Dropdown: Component<{
  choice: TFake;
  choices: TFake[];
  title?: string;
  onSelect: (_: TFake) => void;
  renderChoice: (_: TFake, inDropdown: boolean, onPress: (e) => void) => any;
}> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [ref, setRef] = createSignal(null);

  useOutsideClick(ref, (e: MouseEvent) => {
    if (isOpen()) {
      setIsOpen(false);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  return (
    <div style={s(c.zIndex(10), c.relative)} class={"col"}>
      <p class={"text-secondary pb-2 text-sm font-bold"}>{props.title}</p>
      <div
        class={clsx(
          "bg-gray-4 row cursor-pointer items-center rounded-sm px-4"
        )}
        ref={setRef}
        onClick={() => {
          setIsOpen(!isOpen());
        }}
      >
        <div class={clsx("pointer-events-none")}>
          {props.renderChoice(props.choice, false, () => {})}
        </div>
        <Spacer width={8} />
        <i
          class="fas fa-angle-down"
          style={s(c.fontSize(18), c.fg(c.grays[80]))}
        />
        <Motion
          animate={{ opacity: isOpen() ? 1 : 0 }}
          style={s(
            c.absolute,
            c.minWidth("fit-content"),
            !isOpen() && c.noPointerEvents,
            c.zIndex(100),
            c.top("calc(100% + 8px)"),
            c.right(0),
            c.left(0),
            c.br(4),
            c.border(`1px solid ${c.grays[26]}`),
            c.overflowHidden,
            c.gridColumn({ gap: 0 }),
            c.alignStretch
          )}
          class={clsx("bg-gray-4 rounded-sm p-2")}
        >
          {props.choices.map((c) => (
            <div class={clsx("&hover:bg-gray-16 ")}>
              {props.renderChoice(c, true, (e) => {
                props.onSelect(c);
                setIsOpen(false);
                e?.preventDefault();
                e?.stopPropagation();
              })}
            </div>
          ))}
        </Motion>
      </div>
    </div>
  );
};

const ChooseColorOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="Which color would you like to start with?"
      actions={SIDES.map((side) => ({
        onPress: () => {
          quick((s) => {
            s.repertoireState.onboarding.side = side;
            s.repertoireState.browsingState.pushView(
              AskAboutExistingRepertoireOnboarding
            );
          });
        },
        text: capitalize(side),
        style: "primary",
      }))}
    ></SidebarTemplate>
  );
};

export const OnboardingComplete = () => {
  const responsive = useResponsive();
  const bullets = () => {
    const bullets = [];
    bullets.push(<>Keep adding moves to your repertoire to get to 100%</>);
    bullets.push(
      <>
        Practice your moves every day{" "}
        {!responsive.isMobile &&
          `(visit Chessbook.com on your mobile phone to practice on the go)`}
      </>
    );

    return bullets;
  };
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="Your Chessbook is ready to go!"
      actions={[
        {
          text: "Continue",
          style: "primary",
          onPress: () => {
            quick((s) => {
              s.repertoireState.backToOverview();
            });
          },
        },
      ]}
    >
      <p class={"body-text"}>
        You've made a great start towards mastering the opening!
      </p>
      <Spacer height={8} />
      <p class={"body-text"}>Recommended next steps:</p>
      <Spacer height={8} />
      <div class={"space-y-2"}>
        <For each={bullets()}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
      </div>
    </SidebarTemplate>
  );
};

export const FirstLineSavedOnboarding = () => {
  const responsive = useResponsive();
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[onboarding().side as Side],
  ]);
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="You've added your first line!"
      actions={[
        {
          onPress: () => {
            console.log("test?");
            quick((s) => {
              s.repertoireState.browsingState.pushView(PracticeIntroOnboarding);
            });
          },
          text: "Ok, got it",
          style: "primary",
        },
      ]}
    >
      <CMText class={"body-text"}>
        Your {onboarding().side} repertoire is now{" "}
        <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
          {Math.round(progressState().percentComplete)}%
        </CMText>{" "}
        complete.
      </CMText>
      <Spacer height={8} />
      <div style={s(c.height(24))}>
        <CoverageBar isInSidebar side={onboarding().side as Side} />
      </div>
      <Spacer height={16} />
      <CMText class={"body-text font-bold"}>
        How to complete your repertoire
      </CMText>
      <Spacer height={8} />
      <CMText class={"body-text"}>
        Your goal is to cover any lines which occur in at least 1 in{" "}
        {Math.round(1 / threshold())} games.
      </CMText>
      <Spacer height={8} />
      <CMText class={"body-text"}>
        This was set based on your rating, you can always change it later.
      </CMText>
    </SidebarTemplate>
  );
};

const PracticeIntroOnboarding = () => {
  const [currentLine] = useSidebarState(([s]) => [s.moveLog]);
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="Now let's see how practice works"
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.reviewState.reviewLine(
                currentLine(),
                onboarding().side
              );
            });
          },
          text: "Practice this line",
          style: "primary",
        },
      ]}
    >
      <CMText class="body-text">
        Chessbook uses spaced repetition, a scientifically proven technique to
        memorize openings quickly and thoroughly.
      </CMText>
    </SidebarTemplate>
  );
};

const AskAboutExistingRepertoireOnboarding = () => {
  const responsive = useResponsive();
  const repertoireState = getAppState().repertoireState;
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="Do you want to import an existing repertoire?"
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.pushView(
                ChooseImportSourceOnboarding
              );
            });
          },
          text: "Yes, import an existing repertoire",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.goToBuildOnboarding();
            });
          },
          text: "No, I'll start from scratch",
          style: "primary",
        },
      ]}
    >
      <CMText class="body-text">
        You can upload a PGN, or connect your Lichess account to add the
        openings you play automatically.
      </CMText>
    </SidebarTemplate>
  );
};

export const ChooseImportSourceOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      header="How do you want to import your repertoire? "
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.pushView(ImportOnboarding, {
                props: { importType: SidebarOnboardingImportType.PGN },
              });
            });
          },
          text: "From a PGN file",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.pushView(ImportOnboarding, {
                props: {
                  importType: SidebarOnboardingImportType.LichessUsername,
                },
              });
            });
          },
          text: "From my Lichess games",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.goToBuildOnboarding();
            });
          },
          text: "Nevermind, skip this for now",
          style: "primary",
        },
      ]}
    ></SidebarTemplate>
  );
};

export const ImportOnboarding = (props: {
  importType: SidebarOnboardingImportType;
}) => {
  const responsive = useResponsive();
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const side = () => activeSide() || onboarding().side;

  const importType = () => props.importType;
  const [username, setUsername] = createSignal("");
  const [loading, setLoading] = createSignal(null as string | null);
  // createEffect(() => {
  //   let dropContainer = pgnUploadRef();
  //   console.log("dropContainer", dropContainer);
  //   if (dropContainer) {
  //     dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
  //       evt.preventDefault();
  //     };
  //
  //     const onFileUpoad = async (e: any) => {};
  //     dropContainer.onchange = onFileUpoad;
  //     dropContainer.ondrop = onFileUpoad;
  //   }
  // });

  let [pgn, setPgn] = createSignal("");
  const { header, actions, bodyPadding } = destructure(() => {
    const bodyPadding = true;
    let header = null;
    let actions: SidebarAction[] = [];
    let body = null;
    if (importType() === SidebarOnboardingImportType.PGN) {
      header = `Please upload your ${side()} repertoire`;
      if (pgn()) {
        actions.push({
          text: "Submit",
          onPress: () => {
            importFromPgn();
          },
          style: "primary",
        });
      }
    }
    if (importType() === SidebarOnboardingImportType.LichessUsername) {
      header = "What's your lichess username?";
      body = (
        <div style={s(c.pt(20))}>
          <CMTextInput
            placeholder="username"
            value={username()}
            setValue={setUsername}
            style={s(c.maxWidth(200))}
          />
        </div>
      );
      actions.push({
        text: "Submit",
        onPress: () => {
          importFromLichessUsername();
        },
        style: "primary",
      });
    }
    if (loading()) {
      actions = [];
    }
    return { body, header, bodyPadding, actions };
  });

  const importFromPgn = () => {
    setLoading("Importing");
    quick((s) => {
      const params = {} as any;
      if (side() == "white") {
        params.whitePgn = pgn();
      } else {
        params.blackPgn = pgn();
      }
      s.repertoireState.initializeRepertoire({ ...params, responsive });
      trackEvent("import.from_pgns");
    });
  };

  const importFromLichessUsername = () => {
    setLoading("Importing your games");
    quick((s) => {
      trackEvent("import.from_lichess_username");
      s.repertoireState.initializeRepertoire({
        lichessUsername: username(),
        responsive,
      });
    });
  };

  return (
    <SidebarTemplate
      bodyPadding={bodyPadding()}
      header={header()}
      actions={actions()}
      loading={loading()}
    >
      <Switch>
        <Match when={importType() === SidebarOnboardingImportType.PGN}>
          <div style={s()} class={"flex flex-col space-y-8"}>
            <PGNUpload onChange={setPgn} side={"white"} />
          </div>
        </Match>
        <Match
          when={importType() === SidebarOnboardingImportType.LichessUsername}
        >
          <div style={s(c.pt(20))}>
            <CMTextInput
              placeholder="username"
              value={username()}
              setValue={setUsername}
              style={s(c.maxWidth(200))}
            />
          </div>
        </Match>
      </Switch>
    </SidebarTemplate>
  );
};

export const TrimRepertoireOnboarding = () => {
  const responsive = useResponsive();
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const side = () => activeSide() || onboarding().side;
  const [getNumResponsesBelowThreshold] = useRepertoireState((s) => [
    s.getNumResponsesBelowThreshold,
  ]);
  const header = "Do you want to trim your repertoire?";
  const body = (
    <CMText class="body-text">
      We can trim your repertoire to only the moves you're likely to see. This
      can be a good option if you have a large repertoire from other software.
    </CMText>
  );
  const [loading, setLoading] = createSignal(null as string);

  const trimToThreshold = (threshold: number) => {
    trackEvent("onboarding.trim_repertoire", { threshold });
    setLoading("Trimming");
    quick((s) => {
      s.repertoireState.trimRepertoire(threshold, [side()]);
      s.repertoireState.browsingState.finishSidebarOnboarding(responsive);
    });
  };

  const actions = () => {
    let actions: SidebarAction[] = [];
    THRESHOLD_OPTIONS.forEach((threshold) => {
      const numMoves = getNumResponsesBelowThreshold()(threshold, side());
      if (numMoves > 0) {
        actions.push({
          text: `Trim responses that occur in less than 1 in ${
            1 / threshold
          } games`,
          subtext: `${numMoves} responses will be trimmed`,
          onPress: () => {
            trimToThreshold(threshold);
          },
          style: "primary",
        });
      }
    });
    actions.push({
      text: `No thanks, I'll keep my whole repertoire`,
      onPress: () => {
        quick((s) => {
          if (onboarding().isOnboarding) {
            s.repertoireState.browsingState.goToBuildOnboarding();
          } else {
            s.repertoireState.startBrowsing(side(), "home");
          }
        });
      },
      style: "focus",
    });
    if (loading()) {
      actions = [];
    }
    return actions;
  };
  return (
    <SidebarTemplate
      bodyPadding
      header={header}
      actions={actions()}
      loading={loading()}
    >
      {body}
    </SidebarTemplate>
  );
};

const PGNUpload = (props: { onChange: (pgn: string) => void; side: Side }) => {
  const [pgn, setPgn] = createSignal("");
  const [textInputPgn, setTextInputPgn] = createSignal<string | null>("");
  const [pgnUploadRef, setPgnUploadRef] = createSignal(
    null as HTMLInputElement | null
  );
  const [hasUploaded, setHasUploaded] = createSignal(false);
  createEffect(() => {
    const input = pgnUploadRef();
    console.log("creating change watcher thing", input);
    if (input) {
      input.addEventListener("change", async (e) => {
        console.log("file upload");
        const file = input.files?.[0];
        console.log("file upload", file);
        if (file) {
          const body = await file.text();
          setPgn(body);
          setTextInputPgn(null);
          props.onChange(body);
          setHasUploaded(true);
          return true;
        }
        e.preventDefault();
      });
    }
  });
  return (
    <div style={s()}>
      <div class={"bg-gray-6 rounded-sm p-4"}>
        <div
          class={
            "border-gray-24 border-1 &hover:bg-gray-12 row relative h-20 w-full items-center justify-center rounded-sm border-dashed transition-colors"
          }
        >
          <i
            class={clsx("fas mr-2", hasUploaded() ? "fa-check" : "fa-upload")}
          ></i>
          {hasUploaded() ? "Uploaded" : "Upload"}
          <input
            type="file"
            ref={setPgnUploadRef}
            class={"absolute z-10 h-24 h-full w-full cursor-pointer opacity-0"}
          ></input>
        </div>
        <div class={"row my-4 items-center space-x-2"}>
          <div class={"bg-gray-18 h-1px grow"}></div>
          <p class={"text-secondary  ext-xs font-semibold"}>Or</p>
          <div class={"bg-gray-18 h-1px grow"}></div>
        </div>
        <TextArea
          placeholder="Paste your PGN here"
          onInput={(v) => {
            setTextInputPgn(v.target.value);
            setPgn(null);
            setHasUploaded(false);
          }}
          class=" mt-2 w-full rounded-sm border border-gray-400"
          inputClass={"bg-gray-16"}
          value={textInputPgn()}
        />
      </div>
    </div>
  );
};
