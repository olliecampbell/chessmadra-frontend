// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { last } from "lodash-es";
import { CMText } from "./CMText";
import { quick, useRepertoireState, useSidebarState } from "~/utils/app_state";
import {
  SidebarOnboardingImportType,
  SidebarOnboardingStage,
} from "~/utils/browsing_state";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { CMTextInput } from "./CMTextInput";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { useOutsideClick } from "./useOutsideClick";
import { SidebarTemplate } from "./SidebarTemplate";
import { Component, createEffect, createSignal, Match, Switch } from "solid-js";
import { Pressable } from "./Pressable";
import { Motion } from "@motionone/solid";
import { destructure } from "@solid-primitives/destructure";

export const SidebarOnboarding = function SidebarOnboarding() {
  const [onboardingState] = useSidebarState(([s]) => [
    s.sidebarOnboardingState,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();

  const stage = last(onboardingState().stageStack);

  return (
    <div style={s(c.column)}>
      <Switch>
        <Match when={stage === SidebarOnboardingStage.Initial}>
          <OnboardingIntro />
        </Match>
        <Match when={stage === SidebarOnboardingStage.ConnectAccount}>
          <ConnectAccountOnboarding />
        </Match>
        <Match when={stage === SidebarOnboardingStage.SetRating}>
          <SetRatingOnboarding />
        </Match>
        <Match
          when={stage === SidebarOnboardingStage.AskAboutExistingRepertoire}
        >
          <AskAboutExistingRepertoireOnboarding />
        </Match>
        <Match when={stage === SidebarOnboardingStage.ChooseImportSource}>
          <ChooseImportSourceOnboarding />
        </Match>
        <Match when={stage === SidebarOnboardingStage.Import}>
          <ImportOnboarding />
        </Match>
        <Match when={stage === SidebarOnboardingStage.TrimRepertoire}>
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
      <RepertoireEditingHeader>Welcome to Chess Madra!</RepertoireEditingHeader>
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
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
                [SidebarOnboardingStage.SetRating];
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
                s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
                  [SidebarOnboardingStage.SetRating];
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

const SetRatingOnboarding = () => {
  const responsive = useResponsive();
  const [ratingRange, setRatingRange] = createSignal("1300-1500");
  const [ratingSource, setRatingSource] = createSignal(RatingSource.Lichess);
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
        <CMText style={s()}>
          This will be used to prepare you for common lines you'll encounter at
          your level.
        </CMText>
        <Spacer height={12} />
        <div style={s(c.row, c.alignCenter)}>
          <Dropdown
            onSelect={(range) => {
              setRatingRange(range);
            }}
            choices={[
              "0-1100",
              "1100-1300",
              "1300-1500",
              "1500-1700",
              "1700-1900",
              "1900+",
            ]}
            choice={ratingRange()}
            renderChoice={(choice, inList, onPress) => {
              const textColor = c.grays[80];
              const textStyles = s(c.fg(textColor), c.fontSize(16));
              const containerStyles = s(
                c.py(12),
                inList && c.px(16),
                c.row,
                c.clickable,
                c.justifyBetween,
                c.alignCenter,
                c.width("fit-content"),
                c.minWidth(80)
              );
              const inner = (
                <CMText
                  style={s(
                    textStyles,
                    !inList && s(c.textAlign("end"), c.fullWidth)
                  )}
                >
                  {choice}
                </CMText>
              );
              return (
                <Pressable
                  style={s(containerStyles)}
                  onPress={() => {
                    onPress();
                  }}
                >
                  {inner}
                </Pressable>
              );
            }}
          ></Dropdown>
          <Spacer width={32} />
          <div style={s(c.row)}>
            <Dropdown
              onSelect={(choice) => {
                console.log("On select", choice);
                setRatingSource(choice);
              }}
              choices={[
                RatingSource.Lichess,
                RatingSource.ChessCom,
                RatingSource.FIDE,
                RatingSource.USCF,
              ]}
              choice={ratingSource()}
              renderChoice={(choice, inList, onPress) => {
                const textColor = c.grays[80];
                const textStyles = s(
                  c.fg(textColor),
                  c.fontSize(16),
                  c.weightSemiBold
                );
                const containerStyles = s(
                  c.py(12),
                  inList && c.px(16),
                  c.row,
                  c.clickable,
                  !inList && c.justifyEnd,
                  c.fullWidth,
                  c.selfEnd,
                  c.alignCenter,
                  c.width("fit-content"),
                  c.minWidth(80)
                );
                if (choice === RatingSource.Lichess) {
                  return (
                    <Pressable style={s(containerStyles)} onPress={onPress}>
                      <CMText style={s(textStyles)}>Lichess</CMText>
                      <Spacer width={8} />
                      <div style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />
                      </div>
                    </Pressable>
                  );
                } else if (choice === RatingSource.USCF) {
                  return (
                    <Pressable style={s(containerStyles)} onPress={onPress}>
                      <CMText style={s(textStyles)}>USCF</CMText>
                    </Pressable>
                  );
                } else if (choice === RatingSource.FIDE) {
                  return (
                    <Pressable style={s(containerStyles)} onPress={onPress}>
                      <CMText style={s(textStyles)}>FIDE</CMText>
                    </Pressable>
                  );
                } else if (choice === RatingSource.ChessCom) {
                  return (
                    <Pressable style={s(containerStyles)} onPress={onPress}>
                      <CMText style={s(textStyles)}>Chess.com</CMText>
                      <Spacer width={8} />
                      <div style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />

                        <img
                          src={"/chess_com_logo.png"}
                          style={s(c.size(24))}
                        />
                      </div>
                    </Pressable>
                  );
                }
              }}
            ></Dropdown>
          </div>
        </div>
      </div>
      <Spacer height={36} />
      <div style={s(c.gridColumn({ gap: 12 }))}>
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.moveSidebarState("right");
                s.userState.setRatingRange(ratingRange());
                s.userState.setRatingSystem(ratingSource());
                s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
                  [SidebarOnboardingStage.AskAboutExistingRepertoire];
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
                s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
                  [SidebarOnboardingStage.AskAboutExistingRepertoire];
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

enum RatingSource {
  Lichess = "Lichess",
  ChessCom = "Chess.com",
  USCF = "USCF",
  FIDE = "FIDE",
}

type TFake = any;
export const Dropdown: Component<{
  choice: TFake;
  choices: TFake[];
  onSelect: (_: TFake) => void;
  renderChoice: (_: TFake, inDropdown: boolean, onPress: () => void) => any;
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
    <Pressable
      ref={setRef}
      style={s(c.row, c.alignCenter, c.zIndex(10), c.relative)}
      onPress={() => {
        setIsOpen(!isOpen());
      }}
    >
      {props.renderChoice(props.choice, false, () => {
        setIsOpen(!isOpen());
      })}
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
          c.right(-20),
          c.top("calc(100% + 8px)"),
          c.bg(c.grays[10]),
          c.br(4),
          c.border(`1px solid ${c.grays[40]}`),
          c.gridColumn({ gap: 0 }),
          c.alignStretch
        )}
      >
        {props.choices.map((c) =>
          props.renderChoice(c, true, () => {
            props.onSelect(c);
            setIsOpen(false);
          })
        )}
      </Motion>
    </Pressable>
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
              s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
                [SidebarOnboardingStage.ChooseImportSource];
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
    ></SidebarTemplate>
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
  const [pgnUploadRef, setPgnUploadRef] = createSignal(
    null as HTMLInputElement | null
  );
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
  createEffect(() => {
    const input = pgnUploadRef();
    console.log("creating change watcher thing", input);
    if (input) {
      input.addEventListener("change", async (e) => {
        console.log("file upload");
        const file = input.files?.[0];
        debugger;
        console.log("file upload", file);
        if (file) {
          const body = await file.text();
          importFromPgn(body);
          return true;
        }
        e.preventDefault();
      });
    }
  });

  const { header, actions, bodyPadding } = destructure(() => {
    const bodyPadding = true;
    let header = null;
    let actions = [];
    let body = null;
    if (importType() === SidebarOnboardingImportType.PGN) {
      header = "Please upload your PGN file";
      body = (
        <div style={s(c.pt(20))}>
          <input type="file" ref={setPgnUploadRef} style={s(c.height(80))} />
        </div>
      );
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

  const importFromPgn = (pgn) => {
    setLoading("Importing");
    quick((s) => {
      const params = {} as any;
      if (activeSide() === "white") {
        params.whitePgn = pgn;
      } else {
        params.blackPgn = pgn;
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
          <div style={s(c.pt(20))}>
            <input type="file" ref={setPgnUploadRef} style={s(c.height(80))} />
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

  let actions = () => {
    let actions = [];
    [1 / 25, 1 / 100, 1 / 200].forEach((threshold) => {
      const numMoves = getNumResponsesBelowThreshold(threshold, activeSide());
      if (numMoves() > 0) {
        actions.push({
          text: `Trim lines that occur in less than 1 in ${
            1 / threshold
          } games`,
          subtext: `${numMoves()} responses`,
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
      style: "primary",
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
