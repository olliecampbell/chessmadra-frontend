import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { cloneDeep, isEmpty, isNil, takeRight } from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { keyBy, groupBy } from "lodash";
import { intersperse } from "app/utils/intersperse";
import {
  RepertoireState,
  useRepertoireState,
} from "app/utils/repertoire_state";
import {
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { Modal } from "./Modal";
import { SelectOneOf } from "./SelectOneOf";

const MOBILE_CUTOFF = 800;

enum OpeningSource {
  Lichess,
  ChessCom,
  Pgn,
  None,
}

function formatOpeningSource(openingSource: OpeningSource) {
  switch (openingSource) {
    case OpeningSource.Lichess:
      return "Lichess";
    case OpeningSource.ChessCom:
      return "Chess.com";
    case OpeningSource.Pgn:
      return "PGN Upload";
    case OpeningSource.None:
      return "Manual";
  }
}

enum RatingSource {
  Lichess,
  ChessCom,
  Fide,
}

function formatRatingSource(ratingSource: RatingSource) {
  switch (ratingSource) {
    case RatingSource.Lichess:
      return "Lichess";
    case RatingSource.ChessCom:
      return "Chess.com";
    case RatingSource.Fide:
      return "FIDE";
  }
}

enum RatingRange {
  RatingLessThan1200 = "<1200",
  Rating1200To1500 = "1200-1500",
  Rating1500To1800 = "1500-1800",
  Rating1800To2100 = "1800-2100",
  RatingGreaterThan2100 = "2100+",
}

function formatRatingRange(ratingRange: RatingRange) {
  switch (ratingRange) {
    case RatingRange.RatingLessThan1200:
      return "<1200";
    case RatingRange.Rating1200To1500:
      return "1200-1500";
    case RatingRange.Rating1500To1800:
      return "1500-1800";
    case RatingRange.Rating1800To2100:
      return "1800-2100";
    case RatingRange.RatingGreaterThan2100:
      return "2100+";
  }
}

export const RepertoireWizard = () => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  const state = useRepertoireState();
  useEffect(() => {
    state.initState();
  }, []);
  let grade = state.repertoireGrades[state.activeSide];
  useEffect(() => {
    document.onkeydown = function (e) {
      switch (e.key) {
        case "ArrowLeft":
          state.quick(() => {
            state.position.undo();
          });
          break;
      }
    };
    return () => {
      document.onkeydown = null;
    };
  }, []);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [rating, setRating] = useState(RatingRange.Rating1500To1800);
  const [ratingSource, setRatingSource] = useState(RatingSource.Lichess);
  const [openingSource, setOpeningSource] = useState(OpeningSource.Lichess);
  const [ratingTimeControl, setRatingTimeControl] = useState(true);
  const openingSourceSelector = (
    <SelectOneOf
      choices={[
        OpeningSource.Lichess,
        OpeningSource.ChessCom,
        OpeningSource.Pgn,
        OpeningSource.None,
      ]}
      horizontal={true}
      containerStyles={s(c.fullWidth)}
      activeChoice={openingSource}
      onSelect={function (x: OpeningSource): void {
        setOpeningSource(x);
      }}
      renderChoice={function (x: OpeningSource): JSX.Element | string {
        return formatOpeningSource(x);
      }}
    />
  );
  const ratingRangeSelector = (
    <SelectOneOf
      choices={[
        RatingRange.RatingLessThan1200,
        RatingRange.Rating1200To1500,
        RatingRange.Rating1500To1800,
        RatingRange.Rating1800To2100,
        RatingRange.RatingGreaterThan2100,
      ]}
      horizontal={true}
      containerStyles={s(c.fullWidth)}
      activeChoice={rating}
      onSelect={function (rating: RatingRange): void {
        setRating(rating);
      }}
      renderChoice={function (rating: RatingRange): JSX.Element | string {
        return formatRatingRange(rating);
      }}
    />
  );
  const [username, setUsername] = useState(null);
  let initialStep = {
    questionCopy:
      "This tool uses data from millions of online games to determine the gaps in your openings, based on how your opponents tend to play. We can either get your ratings from your online games, or PGN files, or you can skip this step for now.",
    isValid: (() => {
      if (openingSource == OpeningSource.Lichess && !isEmpty(username)) {
        return true;
      }
      if (openingSource == OpeningSource.ChessCom && !isEmpty(username)) {
        return true;
      }
      if (openingSource == OpeningSource.Pgn) {
        return true;
      }
      if (openingSource == OpeningSource.None) {
        return true;
      }
    })(),
    children: (
      <>
        <SelectOneOf
          choices={[
            OpeningSource.Lichess,
            OpeningSource.ChessCom,
            OpeningSource.Pgn,
            OpeningSource.None,
            // RatingSource.Fide,
          ]}
          horizontal={true}
          cellStyles={s(c.grow, c.center)}
          containerStyles={s(c.fullWidth)}
          activeChoice={openingSource}
          onSelect={function (source: OpeningSource): void {
            setOpeningSource(source);
          }}
          renderChoice={(source: OpeningSource): string | JSX.Element => {
            return formatOpeningSource(source);
          }}
        />
      </>
    ),
  };
  let ratingRangeStep = {
    questionCopy:
      "This tool uses data from millions of online games to determine the gaps in your openings, based on how your opponents tend to play. The first thing we need to know is your rating; which of these is most accurate?",
    isValid: rating !== null,
    children: (
      <>
        <SelectOneOf
          choices={[
            RatingSource.Lichess,
            RatingSource.ChessCom,
            // RatingSource.Fide,
          ]}
          horizontal={true}
          cellStyles={s(c.grow)}
          containerStyles={s(c.fullWidth)}
          activeChoice={ratingSource}
          onSelect={function (source: RatingSource): void {
            setRatingSource(source);
          }}
          renderChoice={(source: RatingSource): string | JSX.Element => {
            return formatRatingSource(source);
          }}
        />
      </>
    ),
  };
  let uploadPgnStep = {
    questionCopy:
      "Do you have an opening repertoire already? We can either get your opening repertoire from your recent Lichess games, or you can upload your white and black repertoires as individual PGNs here.",
    isValid: true,
    children: (
      <>
        <UploadPgnsView />
      </>
    ),
  };
  return (
    <>
      <Spacer height={0} grow />
      <WizardStep {...initialStep} />
      <Spacer height={0} grow />
    </>
  );
};

