import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  take,
  sortBy,
  size,
  isNil,
  capitalize,
  last,
} from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  otherSide,
  RepertoireMiss,
  Side,
} from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import {
  getAppropriateEcoName,
  getNameEcoCodeIdentifier,
} from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";
import { quick, useDebugState, useRepertoireState } from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
  SidebarOnboardingImportType,
  SidebarOnboardingStage,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
} from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import {
  formatWinPercentage,
  getWinRate,
} from "app/utils/results_distribution";
import {
  getSidebarPadding,
  VERTICAL_BREAKPOINT,
} from "./RepertoireBrowsingView";
import { CoverageBar } from "./CoverageBar";
import { DeleteLineView } from "./DeleteLineView";
import { CMTextInput } from "./TextInput";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { useOutsideClick } from "./useOutsideClick";
import { DragAndDropInput } from "./DragAndDropInput";
import { BeatLoader, GridLoader } from "react-spinners";
import { PlayerTemplate } from "app/models";
import { PlayerTemplates } from "./PlayerTemplates";

export const SidebarOnboarding = React.memo(function SidebarOnboarding() {
  const [onboardingState] = useRepertoireState((s) => [
    s.browsingState.sidebarOnboardingState,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  let inner = null;
  let stage = last(onboardingState.stageStack);
  if (stage === SidebarOnboardingStage.Initial) {
    inner = <OnboardingIntro />;
  } else if (stage === SidebarOnboardingStage.ConnectAccount) {
    inner = <ConnectAccountOnboarding />;
  } else if (stage === SidebarOnboardingStage.SetRating) {
    inner = <SetRatingOnboarding />;
  } else if (stage === SidebarOnboardingStage.AskAboutExistingRepertoire) {
    inner = <AskAboutExistingRepertoireOnboarding />;
  } else if (stage === SidebarOnboardingStage.ChooseImportSource) {
    inner = <ChooseImportSourceOnboarding />;
  } else if (stage === SidebarOnboardingStage.Import) {
    inner = <ImportOnboarding />;
  }
  return <View style={s(c.column)}>{inner}</View>;
});

const OnboardingIntro = () => {
  const responsive = useResponsive();
  const bullets = [
    "Build an opening repertoire based on lines that score well at your level",
    "Focus your time & effort on the moves you’re actually likely to see",
    "Understand every move you play, through community annotations",
    "Thoroughly learn your lines using next-gen spaced repetition",
  ];
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>Welcome to Chess Madra!</RepertoireEditingHeader>
      <Spacer height={12} />
      <View style={s(c.column, c.px(getSidebarPadding(responsive)))}>
        <CMText style={s()}>This site will help you:</CMText>
        <View style={s(c.gridColumn({ gap: 8 }), c.pt(12))}>
          {bullets.map((bullet) => (
            <View style={s(c.row, c.alignCenter, c.pl(12))}>
              <i
                className="fas fa-circle"
                style={s(c.fg(c.grays[60]), c.fontSize(5))}
              />
              <Spacer width={8} />
              <CMText style={s()}>{bullet}</CMText>
            </View>
          ))}
        </View>
      </View>
      <Spacer height={36} />
      <SidebarFullWidthButton
        action={{
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
                [SidebarOnboardingStage.SetRating];
            });
          },
          style: "primary",
          text: "Get started",
        }}
      />
    </View>
  );
};

const ConnectAccountOnboarding = () => {
  const responsive = useResponsive();
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>
        Connect your online chess account
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <View style={s(c.column, c.px(getSidebarPadding(responsive)))}>
        <CMText style={s()}>
          We'll use your rating to prepare you for common lines you'll encounter
          at your level. This will also let you save your repertoire. Chess.com
          integration coming soon.
        </CMText>
      </View>
      <Spacer height={36} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
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
                s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
                  [SidebarOnboardingStage.SetRating];
              });
            },
            style: "primary",
            text: "Skip this step for now",
          }}
        />
      </View>
    </View>
  );
};

const SidebarOnboardingTemplate = ({
  header,
  children,
  bodyPadding,
  actions,
}: {
  header: string;
  children?: any;
  bodyPadding: boolean;
  actions: SidebarAction[];
}) => {
  const responsive = useResponsive();
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>{header}</RepertoireEditingHeader>
      <Spacer height={12} />
      <View
        style={s(
          c.column,
          bodyPadding && c.px(getSidebarPadding(responsive)),
          c.zIndex(2),
          c.relative
        )}
      >
        {children}
      </View>
      <Spacer height={36} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        {actions.map((action, i) => {
          return <SidebarFullWidthButton key={i} action={action} />;
        })}
      </View>
    </View>
  );
};

