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
import { SidebarTemplate } from "./SidebarTemplate";
import client from "app/client";
import { useUserState } from "app/utils/app_state";

export const FeedbackView = () => {
  const responsive = useResponsive();
  const user = useUserState((s) => s.user);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const submitFeedback = () => {
    if (isEmpty(feedback)) {
      return;
    }
    setLoading(true);
    client
      .post("/api/v1/submit-feedback", {
        feedback,
        email: user?.email ?? email ?? null,
      })
      .then(() => {
        setSuccess(true);
        setLoading(false);
      });
  };
  return (
    <SidebarTemplate
      header={
        success
          ? "We got it! Thanks!"
          : "Feature request? Bug report? Let us know"
      }
      actions={
        success || loading
          ? []
          : [
              {
                onPress: () => {
                  submitFeedback();
                },
                style: "primary",
                text: "Submit",
              },
            ]
      }
      loading={loading && "Submitting feedback..."}
      bodyPadding={true}
    >
      {/*<CMText style={s(c.sidebarDescriptionStyles(responsive))}>
        Feature request? Bug report? Etc? Let us know
      </CMText>
      <Spacer height={12} />
*/}
      <Spacer height={12} />
      {!success && (
        <>
          {isEmpty(user?.email) && (
            <>
              <CMTextInput
                value={email}
                setValue={setEmail}
                placeholder={"Email (optional)"}
              />
              <Spacer height={4} />
            </>
          )}
          <CMTextInput
            value={feedback}
            textInputProps={{ multiline: true, numberOfLines: 8 }}
            setValue={setFeedback}
            placeholder={"Your feedback here..."}
          />
        </>
      )}
    </SidebarTemplate>
  );
};
