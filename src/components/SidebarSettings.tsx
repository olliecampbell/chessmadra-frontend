import { Modal } from "./Modal";
import { View, Pressable } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "app/Space";
import { getRecommendedMissThreshold } from "app/utils/user_state";
import { getAppState, useUserState, quick } from "app/utils/app_state";
import { BP, useResponsive } from "app/utils/useResponsive";
import { cloneDeep, keys } from "lodash-es";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import {
  BoardThemeId,
  BOARD_THEMES,
  BOARD_THEMES_BY_ID,
  PieceSetId,
  PIECE_SETS,
} from "app/utils/theming";
import { PieceView } from "./chessboard/Chessboard";

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
  renderChoice: (x: T) => string;
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
              c.px(getSidebarPadding(responsive))
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
              c.px(getSidebarPadding(responsive))
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
      <CMText style={s(c.px(getSidebarPadding(responsive)))}>
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
            s.userState.updateUserSettings({ theme: t });
          });
        }}
        renderChoice={(themeId: BoardThemeId) => {
          const theme = BOARD_THEMES_BY_ID[themeId];
          console.log(theme, themeId);
          return (
            <View style={s(c.row, c.center)}>
              <View style={s(c.row)}>
                <View style={s(c.size(40), c.bg(theme.light.color))}></View>
                <View style={s(c.size(40), c.bg(theme.dark.color))}></View>
              </View>
              <Spacer width={12} />
              <CMText style={s(c.weightSemiBold, c.fontSize(16))}>
                {theme.name}
              </CMText>
            </View>
          );
        }}
      />
      <Spacer height={24} />

      <CMText
        style={s(
          c.fontSize(16),
          c.weightSemiBold,
          c.fg(c.colors.textPrimary),
          c.px(getSidebarPadding(responsive))
        )}
      >
        Piece set
      </CMText>
      <Spacer height={12} />
      <View
        style={s(
          c.grid({
            templateColumns: ["1fr", "1fr", "1fr", "1fr", "1fr"],
            columnGap: 24,
            templateRows: [],
            rowGap: 24,
          })
        )}
      >
        {PIECE_SETS.map((pieceSet, i) => {
          const active = user.pieceSet === pieceSet;
          return (
            <Pressable
              onPress={() => {
                quick((s) => {
                  s.userState.updateUserSettings({ pieceSet });
                });
              }}
              style={s(
                c.height(80),
                c.px(16),
                active && c.bg(c.grays[40]),
                c.center
              )}
            >
              <View style={s(c.row, c.center, c.size(60))}>
                <PieceView
                  pieceSet={pieceSet}
                  piece={{ color: "w", type: "n" }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </SidebarTemplate>
  );
};
