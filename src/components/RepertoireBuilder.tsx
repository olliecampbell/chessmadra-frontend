import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { RepertoireState } from "app/utils/repertoire_state";
import {
  SIDES,
  Side,
  RepertoireMiss,
  formatIncidence,
} from "app/utils/repertoire";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import { RepertoireEditingView } from "./RepertoireEditingView";
import { RepertoireBrowsingView } from "./RepertoireBrowsingView";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import { useRepertoireState, useDebugState, quick } from "app/utils/app_state";
import { RepertoireReview } from "./RepertoireReview";
import { SideSettingsModal } from "./SideSettingsModal";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { ProfileModal } from "./ProfileModal";
import { RepertoireOverview } from "./RepertoireOverview";
import { RepertoirePageLayout } from "./RepertoirePageLayout";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const [underConstruction, debugUi] = useDebugState((s) => [
    s.underConstruction,
    s.debugUi,
  ]);
  const [
    repertoireLoading,
    showImportView,
    isBrowsing,
    isEditing,
    isReviewing,
    initState,
  ] = useRepertoireState((s) => [
    isNil(s.repertoire),
    s.showImportView,
    s.isBrowsing,
    s.isEditing,
    s.isReviewing,
    s.initState,
  ]);

  let inner = null;
  if (underConstruction && !debugUi) {
    return (
      <View style={s(c.column, c.center)}>
        {!isMobile && <Spacer height={48} />}
        <i
          className="fa-sharp fa-hammer"
          style={s(c.fontSize(32), c.fg(c.grays[80]))}
        />
        <Spacer height={12} />
        <CMText style={s(c.fontSize(18), c.weightSemiBold)}>
          Under construction
        </CMText>
        <Spacer height={12} />
        <CMText style={s()}>
          Doing some housekeeping, will be down for a while. Everything will be
          much snappier when we're back!
        </CMText>
      </View>
    );
  } else if (showImportView) {
    return (
      <RepertoirePageLayout>
        <RepertoireWizard />
      </RepertoirePageLayout>
    );
  } else {
    return <RepertoireOverview />;
  }
};
