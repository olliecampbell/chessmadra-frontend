// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  capitalize,
  upperFirst,
  find,
  isEmpty,
  filter,
  noop,
  isNil,
} from "lodash-es";
import { SIDES } from "~/utils/repertoire";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  quick,
  getAppState,
  useBrowsingState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { START_EPD } from "~/utils/chess";
import { ReviewText } from "./ReviewText";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  SeeMoreActions,
  SidebarAction,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { bySide } from "~/utils/repertoire";
import {
  BetaFeaturesSettings,
  CoverageSettings,
  FrontendSettingView,
  RatingSettings,
  ThemeSettings,
} from "./SidebarSettings";
import { combinedThemes, COMBINED_THEMES_BY_ID } from "~/utils/theming";
import { Accessor, createSignal, For, Show } from "solid-js";
import { FeedbackView } from "./FeedbackView";
import client from "~/utils/client";
import { UpgradeSubscriptionView } from "./UpgradeSubscriptionView";
import { PreReview } from "./PreReview";
import { LOTS_DUE_MINIMUM } from "~/utils/review";
import { LichessMistake } from "~/utils/models";
import { isDevelopment } from "~/utils/env";
import { clsx } from "~/utils/classes";
import { Puff } from "solid-spinner";
import { LoadingSpinner } from "./LoadingSpinner";
import { pluralize } from "~/utils/pluralize";
import { SETTINGS } from "~/utils/frontend_settings";
import {
  ConnectAccountsSetting,
  ConnectedAccountIconAndText,
} from "./ConnectedAccounts";
import {
  useResponsiveV2,
  BP,
  ResponsiveBreakpoint,
} from "~/utils/useResponsive";

