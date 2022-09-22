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
import { RepertoireWizard } from "./RepertoireWizard";
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
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { ProfileModal } from "./ProfileModal";
import { RepertoireOverview } from "./RepertoireOverview";

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
    s.repertoire === undefined,
    s.showImportView,
    s.isBrowsing,
    s.isEditing,
    s.isReviewing,
    s.initState,
  ]);
  useEffect(() => {
    if (repertoireLoading) {
      initState();
    }
  }, []);

  let inner = null;
  let centered = false;
  if (underConstruction && !debugUi) {
    inner = (
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
  } else if (repertoireLoading) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (showImportView) {
    inner = <RepertoireWizard />;
  } else {
    if (isEditing) {
      return (
        <>
          <RepertoireEditingView />
        </>
      );
    } else if (isBrowsing) {
      return (
        <>
          <RepertoireBrowsingView />
        </>
      );
    } else if (isReviewing) {
      return <RepertoireReview />;
    } else {
      return <RepertoireOverview />;
    }
  }
};

// const BiggestMissBoards = ({ side }: { side: Side }) => {
//   const [biggestMiss, quick] = useRepertoireState((s) => [
//     s.repertoireGrades[side]?.biggestMiss,
//     s.quick,
//   ]);
//   const isMobile = useIsMobile();
//   if (!biggestMiss) {
//     return null;
//   }
//   return (
//     <View
//       style={s(c.column, c.alignCenter, cardStyles, c.brt(0), c.selfStretch)}
//     >
//       <SideSectionHeader header="" icon={null} />
//       <View
//         style={s(
//           c.row,
//           c.selfStretch,
//           c.alignCenter,
//           c.justifyCenter,
//           c.px(32),
//           c.py(isMobile ? 12 : 24)
//         )}
//       >
//         {intersperse(
//           [biggestMiss].map((x, i) => {
//             let onClick = () =>
//               quick((s) => {
//                 s.startEditing(side as Side);
//                 s.chessboardState.playPgn(x.lines[0]);
//                 trackEvent("overview.go_to_biggest_miss");
//               });
//             return (
//               <View style={s(c.column, c.center)} key={`miss-${i}`}>
//                 <View style={s(c.size(isMobile ? 120 : 160))}>
//                   <Pressable
//                     onPress={() => {
//                       onClick();
//                     }}
//                   >
//                     <ChessboardView
//                       onSquarePress={() => {
//                         onClick();
//                       }}
//                       state={createStaticChessState({
//                         line: biggestMiss.lines[0],
//                         side: side as Side,
//                       })}
//                     />
//                   </Pressable>
//                 </View>
//                 <Spacer height={12} />
//                 <View style={s(c.row, c.alignCenter)}>
//                   <CMText
//                     style={s(
//                       c.fg(c.grays[70]),
//                       c.weightSemiBold,
//                       isMobile ? c.fontSize(14) : c.fontSize(16)
//                     )}
//                   >
//                     Biggest gap – {formatIncidence(biggestMiss.incidence)} of
//                     games{" "}
//                   </CMText>
//                 </View>
//               </View>
//             );
//           }),
//           (i) => {
//             return <Spacer width={24} key={i} />;
//           }
//         )}
//       </View>
//     </View>
//   );
// };
