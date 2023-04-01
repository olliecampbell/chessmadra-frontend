import { View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize, range } from "lodash-es";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { quick, useAdminState, useUserState } from "~/utils/app_state";
import React, { useEffect, useRef, useState } from "react";
import { createStaticChessState } from "~/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { MoveAnnotationReview } from "~/utils/models";
import { pluralize } from "~/utils/pluralize";
import { useOnScreen } from "~/utils/useIntersectionObserver";
import { LazyLoad } from "./LazyLoad";

export const ReviewMoveAnnotationsView = ({}) => {
  const isMobile = useIsMobile();
  const user = useUserState((s) => s.user);
  const [
    moveAnnotationReviewQueue,
    fetchMoveAnnotationReviewQueue,
    acceptMoveAnnotation,
    rejectMoveAnnotations,
  ] = useAdminState((s) => [
    s.moveAnnotationReviewQueue,
    s.fetchMoveAnnotationReviewQueue,
    s.acceptMoveAnnotation,
    s.rejectMoveAnnotations,
  ]);
  useEffect(() => {
    fetchMoveAnnotationReviewQueue();
  }, []);

  // TEST PERFORMANCE
  // if (!isEmpty(moveAnnotationReviewQueue)) {
  // moveAnnotationReviewQueue = range(50).flatMap(
  //   () => moveAnnotationReviewQueue
  // );
  // }

  return (
    <AdminPageLayout>
      {(() => {
        if (isNil(moveAnnotationReviewQueue)) {
          return <CMText style={s()}>Loading...</CMText>;
        }
        if (isEmpty(moveAnnotationReviewQueue)) {
          return (
            <CMText style={s()}>
              Looks like there's nothing left to review
            </CMText>
          );
        }
        return (
          <div style={s(c.gridColumn({ gap: 92 }))}>
            {moveAnnotationReviewQueue.map((review) => {
              return (
                <MoveAnnotationsReview
                  review={review}
                  key={`${review.epd}-${review.san}`}
                />
              );
            })}
          </div>
        );
      })()}
    </AdminPageLayout>
  );
};

const MoveAnnotationsReview = ({
  review,
}: {
  review: MoveAnnotationReview;
}) => {
  console.log("Epd is ", review.epd);
  const fen = `${review.epd} 0 1`;
  const position = new Chess(fen);
  const isMobile = useIsMobile();
  const user = useUserState((s) => s.user);
  const [
    moveAnnotationReviewQueue,
    fetchMoveAnnotationReviewQueue,
    acceptMoveAnnotation,
    rejectMoveAnnotations,
  ] = useAdminState((s) => [
    s.moveAnnotationReviewQueue,
    s.fetchMoveAnnotationReviewQueue,
    s.acceptMoveAnnotation,
    s.rejectMoveAnnotations,
  ]);
  const [reviewed, setReviewed] = createSignal(false);
  const ref = useRef(null);
  const onScreen = useOnScreen(ref, "-500px");
  return (
    <div style={s(isMobile ? c.column : c.row, c.constrainWidth, c.relative)}>
    <Show when={reviewed }>
        <div
          style={s(
            c.absoluteFull,
            c.bg(c.grays[20]),
            c.opacity(95),
            c.center,
            c.zIndex(2)
          )}
        >
          <CMText style={s()}>Reviewed!</CMText>
        </div>
        </Show>
      <div style={s(c.width(400), c.constrainWidth)} ref={ref}>
        <LazyLoad style={s(c.pb("100%"), c.height(0), c.width("100%"))}>
          <ChessboardView
            onSquarePress={() => {}}
            state={createStaticChessState({
              epd: review.epd,
            })}
          />
        </LazyLoad>
        <Button
          style={s(c.buttons.darkFloater)}
          onPress={() => {
            const windowReference = window.open("about:blank", "_blank");
            windowReference.location = `https://lichess.org/analysis/${review.epd}`;
          }}
        >
          <div style={s(c.size(isMobile ? 20 : 22))}>
            <LichessLogoIcon color={"white"} />
          </div>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.darkFloater.textStyles,
              c.fg("white"),
              c.weightRegular,
              c.fontSize(14)
            )}
          >
            Analyze on Lichess
          </CMText>
        </Button>
      </div>
      <Spacer width={24} />
      <div style={s(c.column, c.flexShrink(1))}>
        <CMText style={s(c.fontSize(24), c.weightBold)}>
          {capitalize(position.turn() === "b" ? "Black" : "White")} plays{" "}
          {review.san}
        </CMText>
        <Spacer height={12} />
        {intersperse(
          review.annotations.map((x, i) => {
            return (
              <div
                key={i}
                style={s(
                  c.pb(12),
                  c.fullWidth,
                  c.width(300),
                  c.bg(c.grays[80])
                )}
              >
                <div style={s(c.height(120))}>
                  <AnnotationEditor
                    key={`${review.san}-${review.epd}`}
                    annotation={x.text}
                    onUpdate={(v) => {
                      quick((s) => {
                        s.adminState.editMoveAnnotation({
                          epd: review.epd,
                          san: review.san,
                          userId: x.userId,
                          text: v,
                        });
                      });
                    }}
                  />
                </div>
                <Spacer height={12} />
                <div style={s(c.row, c.alignCenter, c.justifyBetween)}>
                  {x?.userId === user?.id ? (
                    <>
                      <CMText style={s(c.fg(c.grays[0]), c.px(12), c.caps)}>
                        mine
                      </CMText>
                      <Spacer height={12} />
                    </>
                  ) : (
                    <>
                      <CMText style={s(c.fg(c.grays[0]), c.px(12))}>
                        {x?.userEmail ?? "Anonymous"}
                      </CMText>
                    </>
                  )}
                  <Button
                    style={s(
                      c.buttons.basicSecondary,
                      c.py(8),
                      c.mr(12),
                      c.px(16),
                      {
                        textStyles: s(
                          c.buttons.basicSecondary.textStyles,
                          c.fontSize(14),
                          c.fg(c.grays[90])
                        ),
                      },
                      c.selfEnd
                    )}
                    onPress={() => {
                      acceptMoveAnnotation(review.epd, review.san, x.text);
                      setReviewed(true);
                    }}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            );
          }),
          (i) => {
            return <Spacer height={12} key={i} />;
          }
        )}
        <Spacer height={14} />
        <Button
          style={s(
            c.buttons.primary,
            c.py(8),
            c.bg(c.failureShades[45]),
            c.px(16),
            {
              textStyles: s(
                c.buttons.basicSecondary.textStyles,
                c.fontSize(14),
                c.fg(c.grays[90])
              ),
            },
            c.selfEnd
          )}
          onPress={() => {
            rejectMoveAnnotations(review.epd, review.san);
            setReviewed(true);
          }}
        >
          {`Reject ${pluralize(review.annotations.length, "annotation")}`}
        </Button>
      </div>
    </div>
  );
};