const WizardStep = ({ questionCopy, children, isValid }) => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  return (
    <View style={s(c.column, c.containerStyles(isMobile), c.maxWidth(500))}>
      <Text
        style={s(
          c.fg(c.colors.textPrimary),
          c.weightSemiBold,
          c.fontSize(14),
          c.lineHeight("1.7em")
        )}
      >
        {questionCopy}
      </Text>
      <Spacer height={24} />
      {children}
      <Spacer height={24} />
      <Button
        style={s(
          isValid ? c.buttons.primary : c.buttons.primaryDisabled,
          c.selfEnd
        )}
        onPress={() => {}}
      >
        Continue
      </Button>
    </View>
  );
};

const UploadPgnsView = () => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  return (
    <View style={s(isMobile ? c.column : c.row)}>
      <PgnUploadDropper color="White" />
      <Spacer width={12} />
      <PgnUploadDropper color="Black" />
    </View>
  );
};

const PgnUploadDropper = ({ color }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <Text style={s(c.fg(c.colors.textPrimary), c.fontSize(18), c.weightBold)}>
        {color}
      </Text>
      <Spacer height={12} />
      <View
        style={s(
          c.width(240),
          c.height(200),
          c.center,
          c.textAlign("center"),
          c.bg(c.grays[20]),
          c.br(4),
          c.clickable,
          c.relative
        )}
      >
        <input
          style={s(
            c.top(0),
            c.left(0),
            c.absolute,
            c.fullWidth,
            c.fullHeight,
            c.opacity(0),
            c.clickable
          )}
          accept=".pgn"
          multiple={true}
          onChange={() => {}}
          type="file"
        ></input>
        <Text style={s(c.fg(c.colors.textSecondary))}>
          Drag a pgn in here, or click to browse
        </Text>
      </View>
    </View>
  );
};
