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

export const SidebarTemplate = ({
  header,
  children,
  bodyPadding,
  loading,
  actions,
}: {
  header: string;
  children?: any;
  loading?: string;
  bodyPadding?: boolean;
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
          children
        )}
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