const SetRatingOnboarding = () => {
  const responsive = useResponsive();
  const [ratingRange, setRatingRange] = useState("1300-1500");
  const [ratingSource, setRatingSource] = useState(RatingSource.Lichess);
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>
        What's your current rating?
      </RepertoireEditingHeader>
      <Spacer height={12} />
      <View
        style={s(
          c.column,
          c.px(getSidebarPadding(responsive)),
          c.zIndex(2),
          c.relative
        )}
      >
        <CMText style={s()}>
          This will be used to prepare you for common lines you'll encounter at
          your level.
        </CMText>
        <Spacer height={12} />
        <View style={s(c.row, c.alignCenter)}>
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
            choice={ratingRange}
            renderChoice={(choice, inList, onPress) => {
              let textColor = c.grays[80];
              let textStyles = s(c.fg(textColor), c.fontSize(16));
              let containerStyles = s(
                c.py(12),
                inList && c.px(16),
                c.row,
                c.clickable,
                c.justifyBetween,
                c.alignCenter,
                c.width("fit-content"),
                c.minWidth(80)
              );
              let inner = (
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
          <View style={s(c.row)}>
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
              choice={ratingSource}
              renderChoice={(choice, inList, onPress) => {
                let textColor = c.grays[80];
                let textStyles = s(
                  c.fg(textColor),
                  c.fontSize(16),
                  c.weightSemiBold
                );
                let containerStyles = s(
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
                      <View style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />
                      </View>
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
                      <View style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />

                        <img
                          src={"/chess_com_logo.png"}
                          style={s(c.size(24))}
                        />
                      </View>
                    </Pressable>
                  );
                }
              }}
            ></Dropdown>
          </View>
        </View>
      </View>
      <Spacer height={36} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.userState.setRatingRange(ratingRange);
                s.userState.setRatingSystem(ratingSource);
                s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
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
                s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
                  [SidebarOnboardingStage.AskAboutExistingRepertoire];
              });
            },
            style: "primary",
            text: "I don't know, skip this step",
          }}
        />
      </View>
    </View>
  );
};

enum RatingSource {
  Lichess = "Lichess",
  ChessCom = "Chess.com",
  USCF = "USCF",
  FIDE = "FIDE",
}

export const Dropdown = <T,>({
  choices,
  renderChoice,
  onSelect,
  choice,
}: {
  choice: T;
  choices: T[];
  onSelect: (_: T) => void;
  renderChoice: (_: T, inDropdown: boolean, onPress: () => void) => any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);
  useOutsideClick(ref, (e) => {
    if (isOpen) {
      setIsOpen(false);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  console.log("Choice is", choice);
  return (
    <Pressable
      ref={ref}
      style={s(c.row, c.alignCenter, c.zIndex(10))}
      onPress={() => {
        console.log("toggle");
        setIsOpen(!isOpen);
      }}
    >
      {renderChoice(choice, false, () => {
        setIsOpen(!isOpen);
      })}
      <Spacer width={8} />
      <i
        className="fas fa-angle-down"
        style={s(c.fontSize(18), c.fg(c.grays[80]))}
      />
      <Animated.View
        style={s(
          c.absolute,
          c.minWidth("fit-content"),
          c.opacity(fadeAnim),
          !isOpen && c.noPointerEvents,
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
        {choices.map((c) =>
          renderChoice(c, true, () => {
            onSelect(c);
            setIsOpen(false);
          })
        )}
      </Animated.View>
    </Pressable>
  );
};

const AskAboutExistingRepertoireOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarOnboardingTemplate
      bodyPadding={true}
      header="Do you want to import an existing repertoire?"
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
                [SidebarOnboardingStage.ChooseImportSource];
            });
          },
          text: "Yes, import an existing repertoire",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.finishSidebarOnboarding();
            });
          },
          text: "No, I'll start from scratch",
          style: "primary",
        },
      ]}
    ></SidebarOnboardingTemplate>
  );
};

