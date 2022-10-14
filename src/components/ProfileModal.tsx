import { Modal } from "./Modal";
import { View, Pressable } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { AddedLineStage, AddNewLineChoice } from "app/utils/repertoire_state";
import { isNil } from "lodash-es";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { lineToPgn } from "app/utils/repertoire";
import { ChessboardView } from "./chessboard/Chessboard";
import { createStaticChessState } from "app/utils/chessboard_state";
import { useIsMobile } from "app/utils/isMobile";
import { formatStockfishEval } from "app/utils/stockfish";
import { getTotalGames } from "app/utils/results_distribution";
import { GameResultsBar } from "./GameResultsBar";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import {
  DEFAULT_THRESHOLD,
  getRecommendedMissThreshold,
} from "app/utils/user_state";
import {
  getAppState,
  useRepertoireState,
  useAppState,
  useUserState,
  quick,
} from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import { BP, useResponsive } from "app/utils/useResponsive";

export const ProfileModal = () => {
  const [user, profileModalOpen] = useUserState((s) => [
    s.user,
    s.profileModalOpen,
  ]);

  const responsive = useResponsive();
  const vertical = responsive.bp <= BP.sm;
  const gap = responsive.switch(12, [BP.md, 24], [BP.xl, 24]);
  return (
    <Modal
      onClose={() => {
        quick((s) => {
          s.userState.profileModalOpen = false;
        });
      }}
      visible={profileModalOpen === true}
    >
      <View
        style={s(
          vertical ? c.column : c.row,
          c.bg(c.grays[100]),
          c.br(4),
          c.px(vertical ? 8 : 16),
          c.py(16),
          c.gap(vertical ? 48 : 48),
          !vertical && c.justifyBetween,
          c.maxWidth("100%")
        )}
      >
        <View style={s(c.row, c.justifyStart, c.gap(gap))}>
          <ProfileOptionDropdownSelector
            options={["Lichess", "Chess.com", "FIDE", "USCF"]}
            title={"Rating system"}
            onSelect={(x: string) => {
              getAppState().userState.setRatingSystem(x);
            }}
            selected={user?.ratingSystem || "Lichess"}
          />
          <ProfileOptionDropdownSelector
            options={[
              "0-1100",
              "1100-1300",
              "1300-1500",
              "1500-1700",
              "1700-1900",
              "1900+",
            ]}
            title={"Rating range"}
            onSelect={(x: string) => {
              getAppState().userState.setRatingRange(x);
            }}
            selected={user?.ratingRange || "Lichess"}
          />
        </View>
        <ProfileTargetDepthSelector />
      </View>
    </Modal>
  );
};

export const THRESHOLD_OPTIONS = [4, 2, 1, 0.8, 0.4];

export const ProfileTargetDepthSelector = ({}: {}) => {
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
  return (
    <View style={s(c.column, c.alignStart)}>
      <CMText
        style={s(c.fontSize(18), c.weightHeavy, c.fg(c.colors.textInverse))}
      >
        Cover positions which occur in
      </CMText>
      <Spacer height={responsive.switch(4, [BP.lg, 12])} />
      <SelectOneOf
        containerStyles={s(c.fullWidth)}
        choices={THRESHOLD_OPTIONS}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={selected}
        onSelect={onSelect}
        separator={() => {
          return <Spacer height={0} />;
        }}
        renderChoice={(r: number, active: boolean, i: number) => {
          return (
            <Pressable
              key={i}
              style={s(c.selfStretch)}
              onPress={() => {
                onSelect(r);
              }}
            >
              <View
                style={s(
                  c.height(34),
                  c.px(8),
                  c.row,
                  c.alignCenter,
                  active && c.bg(c.grays[93])
                )}
              >
                <CMText
                  style={s(
                    c.fg(
                      active
                        ? c.colors.textInverse
                        : c.colors.textInverseSecondary
                    ),
                    !active ? c.weightSemiBold : c.weightHeavy
                  )}
                >
                  1 in {Math.round(1 / (r / 100))} games
                </CMText>
                <Spacer width={12} grow />
                {recommendedDepth == r && (
                  <CMText
                    style={s(
                      !active && c.border(`1px solid ${c.grays[80]}`),
                      c.br(2),
                      c.p(4),
                      c.fontSize(12),
                      c.fg(c.grays[40])
                    )}
                  >
                    Recommended
                  </CMText>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export const ProfileOptionDropdownSelector = ({
  options,
  onSelect,
  title,
  selected,
}: {
  options: string[];
  title: string;
  onSelect: (x: string) => void;
  selected: string;
}) => {
  const responsive = useResponsive();
  return (
    <View style={s(c.column, c.alignStart, c.grow)}>
      <CMText
        style={s(c.fontSize(18), c.weightHeavy, c.fg(c.colors.textInverse))}
      >
        {title}
      </CMText>
      <Spacer height={responsive.switch(4, [BP.lg, 12])} />
      <SelectOneOf
        containerStyles={s(c.fullWidth)}
        choices={options}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={selected}
        onSelect={onSelect}
        separator={() => {
          return <Spacer height={0} />;
        }}
        renderChoice={(r: string, active: boolean, i: number) => {
          return (
            <Pressable
              key={i}
              style={s(c.selfStretch)}
              onPress={() => {
                onSelect(r);
              }}
            >
              <View
                style={s(
                  responsive.bp >= BP.lg && c.height(34),
                  c.py(6),
                  c.px(8),
                  c.column,
                  active && c.bg(c.grays[93])
                )}
              >
                <CMText
                  style={s(
                    c.fg(
                      active
                        ? c.colors.textInverse
                        : c.colors.textInverseSecondary
                    ),
                    !active ? c.weightSemiBold : c.weightHeavy
                  )}
                >
                  {r}
                </CMText>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};
