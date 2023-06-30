import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { getAppState, useUserState, quick } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { cloneDeep, find } from "lodash-es";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  BoardThemeId,
  BOARD_THEMES_BY_ID,
  combinedThemes,
} from "~/utils/theming";
import { createEffect, Show } from "solid-js";
import { clsx } from "~/utils/classes";
import { compareFloats } from "~/utils/utils";
import { Dropdown } from "./SidebarOnboarding";
import { Pressable } from "./Pressable";
import { SidebarSelectOneOf } from "./SidebarSelectOneOf";

export const SidebarSetting = () => {
  return (
    <SidebarTemplate actions={[]} header={"Settings"}>
      <Spacer height={24} />
      <CoverageSettings />
    </SidebarTemplate>
  );
};

export const THRESHOLD_OPTIONS = [
  1 / 50,
  1 / 75,
  1 / 100,
  1 / 150,
  1 / 200,
  1 / 300,
  1 / 400,
];

export const CoverageSettings = (props: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = () => missThreshold();
  const onSelect = (t: number) => {
    quick((s) => {
      s.userState.setTargetDepth(t);
    });
  };
  // @ts-ignore
  const recommendedDepth = () => getRecommendedMissThreshold(user()?.eloRange);
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  return (
    <SidebarTemplate actions={[]} header={"Coverage goal"}>
      <SidebarSelectOneOf
        description={`Your repertoire will be complete when you cover all lines seen in:`}
        choices={thresholdOptions}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={selected()}
        onSelect={onSelect}
        equality={compareFloats}
        renderChoice={(r: number, active: boolean) => {
          return (
            <div class="row items-end">
              <div>{`1 in ${Math.round(1 / r)} games`}</div>
              <Show when={r === recommendedDepth()}>
                <div
                  class={clsx(
                    "pl-2 text-xs",
                    active ? "text-primary" : "text-tertiary"
                  )}
                >
                  Recommended for your level
                </div>
              </Show>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};
export const RatingSettings = (props: {}) => {
  return (
    <SidebarTemplate actions={[]} header={"Your rating"} bodyPadding={true}>
      <CMText style={s()} class={"text-secondary"}>
        This is used to determine which moves your opponents are likely to play.
      </CMText>
      <Spacer height={24} />
      <RatingSelection />
    </SidebarTemplate>
  );
};

export const ThemeSettings = (props: {}) => {
  const user = () => getAppState().userState?.user;
  const height = 24;
  return (
    <SidebarTemplate header={"Board appearance"} actions={[]}>
      <SidebarSelectOneOf
        choices={combinedThemes.map((t) => t.boardTheme)}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={user()?.theme ?? "default"}
        onSelect={(boardThemeId: BoardThemeId) => {
          quick((s) => {
            const theme = find(
              combinedThemes,
              (t) => t.boardTheme === boardThemeId
            );
            console.log("selected", boardThemeId, theme);
            s.userState.updateUserSettings({
              theme: theme!.boardTheme,
              pieceSet: theme!.pieceSet,
            });
          });
        }}
        renderChoice={(boardThemeId: BoardThemeId) => {
          const theme = find(
            combinedThemes,
            (t) => t.boardTheme === boardThemeId
          );
          const boardTheme = BOARD_THEMES_BY_ID[boardThemeId];
          return (
            <div style={s(c.row, c.center)}>
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {theme!.name}
              </CMText>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};

export const RatingSelection = (props: {}) => {
  console.log("rendering rating selection");
  const responsive = useResponsive();
  const [user] = useUserState((s) => [s.user]);
  createEffect(() => {
    console.log("rating system ", user()?.ratingSystem);
  });
  return (
    <div style={s(c.row, c.alignCenter)} class={"space-x-2"}>
      <Dropdown
        title={"Rating range"}
        onSelect={(range) => {
          quick((s) => {
            s.userState.setRatingRange(range);
          });
        }}
        choices={[
          "0-1100",
          "1100-1300",
          "1300-1500",
          "1500-1700",
          "1700-1900",
          "1900-2100",
          "2100+",
        ]}
        // @ts-ignore
        choice={user().ratingRange}
        renderChoice={(choice, inList, onPress) => {
          const textColor = c.gray[80];
          const textStyles = s(c.fg(textColor), c.fontSize(14));
          const containerStyles = s(
            c.py(12),
            inList && c.px(16),
            c.row,
            c.clickable,
            c.justifyStart,
            c.selfStart,
            c.alignCenter,
            c.width("fit-content"),
            c.minWidth(100)
          );
          const inner = (
            <CMText
              style={s(textStyles, !inList && s(c.fullWidth))}
              class={clsx("whitespace-nowrap break-keep")}
            >
              {choice}
            </CMText>
          );
          return (
            <Pressable
              style={s(containerStyles)}
              // @ts-ignore
              onPress={(e) => {
                onPress(e);
              }}
            >
              {inner}
            </Pressable>
          );
        }}
      />
      <div style={s(c.row)}>
        <Dropdown
          title={"Platform"}
          onSelect={(choice) => {
            console.log("On select", choice);
            quick((s) => {
              s.userState.setRatingSystem(choice);
            });
          }}
          choices={[
            RatingSource.Lichess,
            RatingSource.ChessCom,
            RatingSource.FIDE,
            RatingSource.USCF,
          ]}
          choice={user()?.ratingSystem ?? RatingSource.Lichess}
          renderChoice={(choice, inList, onPress) => {
            const textColor = c.gray[80];
            const textStyles = s(
              c.fg(textColor),
              c.fontSize(14),
              c.weightSemiBold
            );
            const containerStyles = s(
              c.py(12),
              inList && c.px(16),
              c.row,
              c.clickable,
              !inList && c.justifyEnd,
              c.fullWidth,
              c.selfStart,
              c.justifyStart,
              c.alignEnd,
              c.width("fit-content"),
              c.minWidth(90)
            );
            if (choice === RatingSource.Lichess) {
              return (
                <Pressable style={s(containerStyles)} onPress={onPress}>
                  <CMText style={s(textStyles)}>Lichess</CMText>
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
                </Pressable>
              );
            }
          }}
        />
      </div>
    </div>
  );
};

export enum RatingSource {
  Lichess = "Lichess",
  ChessCom = "Chess.com",
  USCF = "USCF",
  FIDE = "FIDE",
}
