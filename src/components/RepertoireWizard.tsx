import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isNil } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { RepertoireState } from "app/utils/repertoire_state";
import { CMTextInput } from "./TextInput";
import { DragAndDropInput } from "./DragAndDropInput";
import { RepertoireTemplateWizard } from "./RepertoireTemplateWizard";
import { PlayerTemplateWizard } from "./PlayerTemplateWizard";
import { CMText } from "./CMText";
import { useRepertoireState } from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";

const MOBILE_CUTOFF = 800;

enum OpeningSource {
  Import,
  Templates,
  PlayerTemplates,
  // ChessCom,
  // Pgn,
  Manual,
  Chessmood,
}

// function formatRatingSource(ratingSource: RatingSource) {
//   switch (ratingSource) {
//     case RatingSource.Lichess:
//       return "Lichess";
//     case RatingSource.ChessCom:
//       return "Chess.com";
//     case RatingSource.Fide:
//       return "FIDE";
//   }
// }

export const RepertoireWizard = () => {
  const isMobile = useIsMobile(MOBILE_CUTOFF);
  const state = useRepertoireState((s) => s);
  useEffect(() => {
    state.fetchRepertoireTemplates();
    state.fetchPlayerTemplates();
  }, []);
  // const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // const [rating, setRating] = useState(RatingRange.Rating1500To1800);
  // const [ratingSource, setRatingSource] = useState(RatingSource.Lichess);
  const [openingSource, setOpeningSource] = useState(
    OpeningSource.PlayerTemplates
  );
  const [activeOpeningSource, setActiveOpeningSource] = useState(
    null
    // failOnTrue(OpeningSource.PlayerTemplates)
  );
  // const [ratingTimeControl, setRatingTimeControl] = useState(true);
  const [username, setUsername] = useState("");
  const [lichessStudy, setLichessStudy] = useState("");
  const [whitePgn, setWhitePgn] = useState(null as string);
  const [blackPgn, setBlackPgn] = useState(null as string);

  const importFromLichessUsername = () => {
    state.initializeRepertoire({ lichessUsername: username });
    trackEvent("import.from_lichess_username");
  };

  const introText = (
    <>
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.weightSemiBold,
          c.fontSize(14),
          c.lineHeight("1.7em")
        )}
      >
        This tool will help you build and remember your opening repertoire.
      </CMText>
      <Spacer height={12} />
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.weightSemiBold,
          c.fontSize(14),
          c.lineHeight("1.7em")
        )}
      >
        How do you want to create your opening?
      </CMText>
    </>
  );

  let playerTemplatesWarningSection = (
    <WarningSection
      title="Risk of deleting moves"
      isMobile={isMobile}
      copy={
        <>New lines in these templates will overwrite your existing lines.</>
      }
    />
  );

  let pgnWarningSection = (
    <WarningSection
      title="Risk of deleting moves"
      isMobile={isMobile}
      copy={
        <>
          New lines will overwrite any existing lines. Ex. if you have 1.e4 in
          your repertoire, but 1.d4 is in the white PGN, your 1.e4 repertoire
          will be lost.
        </>
      }
    />
  );

  let templatesWarningSection = (
    <WarningSection
      title="Risk of deleting moves"
      isMobile={isMobile}
      copy={
        <>
          New lines will overwrite any existing lines. Ex. if your current
          repertoire has 1.e4 d5, but you add the Najdorf template, all moves
          after 1.e4 d5 will be lost.
        </>
      }
    />
  );

  return (
    <>
      <Spacer height={32} grow />
      <View
        style={s(
          c.column,
          c.containerStyles(
            isMobile,
            activeOpeningSource === OpeningSource.Templates ||
              activeOpeningSource === OpeningSource.PlayerTemplates
              ? 700
              : 500
          )
        )}
      >
        {isNil(activeOpeningSource) &&
          !state.hasCompletedRepertoireInitialization && (
            <>
              {introText}
              <Spacer height={24} />
            </>
          )}
        {isNil(activeOpeningSource) &&
          state.hasCompletedRepertoireInitialization && (
            <>
              <Pressable
                style={s(c.row, c.alignCenter, c.clickable, c.pl(4))}
                onPress={() => {
                  state.backToOverview();
                }}
              >
                <i
                  className="fa-light fa-angle-left"
                  style={s(c.fg(c.grays[70]), c.fontSize(16))}
                />
                <Spacer width={6} />
                <CMText style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
                  Back to repertoire
                </CMText>
              </Pressable>
              <Spacer height={24} />
            </>
          )}
        {isNil(activeOpeningSource) && (
          <>
            <View style={s(c.column)}>
              <ImportOptions {...{ state, openingSource, setOpeningSource }} />
              <Spacer height={12} />
              <Button
                onPress={() => {
                  setActiveOpeningSource(openingSource);
                  if (openingSource === OpeningSource.Manual) {
                    trackEvent("import.skip_import");
                    state.quick((s) => {
                      s.hasCompletedRepertoireInitialization = true;
                      s.backToOverview();
                    });
                  }
                }}
                style={s(
                  c.maxWidth(100),
                  c.fullWidth,
                  c.selfEnd,
                  !isNil(openingSource)
                    ? c.buttons.primary
                    : c.buttons.primaryDisabled
                )}
              >
                Continue
              </Button>
            </View>
          </>
        )}
        {!isNil(activeOpeningSource) && (
          <View style={s(c.column, c.fullWidth)}>
            {!state.inProgressUsingPlayerTemplate && (
              <Pressable
                style={s(c.row, c.alignCenter, c.clickable, c.pl(4))}
                onPress={() => {
                  setActiveOpeningSource(null);
                }}
              >
                <i
                  className="fa-light fa-angle-left"
                  style={s(c.fg(c.grays[70]), c.fontSize(16))}
                />
                <Spacer width={6} />
                <CMText style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
                  Back
                </CMText>
              </Pressable>
            )}
            <Spacer height={12} />
            {activeOpeningSource === OpeningSource.Templates && (
              <>
                {!state.getIsRepertoireEmpty() && templatesWarningSection}
                <RepertoireTemplateWizard state={state} />
              </>
            )}
            {activeOpeningSource === OpeningSource.PlayerTemplates && (
              <>
                {!state.getIsRepertoireEmpty() && playerTemplatesWarningSection}
                <PlayerTemplateWizard state={state} />
              </>
            )}
            {activeOpeningSource == OpeningSource.Import && (
              <>
                {!state.getIsRepertoireEmpty() && pgnWarningSection}
                <ImportSection
                  isMobile={isMobile}
                  title="PGN"
                  description="If you have an opening repertoire with other software, you can export each side as a pgn and upload both here."
                  isValid={blackPgn || whitePgn}
                  submit={() => {
                    state.initializeRepertoire({
                      blackPgn,
                      whitePgn,
                    });
                    trackEvent("import.from_pgns");
                  }}
                >
                  <View style={s(c.row)}>
                    <DragAndDropInput
                      humanName="White Openings"
                      accept="*.pgn"
                      onUpload={async (e) => {
                        let file = e.target.files[0];
                        if (file) {
                          let body = await file.text();
                          setWhitePgn(body);
                          return true;
                        }
                      }}
                    />
                    <Spacer width={12} />
                    <DragAndDropInput
                      humanName="Black Openings"
                      accept="*.pgn"
                      onUpload={async (e) => {
                        let file = e.target.files[0];
                        if (file) {
                          let body = await file.text();
                          setBlackPgn(body);
                          return true;
                        }
                      }}
                    />
                  </View>
                </ImportSection>
                <Spacer height={12} />
                <ImportSection
                  isMobile={isMobile}
                  title="Lichess Games"
                  description="Parses your last 200 Lichess games, to see what openings you use. This is less accurate than a PGN file, so only use this if you can't get a PGN of your openings."
                  isValid={username}
                  submit={importFromLichessUsername}
                >
                  <View style={s(c.row)} key={"username"}>
                    <CMTextInput
                      placeholder="username"
                      value={username}
                      setValue={setUsername}
                    />
                  </View>
                </ImportSection>
              </>
            )}
          </View>
        )}
      </View>
      <Spacer height={0} grow />
    </>
  );
};

