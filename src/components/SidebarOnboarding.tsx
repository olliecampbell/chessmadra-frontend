import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size, isNil } from "lodash-es";
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
  SidebarOnboardingStage,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import { PositionOverview, Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { SidebarActions, SidebarFullWidthButton } from "./SidebarActions";
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

export const SidebarOnboarding = React.memo(function SidebarOnboarding() {
  const [onboardingState] = useRepertoireState((s) => [
    s.browsingState.sidebarOnboardingState,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  let inner = null;
  let stage = onboardingState.stage;
  if (stage === SidebarOnboardingStage.Initial) {
    inner = <OnboardingIntro />;
  } else if (stage === SidebarOnboardingStage.ConnectAccount) {
    inner = <ConnectAccountOnboarding />;
  } else if (stage === SidebarOnboardingStage.SetRating) {
    inner = <SetRatingOnboarding />;
  }
  return <View style={s(c.column)}>{inner}</View>;
});

const OnboardingIntro = () => {
  const responsive = useResponsive();
  const bullets = [
    "Build an opening repertoire based on lines that score well at your level",
    "Focus your time & effort on the moves you’re actually likely to see",
    "Understand every move you play through community annotations",
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
              s.repertoireState.browsingState.sidebarOnboardingState.stage =
                SidebarOnboardingStage.ConnectAccount;
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
          at your level. This will also let you save your repertoire.
        </CMText>
      </View>
      <Spacer height={36} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {});
            },
            style: "primary",
            text: "Connect chess.com account",
          }}
        />
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {});
            },
            style: "primary",
            text: "Connect lichess account",
          }}
        />
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {
                s.repertoireState.browsingState.sidebarOnboardingState.stage =
                  SidebarOnboardingStage.SetRating;
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

const SetRatingOnboarding = () => {
  const responsive = useResponsive();
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
          <CMTextInput
            style={s(
              c.py(12),
              c.px(12),
              c.bg(c.grays[10]),
              c.width(80),
              c.textAlign("center"),
              c.fontSize(18),
              c.keyedProp("outline")("none"),
              c.border("none")
            )}
            value="1200"
            placeholder={"rating"}
            setValue={function (x: string): void {
              throw new Error("Function not implemented.");
            }}
          />
          <Spacer width={8} />
          <View style={s(c.row)}>
            <Dropdown
              choices={[
                RatingSource.Lichess,
                RatingSource.ChessCom,
                RatingSource.FIDE,
                RatingSource.USCF,
              ]}
              choice={RatingSource.Lichess}
              renderChoice={(choice, inList) => {
                let textColor = c.grays[80];
                let textStyles = s(c.fg(textColor), c.fontSize(16));
                let containerStyles = s(
                  c.py(12),
                  inList && c.px(16),
                  c.row,
                  c.clickable,
                  c.justifyBetween,
                  c.alignCenter,
                  c.minWidth("fit-content")
                );
                if (choice === RatingSource.Lichess) {
                  return (
                    <View style={s(containerStyles)}>
                      <CMText style={s(textStyles)}>Lichess</CMText>
                      <Spacer width={8} />
                      <View style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />
                      </View>
                    </View>
                  );
                } else if (choice === RatingSource.USCF) {
                  return (
                    <View style={s(containerStyles)}>
                      <CMText style={s(textStyles)}>USCF</CMText>
                    </View>
                  );
                } else if (choice === RatingSource.FIDE) {
                  return (
                    <View style={s(containerStyles)}>
                      <CMText style={s(textStyles)}>FIDE</CMText>
                    </View>
                  );
                } else if (choice === RatingSource.ChessCom) {
                  return (
                    <View style={s(containerStyles)}>
                      <CMText style={s(textStyles)}>Chess.com</CMText>
                      <Spacer width={8} />
                      <View style={s(c.size(20))}>
                        <LichessLogoIcon color={textColor} />

                        <img
                          src={"/chess_com_logo.png"}
                          style={s(c.size(24))}
                        />
                      </View>
                    </View>
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
              quick((s) => {});
            },
            style: "primary",
            text: "Set rating and continue",
          }}
        />
        <SidebarFullWidthButton
          action={{
            onPress: () => {
              quick((s) => {});
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
  Lichess,
  ChessCom,
  USCF,
  FIDE,
}

export const Dropdown = <T,>({
  choices,
  renderChoice,
  choice,
}: {
  choice: T;
  choices: T[];
  renderChoice: (_: T, inDropdown: boolean) => any;
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
  return (
    <Pressable
      ref={ref}
      style={s(c.row, c.alignCenter, c.noUserSelect)}
      onPress={() => {
        setIsOpen(!isOpen);
      }}
    >
      {renderChoice(choice, false)}
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
          c.right(0),
          c.top("calc(100% + 8px)"),
          c.bg(c.grays[10]),
          c.br(4),
          c.border(`1px solid ${c.grays[40]}`),
          c.gridColumn({ gap: 0 }),
          c.alignStretch
        )}
      >
        {choices.map((c) => renderChoice(c, true))}
      </Animated.View>
    </Pressable>
  );
};
