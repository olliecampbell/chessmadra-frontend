// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, last } from "lodash-es";
import { CMText } from "./CMText";
import {
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
import { Component, createEffect, createSignal, Match, Switch } from "solid-js";
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
import { Side } from "~/utils/repertoire";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { DEFAULT_ELO_RANGE } from "~/utils/repertoire_state";

export const SidebarOnboarding = function SidebarOnboarding() {
  const [onboardingState] = useSidebarState(([s]) => [
    s.sidebarOnboardingState,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();

  const stage = () => last(onboardingState().stageStack);

  return (
    <div style={s(c.column)}>
      <Switch>
        <Match when={stage() === SidebarOnboardingStage.Initial}>
          <OnboardingIntro />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.ConnectAccount}>
          <ConnectAccountOnboarding />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.SetRating}>
          <SetRatingOnboarding />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.CoverageGoalFyi}>
          <CoverageGoalOnboarding />
        </Match>
        <Match
          when={stage() === SidebarOnboardingStage.AskAboutExistingRepertoire}
        >
          <AskAboutExistingRepertoireOnboarding />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.ChooseImportSource}>
          <ChooseImportSourceOnboarding />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.Import}>
          <ImportOnboarding />
        </Match>
        <Match when={stage() === SidebarOnboardingStage.TrimRepertoire}>
          <TrimRepertoireOnboarding />
        </Match>
      </Switch>
    </div>
  );
};

const OnboardingIntro = () => {
  const responsive = useResponsive();
  const bullets = [
    "Build an opening repertoire based on lines that score well at your level",
    "Focus your time & effort on the moves you’re actually likely to see",
    "Understand every move you play, through community annotations",
    "Thoroughly learn your lines using next-gen spaced repetition",
  ];
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>Welcome to Chessbook!</RepertoireEditingHeader>
      <Spacer height={12} />
      <div style={s(c.column, c.px(c.getSidebarPadding(responsive)))}>
        <CMText style={s()}>This site will help you:</CMText>
        <div style={s(c.gridColumn({ gap: 8 }), c.pt(12))}>
          {bullets.map((bullet, i) => (
            <div style={s(c.row, c.alignCenter, c.pl(12))}>
              <i
                class="fas fa-circle"
                style={s(c.fg(c.grays[60]), c.fontSize(5))}
              />
              <Spacer width={8} />
              <CMText style={s()}>{bullet}</CMText>
            </div>
          ))}
        </div>
      </div>
      <Spacer height={36} />
      <SidebarFullWidthButton
        action={{
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
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

const ConnectAccountOnboarding = () => {
  const responsive = useResponsive();
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>
        Connect your online chess account
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <div style={s(c.column, c.px(c.getSidebarPadding(responsive)))}>
        <CMText style={s()}>
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

const CoverageGoalOnboarding = () => {
  const responsive = useResponsive();
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  return (
    <SidebarTemplate
      bodyPadding={true}
      header={`Your coverage goal has been set to 1 in ${Math.round(
        1 / threshold()
      )} games`}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.AskAboutExistingRepertoire
              );
            });
          },
          text: "Got it!",
          style: "primary",
        },
      ]}
    >
      <CMText style={s()} class={"text-secondary leading-5"}>
        This would give you a solid repertoire for your rating. You can alway
        increase this in the future.
      </CMText>
    </SidebarTemplate>
  );
};

const SetRatingOnboarding = () => {
  const responsive = useResponsive();
  const [user] = useUserState((s) => [s.user]);
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>
        What's your current rating?
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <div
        style={s(
          c.column,
          c.px(c.getSidebarPadding(responsive)),
          c.zIndex(2),
          c.relative
        )}
      >
        <CMText style={s()} class={"text-secondary"}>
          This will be used to prepare you for common lines you'll encounter at
          your level.
        </CMText>
        <Spacer height={12} />
        <RatingSelection />
      </div>
      <Spacer height={36} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.moveSidebarState("right");
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
                    s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                      SidebarOnboardingStage.CoverageGoalFyi
                    );
                  });
                });
              });
            },
            style: "primary",
            text: "Set rating and continue",
          }}
        />
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.moveSidebarState("right");
                s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                  SidebarOnboardingStage.AskAboutExistingRepertoire
                );
              });
            },
            style: "primary",
            text: "I don't know, skip this step",
          }}
        />
      </div>
    </div>
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
            c.bg(c.grays[10]),
            c.br(4),
            c.border(`1px solid ${c.grays[26]}`),
            c.overflowHidden,
            c.gridColumn({ gap: 0 }),
            c.alignStretch
          )}
          class={clsx("rounded-sm p-2 ")}
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

const AskAboutExistingRepertoireOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      bodyPadding={true}
      header="Do you want to import an existing repertoire?"
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.ChooseImportSource
              );
            });
          },
          text: "Yes, import an existing repertoire",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.finishSidebarOnboarding(
                responsive
              );
            });
          },
          text: "No, I'll start from scratch",
          style: "primary",
        },
      ]}
    >
      <CMText style={s()} class={"text-secondary"}>
        You'll be able to import your repertoire from a PGN file, or from your
        Lichess games.
      </CMText>
    </SidebarTemplate>
  );
};

const ChooseImportSourceOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      header="How do you want to import your repertoire? "
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.Import
              );
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.importType =
                SidebarOnboardingImportType.PGN;
            });
          },
          text: "From a PGN file",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.Import
              );
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.importType =
                SidebarOnboardingImportType.LichessUsername;
            });
          },
          text: "From my Lichess games",
          style: "primary",
        },
        // {
        //   onPress: () => {
        //     quick((s) => {
        //       s.repertoireState.browsingState.moveSidebarState("right");
        //       s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack.push(
        //         SidebarOnboardingStage.Import
        //       );
        //       s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.importType =
        //         SidebarOnboardingImportType.PlayerTemplates;
        //     });
        //   },
        //   text: "Copy a popular streamer",
        //   style: "primary",
        // },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.moveSidebarState("right");
              s.repertoireState.browsingState.finishSidebarOnboarding(
                responsive
              );
            });
          },
          text: "Nevermind, skip this for now",
          style: "primary",
        },
      ]}
    ></SidebarTemplate>
  );
};

const ImportOnboarding = () => {
  const responsive = useResponsive();
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [importType] = useRepertoireState((s) => [
    s.browsingState.sidebarState.sidebarOnboardingState.importType,
  ]);
  createEffect(() => {
    quick((s) => {
      s.repertoireState.fetchRepertoireTemplates();
      s.repertoireState.fetchPlayerTemplates();
    });
  }, []);
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

  let [whitePgn, setWhitePgn] = createSignal("");
  let [blackPgn, setBlackPgn] = createSignal("");
  const { header, actions, bodyPadding } = destructure(() => {
    const bodyPadding = true;
    let header = null;
    let actions: SidebarAction[] = [];
    let body = null;
    if (importType() === SidebarOnboardingImportType.PGN) {
      header = "Please upload your PGN files";
      if (blackPgn() || whitePgn()) {
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
      params.whitePgn = whitePgn();
      params.blackPgn = blackPgn();
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
          <div style={s(c.pt(20))} class={"flex flex-col space-y-8"}>
            <PGNUpload onChange={setWhitePgn} side={"white"} />
            <PGNUpload onChange={setBlackPgn} side={"black"} />
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

const TrimRepertoireOnboarding = () => {
  const responsive = useResponsive();
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [getNumResponsesBelowThreshold] = useRepertoireState((s) => [
    s.getNumResponsesBelowThreshold,
  ]);
  const header = "Do you want to trim your repertoire?";
  const body = (
    <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
      We can trim your repertoire to only the moves you're likely to see. This
      can be a good option if you have a large repertoire from other software.
    </CMText>
  );
  const [loading, setLoading] = createSignal(null as string);

  const trimToThreshold = (threshold: number) => {
    trackEvent("onboarding.trim_repertoire", { threshold });
    setLoading("Trimming");
    quick((s) => {
      s.repertoireState.trimRepertoire(threshold, [activeSide]);
      s.repertoireState.browsingState.finishSidebarOnboarding(responsive);
    });
  };

  const actions = () => {
    let actions = [];
    THRESHOLD_OPTIONS.forEach((threshold) => {
      const numMoves = getNumResponsesBelowThreshold()(threshold, activeSide());
      if (numMoves > 0) {
        actions.push({
          text: `Trim responses that occur in less than 1 in ${
            1 / threshold
          } games`,
          subtext: `${numMoves} responses`,
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
          s.repertoireState.browsingState.finishSidebarOnboarding(responsive);
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
      <p class={"text-secondary font-semibold"}>
        {capitalize(props.side)} repertoire
      </p>

      <div class={"bg-gray-6 mt-4 rounded-sm p-4"}>
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