const ChooseImportSourceOnboarding = () => {
  const responsive = useResponsive();
  return (
    <SidebarOnboardingTemplate
      header="How do you want to import your repertoire? "
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.Import
              );
              s.repertoireState.browsingState.sidebarOnboardingState.importType =
                SidebarOnboardingImportType.PGN;
            });
          },
          text: "From a PGN file",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.Import
              );
              s.repertoireState.browsingState.sidebarOnboardingState.importType =
                SidebarOnboardingImportType.LichessUsername;
            });
          },
          text: "From my Lichess games",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.sidebarOnboardingState.stageStack.push(
                SidebarOnboardingStage.Import
              );
              s.repertoireState.browsingState.sidebarOnboardingState.importType =
                SidebarOnboardingImportType.PlayerTemplates;
            });
          },
          text: "Copy a popular streamer",
          style: "primary",
        },
        {
          onPress: () => {
            quick((s) => {
              s.repertoireState.browsingState.finishSidebarOnboarding();
            });
          },
          text: "Nevermind, skip this for now",
          style: "primary",
        },
      ]}
    ></SidebarOnboardingTemplate>
  );
};

const ImportOnboarding = () => {
  const responsive = useResponsive();
  let [importType, activeSide] = useRepertoireState((s) => [
    s.browsingState.sidebarOnboardingState.importType,
    s.browsingState.activeSide,
  ]);
  useEffect(() => {
    quick((s) => {
      s.repertoireState.fetchRepertoireTemplates();
      s.repertoireState.fetchPlayerTemplates();
    });
  }, []);
  const [username, setUsername] = useState("");
  let header = null;
  let actions = [];
  let body = null;
  const [loading, setLoading] = useState(null as string);

  const importFromPgn = (pgn) => {
    setLoading("Importing");
    quick((s) => {
      let params = {} as any;
      if (activeSide === "white") {
        params.whitePgn = pgn;
      } else {
        params.blackPgn = pgn;
      }
      s.repertoireState.initializeRepertoire(params);
      trackEvent("import.from_pgns");
    });
  };

  const importFromLichessUsername = () => {
    setLoading("Importing your games");
    quick((s) => {
      trackEvent("import.from_lichess_username");
      s.repertoireState.initializeRepertoire({ lichessUsername: username });
    });
  };

  let bodyPadding = true;
  if (importType === SidebarOnboardingImportType.PGN) {
    header = "Please upload your PGN file";
    body = (
      <View style={s(c.pt(20))}>
        <DragAndDropInput
          style={s(c.height(80))}
          humanName={`Tap to select your ${capitalize(
            activeSide
          )} repertoire file`}
          accept="*.pgn"
          onUpload={async (e) => {
            let file = e.target.files[0];
            if (file) {
              let body = await file.text();
              importFromPgn(body);
              return true;
            }
          }}
        />
      </View>
    );
  }
  if (importType === SidebarOnboardingImportType.LichessUsername) {
    header = "What's your lichess username?";
    body = (
      <View style={s(c.pt(20))}>
        <CMTextInput
          placeholder="username"
          value={username}
          setValue={setUsername}
          style={s(c.maxWidth(200))}
        />
      </View>
    );
    actions.push({
      text: "Submit",
      onPress: () => {
        importFromLichessUsername();
      },
      style: "primary",
    });
  }
  if (importType === SidebarOnboardingImportType.PlayerTemplates) {
    header = "Which player's repertoire would you like to copy?";
    bodyPadding = false;
    body = (
      <View style={s(c.pt(20))}>
        <PlayerTemplates
          onPress={(template: PlayerTemplate) => {
            setLoading("Copying repertoire");
            quick((s) => {
              s.repertoireState.usePlayerTemplate(template.id);
              trackEvent("import.from_player_template", {
                player_template_id: template.id,
              });
            });
          }}
        />
      </View>
    );
  }
  if (loading) {
    actions = [];
  }
  return (
    <SidebarOnboardingTemplate
      bodyPadding={bodyPadding}
      header={header}
      actions={actions}
    >
      {loading ? (
        <View style={s(c.selfCenter, c.pt(48), c.center)}>
          <CMText
            style={s(c.fontSize(14), c.weightSemiBold, c.fg(c.grays[75]))}
          >
            {loading}
          </CMText>
          <Spacer height={8} />
          <BeatLoader color={c.grays[80]} size={24} />
        </View>
      ) : (
        body
      )}
    </SidebarOnboardingTemplate>
  );
};