const ImportSection = ({
  title,
  submit,
  children,
  isValid,
  description,
  isMobile,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <View
      key={title}
      style={s(
        c.column,
        c.fullWidth,
        c.bg(c.grays[15]),
        c.px(12),
        c.py(12),
        c.br(2)
      )}
    >
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.weightSemiBold,
          c.selfStretch,
          c.fontSize(16)
        )}
      >
        {title}
      </CMText>
      <Spacer height={12} />
      <CMText style={s(c.fg(c.grays[75]), c.weightRegular, c.fontSize(12))}>
        {description}
      </CMText>
      <Spacer height={12} />
      {children}
      <Spacer height={isMobile ? 18 : 4} />
      <Button
        isLoading={isLoading}
        loaderProps={{ color: c.grays[75] }}
        style={s(
          isValid ? c.buttons.primary : c.buttons.primaryDisabled,
          c.py(8),
          c.selfEnd
        )}
        onPress={() => {
          setIsLoading(true);
          submit();
        }}
      >
        Import
      </Button>
    </View>
  );
};

const ImportOptions = ({
  state,
  openingSource,
  setOpeningSource,
}: {
  state: RepertoireState;
  openingSource: any;
  setOpeningSource;
}) => {
  return (
    <>
      {intersperse(
        [
          {
            title: "Player Repertoires",
            source: OpeningSource.PlayerTemplates,
            description: (
              <>
                Copy the repertoires of some famous chess streamers, like Daniel
                Naroditsky, Hikaru Nakamura, Levy Rozman, and Eric Rosen.
              </>
            ),
            buttonCopy: "Choose",
          },
          {
            title: "Templates",
            source: OpeningSource.Templates,
            description: state.hasCompletedRepertoireInitialization ? (
              <>Choose among some popular openings for both sides.</>
            ) : (
              <>
                Choose among some popular openings for both sides. An easy way
                to get started if you don't have any openings yet.
              </>
            ),
            buttonCopy: "Choose",
          },
          ...(!state.hasCompletedRepertoireInitialization
            ? [
                {
                  title: "From scratch",
                  buttonCopy: "Start",
                  source: OpeningSource.Manual,
                  description: (
                    <>
                      Create your opening from scratch. The quickest way to get
                      started, and you can always come back.
                    </>
                  ),
                },
              ]
            : []),
          {
            title: "Import",
            source: OpeningSource.Import,
            description: state.hasCompletedRepertoireInitialization ? (
              <>
                Import your existing opening repertoire from a pgn, or just
                provide your Lichess username and we'll figure it out from your
                recent games.
              </>
            ) : (
              <>
                Import your existing opening repertoire from a pgn, or just
                provide your Lichess username and we'll figure it out from your
                recent games.
              </>
            ),
            buttonCopy: "Import",
          },
        ].map((x, i) => {
          const selected = openingSource === x.source;
          return (
            <Pressable
              onPress={() => {
                setOpeningSource(x.source);
              }}
            >
              <View
                style={s(
                  c.row,
                  selected ? c.bg(c.grays[15]) : c.bg(c.grays[15]),
                  c.br(2),
                  c.overflowHidden,
                  c.px(12),
                  c.py(14)
                )}
              >
                <i
                  className={
                    selected ? "fas fa-circle" : "fa-regular fa-circle"
                  }
                  style={s(
                    c.fontSize(18),
                    c.fg(selected ? c.grays[80] : c.grays[50])
                  )}
                />
                <Spacer width={12} />
                <View style={s(c.column, c.flexible, c.mt(-1))}>
                  <View style={s()}>
                    <View style={s(c.row, c.justifyBetween)}>
                      <CMText
                        style={s(
                          c.fg(c.colors.textPrimary),
                          c.fontSize(16),
                          c.weightSemiBold
                        )}
                      >
                        {x.title}
                      </CMText>
                    </View>
                    <Spacer height={12} />
                    <CMText
                      style={s(
                        c.fg(c.grays[70]),
                        c.fontSize(13),
                        c.lineHeight("1.5em")
                      )}
                    >
                      {x.description}
                    </CMText>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}
    </>
  );
};

const WarningSection = ({ copy, title, isMobile }) => {
  return (
    <View
      style={s(
        c.row,
        c.alignStart,
        c.fullWidth,
        c.bg(c.grays[80]),
        c.px(12),
        c.py(12),
        c.br(2),
        c.mb(14)
      )}
    >
      <i
        className="fa fa-triangle-exclamation"
        style={s(c.fontSize(14), c.mt(2), c.fg(c.yellows[50]))}
      />
      <Spacer width={8} />
      <View style={s(c.column, c.flexible)}>
        <CMText style={s(c.fg(c.yellows[40]), c.fontSize(14), c.weightBold)}>
          {title}
        </CMText>
        <Spacer height={4} />
        <CMText
          style={s(
            c.fg(c.colors.textInverseSecondary),
            c.fontSize(isMobile ? 12 : 14)
          )}
        >
          {copy}
        </CMText>
      </View>
    </View>
  );
};
