import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  some,
  isNaN,
  takeWhile,
  debounce,
  isEmpty,
  filter,
  isNil,
  last,
  every,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { formatIncidence, RepertoireMove, Side } from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { PositionReport, SuggestedMove } from "app/models";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  formatPlayPercentage,
  getPlayRate,
  getTotalGames,
} from "app/utils/results_distribution";
import {
  useAppState,
  useBrowsingState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "app/utils/app_state";
import React, { useCallback, useEffect, useState } from "react";
import { useHovering } from "app/hooks/useHovering";
import { TableResponseScoreSource } from "./RepertoireEditingView";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { trackEvent } from "app/hooks/useTrackEvent";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { css } from "@emotion/react";
import {
  getMoveRating,
  getMoveRatingIcon,
  getWinPercentage,
  MoveRating,
} from "app/utils/move_inaccuracy";
import { quick } from "app/utils/app_state";

export const MAX_ANNOTATION_LENGTH = 300;

export const AnnotationEditor = ({
  annotation: _annotation,
  onUpdate,
}: {
  annotation: string;
  onUpdate: (annotation: string) => void;
}) => {
  const [focus, setFocus] = useState(false);
  const [annotation, setAnnotation] = useState(_annotation);
  const updateDebounced = useCallback(
    debounce(
      (annotation: string) => {
        onUpdate(annotation);
      },
      400,
      { leading: true }
    ),
    []
  );
  return (
    <View style={s(c.grow, c.relative)}>
      <View
        style={s(
          c.absolute,
          c.bottom(12),
          c.right(12),
          c.opacity(focus ? 100 : 0)
        )}
      >
        <CMText
          style={s(
            annotation?.length > MAX_ANNOTATION_LENGTH && c.weightBold,
            c.fg(
              annotation?.length > MAX_ANNOTATION_LENGTH
                ? c.reds[60]
                : c.grays[50]
            )
          )}
        >
          {annotation?.length ?? 0}/{MAX_ANNOTATION_LENGTH}
        </CMText>
      </View>
      <textarea
        value={annotation ?? ""}
        style={s(
          {
            fontFamily: "Roboto Flex",
            fontVariationSettings: '"wdth" 110',
          },
          c.grow,
          c.border("none"),
          c.br(0),
          c.px(12),
          c.py(12),
          c.pb(24),
          c.keyedProp("resize")("none")
        )}
        placeholder={'ex. "Intending Bg5 after d4"'}
        onFocus={() => {
          setFocus(true);
        }}
        onBlur={() => {
          setFocus(false);
        }}
        onChange={(e) => {
          setAnnotation(e.target.value);
          if (e.target.value.length < MAX_ANNOTATION_LENGTH) {
            updateDebounced(e.target.value);
          }
        }}
      />
    </View>
  );
};