export const RepertoireHome = () => {
  const userState = () => getAppState().userState;
  const lichessMistakes = () => {
    if (isDevelopment) {
      // return [];
    }
    return getAppState().repertoireState.lichessMistakes;
  };
  const loadingMistakes = () => isNil(lichessMistakes());
  const themeId = () => userState().user?.theme;
  const theme = () =>
    find(combinedThemes, (theme) => theme.boardTheme === themeId()) ||
    COMBINED_THEMES_BY_ID["default"];
  const pieceSet = () => userState().user?.pieceSet;
  const [numMovesDueBySide, numLines, earliestDueDate] = useRepertoireState(
    (s) => [
      bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
      bySide((side) => s.getLineCount(side)),
      bySide((side) => s.earliestReviewDueFromEpd[side][START_EPD]),
    ],
  );
  const responsive = useResponsiveV2();
  const [progressState] = useBrowsingState(([s]) => {
    return [bySide((side) => s.repertoireProgressState[side])];
  });
  const overallEarliest = () => {
    const white = earliestDueDate()["white"];
    const black = earliestDueDate()["black"];
    if (white && !black) {
      return white;
    }
    if (!white && black) {
      return black;
    }
    if (white < black) {
      return white;
    } else {
      return black;
    }
  };
  const overallActions: Accessor<SidebarAction[]> = () => {
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    const actions = [];

    actions.push({
      text: "Practice your repertoire",
      right: <ReviewText date={overallEarliest()} numDue={totalDue} />,
      style: "primary",
      disabled: totalDue === 0,
      onPress: () => {
        trackEvent("home.practice_all_due");
        quick((s) => {
          if (totalDue > LOTS_DUE_MINIMUM) {
            s.repertoireState.browsingState.pushView(PreReview, {
              props: { side: null },
            });
            return;
          }
          s.repertoireState.reviewState.startReview({
            side: null,
            filter: "due",
          });
        });
        return;
      },
    } as SidebarAction);
    return actions;
  };
  const [settingsExpanded, setSettingsExpanded] = createSignal(false);
  return (
    <Show when={userState().user}>
      <SidebarTemplate header={null} actions={[]} bodyPadding={false}>
        <div style={s(c.column, c.fullWidth, c.gap("10px"))}>
          <For each={SIDES}>
            {(side) => {
              return (
                <SidebarFullWidthButton
                  action={{
                    style: "wide",
                    text: `${capitalize(side)} repertoire`,
                    right: (
                      <CMText style={s(c.fg(c.colors.text.secondary))}>
                        {numLines()[side] > 0
                          ? `${Math.round(
                              progressState()[side].percentComplete,
                            )}% complete`
                          : "Not started"}
                      </CMText>
                    ),
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.select_side", { side });
                        if (numLines()[side] > 0) {
                          s.repertoireState.browsingState.moveSidebarState(
                            "right",
                          );
                          s.repertoireState.startBrowsing(side, "overview");
                        } else {
                          s.repertoireState.browsingState.moveSidebarState(
                            "right",
                          );
                          s.repertoireState.startBrowsing(side, "overview");
                        }
                      });
                    },
                  }}
                />
              );
            }}
          </For>
        </div>

        <Spacer height={46} />
        <Show when={!isEmpty(overallActions())}>
          <div style={s()}>
            <For each={overallActions()}>
              {(action) => <SidebarFullWidthButton action={action} />}
            </For>
          </div>
        </Show>
        <Show when={userState().isConnectedToExternal()}>
          <Spacer height={12} />
          <div style={s(c.column, c.fullWidth, c.gap("10px"))}>
            <SidebarFullWidthButton
              action={{
                style: "primary",
                text: "Review your online games",
                disabled: isEmpty(lichessMistakes()),
                right: loadingMistakes() ? (
                  <LoadingSpinner class="text-[12px]" />
                ) : (
                  <div
                    class={clsx(
                      "flex row text-xs font-semibold",
                      isEmpty(lichessMistakes())
                        ? "text-tertiary"
                        : "text-orange-60 ",
                    )}
                  >
                    <CMText class={clsx("")}>
                      {lichessMistakes()?.length
                        ? `${pluralize(lichessMistakes()?.length, "Mistake")}`
                        : "No mistakes"}
                    </CMText>
                    <i
                      class={clsx(
                        "fa ml-2",
                        isEmpty(lichessMistakes())
                          ? "fa-circle-check"
                          : "fa-circle-x",
                      )}
                    />
                  </div>
                ),
                onPress: () => {
                  quick((s) => {
                    s.repertoireState.reviewState.startReview({
                      lichessMistakes: lichessMistakes() as LichessMistake[],
                      side: null,
                    });
                  });
                },
              }}
            />
          </div>
        </Show>
        <Show when={!userState().isConnectedToExternal()}>
          <Spacer height={10} />
          <div style={s(c.column, c.fullWidth, c.gap("10px"))}>
            <SidebarFullWidthButton
              action={{
                style: "primary",
                text: "Review your online games",
                right: (
                  <CMText class="text-secondary text-xs">
                    {responsive().isMobile ? "Connect" : "Connect account"}…
                  </CMText>
                ),
                onPress: () => {
                  quick((s) => {
                    s.repertoireState.browsingState.pushView(
                      ConnectAccountsSetting,
                    );
                  });
                },
              }}
            />
          </div>
        </Show>
        <Spacer height={46} />
        <>
          <SidebarSectionHeader text="Settings" />
          <div style={s()}>
            <For
              each={filter(
                [
                  {
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.settings.coverage");
                        s.repertoireState.browsingState.pushView(
                          CoverageSettings,
                        );
                      });
                    },
                    text: "Cover positions seen in",
                    right: `1 in ${Math.round(
                      1 / userState().getCurrentThreshold(),
                    )} games`,
                    style: "secondary",
                  } as SidebarAction,
                  {
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.settings.rating");
                        s.repertoireState.browsingState.pushView(
                          RatingSettings,
                        );
                      });
                    },
                    text: "Your rating",
                    right: `${userState().user?.ratingRange} ${
                      userState().user?.ratingSystem
                    }`,
                    style: "secondary",
                  } as SidebarAction,
                  {
                    onPress: () => {
                      quick((s) => {
                        s.repertoireState.browsingState.pushView(
                          ConnectAccountsSetting,
                        );
                      });
                    },
                    // todo: enable handling of xs breakpoint stuff
                    text: "Connected to",
                    hidden: false,
                    right: (
                      <div class="flex row space-x-4">
                        <ConnectedAccountIconAndText
                          text="Lichess"
                          connected={!!userState().user?.lichessUsername}
                        />
                        <ConnectedAccountIconAndText
                          text="Chess.com"
                          connected={!!userState().user?.chesscomUsername}
                        />
                      </div>
                    ),
                    style: "secondary",
                  } as SidebarAction,
                  {
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.settings.theme");
                        s.repertoireState.browsingState.pushView(ThemeSettings);
                      });
                    },
                    text: "Board appearance",
                    right: `${upperFirst(theme().name)}`,
                    style: "secondary",
                  } as SidebarAction,

                  {
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.settings.pieceAnimationSpeed");
                        s.repertoireState.browsingState.pushView(
                          FrontendSettingView,
                          { props: { setting: SETTINGS.pieceAnimation } },
                        );
                      });
                    },
                    hidden: !settingsExpanded(),
                    text: SETTINGS.pieceAnimation.title,
                    right:
                      userState().getFrontendSetting("pieceAnimation").label,
                    style: "secondary",
                  } as SidebarAction,
                  {
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.settings.beta_features");
                        s.repertoireState.browsingState.pushView(
                          BetaFeaturesSettings,
                        );
                      });
                    },
                    text: "Beta features",
                    hidden: !settingsExpanded(),
                    right: `${
                      (userState().getEnabledFlags()?.length ?? 0) > 0
                        ? `${userState().getEnabledFlags()?.length} enabled`
                        : "None enabled"
                    }`,
                    style: "secondary",
                  } as SidebarAction,
                  {
                    hidden: !settingsExpanded(),
                    onPress: () => {
                      quick((s) => {
                        if (!userState().user?.subscribed) {
                          trackEvent("home.settings.subscribe");
                          s.repertoireState.browsingState.pushView(
                            UpgradeSubscriptionView,
                          );
                        } else {
                          trackEvent("home.settings.manage_subscription");
                          return client
                            .post("/api/stripe/create-billing-portal-link")
                            .then(({ data }: { data: { url: string } }) => {
                              window.open(data.url, "_blank");
                            })
                            .finally(noop);
                        }
                      });
                    },
                    text: userState().user?.subscribed
                      ? "Manage your subscription"
                      : "Upgrade to add unlimited moves",
                    style: "secondary",
                  } as SidebarAction,
                ],
                // @ts-ignore
                (a) => !a.hidden,
              )}
            >
              {(action, i) => <SidebarFullWidthButton action={action} />}
            </For>
            <SeeMoreActions
              text={settingsExpanded() ? "Hide" : "More options..."}
              onClick={() => {
                setSettingsExpanded(!settingsExpanded());
              }}
            />
          </div>
          <Spacer height={46} />
        </>
        <>
          <SidebarSectionHeader text="Contact us" />
          <div style={s()}>
            <For
              each={[
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.contact.discord");
                      window.open("https://discord.gg/vNzfu5VetQ", "_blank");
                    });
                  },
                  text: "Join our Discord",
                  style: "secondary",
                } as SidebarAction,
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.contact.twitter");
                      window.open("https://twitter.com/chessbookcom", "_blank");
                    });
                  },
                  text: "Follow us on Twitter",
                  style: "secondary",
                } as SidebarAction,
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.contact.feedback");
                      s.repertoireState.browsingState.pushView(FeedbackView);
                    });
                  },
                  text: "Share your feedback",
                  style: "secondary",
                } as SidebarAction,
              ]}
            >
              {(action) => <SidebarFullWidthButton action={action} />}
            </For>
          </div>
          <Spacer height={46} />
        </>
      </SidebarTemplate>
    </Show>
  );
};
