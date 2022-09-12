import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { useRepertoireState } from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";

export const RepertoireReview = (props: {}) => {
  const isMobile = useIsMobile();
  const [
    chessboardState,
    backToOverview,
    showNext,
    setupNextMove,
    giveUp,
    quick,
    completedReviewPositionMoves,
    remainingReviewPositionMoves,
    currentMove,
    isReviewing,
    repertoire,
  ] = useRepertoireState((s) => [
    s.chessboardState,
    s.backToOverview,
    s.showNext,
    s.setupNextMove,
    s.giveUp,
    s.quick,
    s.completedReviewPositionMoves,
    s.getRemainingReviewPositionMoves(),
    s.currentMove,
    s.isReviewing,
    s.repertoire,
  ]);
  useEffect(() => {
    if (!isReviewing && repertoire) {
      quick((s) => {
        s.startReview();
      });
    }
  }, [repertoire]);
  return (
    <RepertoirePageLayout>
      <TrainerLayout
        containerStyles={s(isMobile ? c.alignCenter : c.alignStart)}
        chessboard={
          <ChessboardView
            {...{
              state: chessboardState,
            }}
          />
        }
      >
        <Spacer height={12} />
        <CMText
          style={s(
            c.fg(c.colors.textPrimary),
            c.weightSemiBold,
            c.fontSize(14)
          )}
        >
          {currentMove?.moves.length === 1
            ? "Play the correct response on the board"
            : `You have ${currentMove?.moves.length} responses to this position in your repertoire. Play all your responses on the board`}
        </CMText>
        <Spacer height={12} />
        {currentMove?.moves.length > 1 && (
          <>
            <View
              style={s(
                c.row,
                c.overflowHidden,
                c.fullWidth,
                c.height(12),
                c.round,
                c.alignStretch,
                c.border(`1px solid ${c.grays[20]}`)
              )}
            >
              {intersperse(
                sortBy(currentMove.moves, (m) =>
                  isNil(completedReviewPositionMoves[m.sanPlus])
                ).map((x, i) => {
                  let hasCompleted = !isNil(
                    completedReviewPositionMoves[x.sanPlus]
                  );
                  return (
                    <View
                      style={s(
                        hasCompleted ? c.bg(c.grays[80]) : c.bg(c.grays[10]),
                        c.grow
                      )}
                    ></View>
                  );
                }),
                (i) => {
                  return (
                    <View
                      style={s(c.width(1), c.bg(c.grays[20]), c.fullHeight)}
                    ></View>
                  );
                }
              )}
            </View>
            <Spacer height={12} />
          </>
        )}
        <View style={s(c.row)}>
          <Button
            style={s(
              c.buttons.squareBasicButtons,
              c.buttons.basicInverse,
              c.height("unset"),
              c.selfStretch
            )}
            onPress={() => {
              quick((s) => {
                trackEvent(`reviewing.inspect_line`);
                let qm = s.currentMove;
                s.backToOverview();
                s.startEditing(qm.moves[0].side);
                s.chessboardState.playPgn(qm.line);
              });
            }}
          >
            <CMText style={s(c.buttons.basicInverse.textStyles)}>
              <i className="fa fa-search" />
            </CMText>
          </Button>
          <Spacer width={8} />
          <Button
            style={s(
              showNext ? c.buttons.primary : c.buttons.basicInverse,
              c.grow
            )}
            onPress={() => {
              if (showNext) {
                setupNextMove();
              } else {
                trackEvent(`reviewing.give_up`);
                giveUp();
              }
            }}
          >
            <CMText
              style={s(
                showNext
                  ? c.buttons.primary.textStyles
                  : c.buttons.basicInverse.textStyles
              )}
            >
              {showNext ? "Next" : "I don't know"}
            </CMText>
          </Button>
        </View>
      </TrainerLayout>
    </RepertoirePageLayout>
  );
};
