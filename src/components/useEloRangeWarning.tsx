import { useState } from "react";
import { View } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { DEFAULT_ELO_RANGE } from "app/utils/repertoire_state";
import { isEqual, isNil, parseInt } from "lodash-es";
import { useModal } from "./useModal";
import { EloWarningBox } from "./EloWarningBox";
import { SelectOneOf } from "./SelectOneOf";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { useRepertoireState, useAppState } from "app/utils/app_state";

type EloRange = [number, number];

const ELO_RANGES = [
  [0, 1100],
  [1100, 1300],
  [1300, 1500],
  [1500, 1700],
  [1700, 1900],
  [1900, 2800],
];

export const useEloRangeWarning = ({ separate }: { separate?: boolean }) => {
  let [updateEloRange, isUpdatingEloRange] = useRepertoireState((s) => [
    s.updateEloRange,
    s.isUpdatingEloRange,
  ]);
  let [user] = useAppState((s) => [s.userState.user]);
  let [selectedEloRange, setSelectedEloRange] = useState(
    (user?.eloRange ? parseEloRange(user.eloRange) : DEFAULT_ELO_RANGE) as [
      number,
      number
    ]
  );
  let modalContent = (
    <View style={s(c.column, c.px(12), c.py(12), c.maxWidth(400))}>
      <CMText style={s(c.fg(c.colors.textPrimary))}>
        Select your elo range on Lichess. If you play on chess.com, bump your
        rating up by a few hundred points. This will be used for win-rates and
        to determine the biggest gaps in your repertoire, based on what moves
        the players at your level play.
      </CMText>

      <Spacer height={12} />
      <SelectOneOf
        choices={ELO_RANGES}
        activeChoice={selectedEloRange}
        equality={isEqual}
        onSelect={function (c): void {
          setSelectedEloRange(c);
        }}
        renderChoice={(r: EloRange) => {
          return `${r[0]}-${r[1]}`;
        }}
      />
      <Spacer height={12} />
      <Button
        isLoading={isUpdatingEloRange}
        loaderProps={{ color: c.grays[75] }}
        style={s(c.buttons.primary)}
        onPress={() => {
          updateEloRange(selectedEloRange);
        }}
      >
        Update
      </Button>
    </View>
  );
  const { open, setOpen, modal } = useModal({
    content: modalContent,
    isOpen: false,
  });
  const showEloWarning = isNil(user?.eloRange);
  return {
    isEloModalOpen: open,
    setIsEloModalOpen: setOpen,
    showEloWarning,
    eloModal: modal,
    eloWarning: showEloWarning && (
      <>
        <EloWarningBox
          onUpdateElo={() => {
            setOpen(true);
          }}
          onDismiss={() => {
            updateEloRange(DEFAULT_ELO_RANGE);
          }}
        />
        {!separate && modal}
      </>
    ),
  };
};

export const parseEloRange = (eloRange: string): [number, number] => {
  return eloRange.split("-").map((s) => parseInt(s)) as [number, number];
};
