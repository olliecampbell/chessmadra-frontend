import { Modal } from "./Modal";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "~/components/Space";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { getAppState, useUserState, quick } from "~/utils/app_state";
import { BP, useResponsive } from "~/utils/useResponsive";
import { cloneDeep, keys, upperFirst } from "lodash-es";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  BoardThemeId,
  BOARD_THEMES,
  BOARD_THEMES_BY_ID,
  PieceSetId,
  PIECE_SETS,
} from "~/utils/theming";
import { PieceView } from "./chessboard/Chessboard";
import { PieceSymbol } from "@lubert/chess.ts";
import { View } from "./View";
import { Component } from "solid-js";

export const SidebarSetting = () => {
  return (
    <SidebarTemplate actions={[]} header={"Settings"}>
      <Spacer height={24} />
      <CoverageSettings />
    </SidebarTemplate>
  );
};
type SidebarSettingView = "rating" | "coverage";

export const SidebarSelectOneOf = <T,>({
  choices,
  onSelect,
  description,
  renderChoice,
  activeChoice,
  title,
}: {
  title?: string;
  description?: string;
  choices: T[];
  activeChoice: T;
  onSelect: (_: T, i?: number) => void;
  renderChoice: (x: T) => Component;
}) => {
  const responsive = useResponsive();
  let actions = choices.map((choice, i) => {
    const active = choice === activeChoice;
    return {
      style: active ? "primary" : ("secondary" as SidebarAction["style"]),
      text: renderChoice(choice),
      onPress: () => onSelect(choice, i),
      right: active && (
        <i className={`fa fa-check`} style={s(c.fg(c.colors.textPrimary))} />
      ),
    };
  });
  return (
    <View style={s(c.column, c.fullWidth)}>
      {title && (
        <>
          <CMText
            style={s(
              c.fontSize(16),
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.px(c.getSidebarPadding(responsive))
            )}
          >
            {title}
          </CMText>
          <Spacer height={12} />
        </>
      )}
      {description && (
        <>
          <CMText
            style={s(
              c.fontSize(12),
              c.lineHeight(16),
              c.fg(c.colors.textSecondary),
              c.px(c.getSidebarPadding(responsive))
            )}
          >
            {description}
          </CMText>
          <Spacer height={12} />
        </>
      )}
      <View style={s(c.fullWidth)}>
        {actions.map((action, i) => {
          return <SidebarFullWidthButton key={i} action={action} />;
        })}
      </View>
    </View>
  );
};

export const THRESHOLD_OPTIONS = [4, 2, 1, 0.8, 0.5].map((x) => x / 100);

export const CoverageSettings = ({}: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = missThreshold;
  const onSelect = (t: number) => {
    quick((s) => {
      s.userState.setTargetDepth(t);
    });
  };
  const responsive = useResponsive();
  const recommendedDepth = getRecommendedMissThreshold(user?.eloRange);
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  if (user.isAdmin) {
    thresholdOptions.push(0.25 / 100, 1 / 600);
  }
  return (
    <SidebarTemplate actions={[]} header={"Coverage"}>
      <Spacer height={12} />
      <SidebarSelectOneOf
        description={`If you set this to 1 in 100, then you'll be aiming to build a repertoire that covers every position that happens in at least 1 in 100 games between players of your rating range. At your level we recommend a coverage target of 1 in ${Math.round(
          1 / recommendedDepth
        )} games`}
        choices={thresholdOptions}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={selected}
        onSelect={onSelect}
        renderChoice={(r: number) => {
          return `1 in ${Math.round(1 / r)} games`;
        }}
      />
    </SidebarTemplate>
  );
};
export const RatingSettings = ({}: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = missThreshold;
  const onSelect = (t: string) => {
    quick((s) => {
      getAppState().userState.setRatingRange(t);
    });
  };
  const responsive = useResponsive();
  const recommendedDepth = getRecommendedMissThreshold(user?.eloRange);
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  if (user.isAdmin) {
    thresholdOptions.push(0.25 / 100, 1 / 600);
  }
  return (
    <SidebarTemplate actions={[]} header={"Your rating"}>
      <CMText style={s(c.px(c.getSidebarPadding(responsive)))}>
        We use this to determine which lines you'll commonly see at your level,
        so you can learn a response for those.
      </CMText>
      <Spacer height={24} />
      <SidebarSelectOneOf
        title="Elo range"
        choices={[
          "0-1100",
          "1100-1300",
          "1300-1500",
          "1500-1700",
          "1700-1900",
          "1900+",
        ]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user?.ratingRange}
        onSelect={onSelect}
        renderChoice={(r: string) => {
          return r;
        }}
      />
      <Spacer height={24} />
      <SidebarSelectOneOf
        title="Rating system"
        choices={["Lichess", "Chess.com", "FIDE", "USCF"]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user?.ratingSystem}
        onSelect={(t) => {
          quick((s) => {
            getAppState().userState.setRatingSystem(t);
          });
        }}
        renderChoice={(r: string) => {
          return r;
        }}
      />
    </SidebarTemplate>
  );
};

export const ThemeSettings = ({}: {}) => {
  let responsive = useResponsive();
  const themes = BOARD_THEMES;
  const [user] = useUserState((s) => [s.user]);
  const height = 24;
  return (
    <SidebarTemplate actions={[]} header={null}>
      <Spacer height={12} />
      <SidebarSelectOneOf
        description={null}
        title={"Tiles"}
        choices={keys(BOARD_THEMES_BY_ID) as BoardThemeId[]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user.theme}
        onSelect={(t: BoardThemeId) => {
          quick((s) => {
            const params: any = { theme: t };
            if (t === "low-contrast") {
              params.pieceSet = "monochrome";
            }
            s.userState.updateUserSettings(params);
          });
        }}
        renderChoice={(themeId: BoardThemeId) => {
          const theme = BOARD_THEMES_BY_ID[themeId];
          console.log(theme, themeId);
          return (
            <View style={s(c.row, c.center, c.height(height))}>
              <View style={s(c.row)}>
                <View
                  style={s(
                    c.size(22),
                    c.bg(theme.light.color),
                    theme.light.styles
                  )}
                ></View>
                <View
                  style={s(
                    c.size(22),
                    c.bg(theme.dark.color),
                    theme.dark.styles
                  )}
                ></View>
              </View>
              <Spacer width={22} />
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {theme.name}
              </CMText>
            </View>
          );
        }}
      />
      <Spacer height={24} />

      <SidebarSelectOneOf
        description={null}
        title={"Pieces"}
        choices={PIECE_SETS}
        activeChoice={user.pieceSet}
        onSelect={(t: PieceSetId) => {
          quick((s) => {
            s.userState.updateUserSettings({ pieceSet: t });
          });
        }}
        renderChoice={(pieceSet: PieceSetId) => {
          return (
            <View style={s(c.row, c.center, c.height(height))}>
              {["q", "k"].map((p: PieceSymbol) => {
                return (
                  <View style={s(c.size(24), c.mr(4))}>
                    <PieceView
                      pieceSet={pieceSet}
                      piece={{ color: "w", type: p }}
                    />
                  </View>
                );
              })}
              <Spacer width={12} />
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {upperFirst(pieceSet)}
              </CMText>
            </View>
          );
        }}
      />
    </SidebarTemplate>
  );
};
