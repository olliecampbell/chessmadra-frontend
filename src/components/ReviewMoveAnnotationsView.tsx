import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize, noop } from "lodash-es";
import { Button } from "~/components/Button";
import { useIsMobileV2 } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { quick, useAdminState, useUserState } from "~/utils/app_state";
import { Chess } from "@lubert/chess.ts";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { MoveAnnotationReview } from "~/utils/models";
import { pluralize } from "~/utils/pluralize";
import { LazyLoad } from "./LazyLoad";
import { createSignal, For, onMount, Show } from "solid-js";
import { createStaticChessState } from "~/utils/chessboard_interface";

export const ReviewMoveAnnotationsView = (props: any) => {
  const [moveAnnotationReviewQueue, fetchMoveAnnotationReviewQueue] =
    useAdminState((s) => [
      s.moveAnnotationReviewQueue,
      s.fetchMoveAnnotationReviewQueue,
    ]);
  onMount(() => {
    fetchMoveAnnotationReviewQueue();
  });

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
            <For each={moveAnnotationReviewQueue()}>
              {(review) => <MoveAnnotationsReview review={review} />}
            </For>
          </div>
        );
      })()}
    </AdminPageLayout>
  );
};

const MoveAnnotationsReview = (props: { review: MoveAnnotationReview }) => {
  console.log("Epd is ", props.review.epd);
  const fen = `${props.review.epd} 0 1`;
  const position = new Chess(fen);
  const isMobile = useIsMobileV2();
  const [user] = useUserState((s) => [s.user]);
  const [acceptMoveAnnotation, rejectMoveAnnotations] = useAdminState((s) => [
    s.acceptMoveAnnotation,
    s.rejectMoveAnnotations,
  ]);
  const [reviewed, setReviewed] = createSignal(false);
  return (
    <div style={s(isMobile() ? c.column : c.row, c.constrainWidth, c.relative)}>
      <Show when={reviewed}>
        <div
          style={s(
            c.absoluteFull,
            c.bg(c.gray[20]),
            c.opacity(95),
            c.center,
            c.zIndex(2),
          )}
        >
          <CMText style={s()}>Reviewed!</CMText>
        </div>
      </Show>
      <div style={s(c.width(400), c.constrainWidth)}>
        <LazyLoad style={s(c.pb("100%"), c.height(0), c.width("100%"))}>
          <ChessboardView
            onSquarePress={noop}
            chessboardInterface={createStaticChessState({
              epd: props.review.epd,
              side: "white",
              nextMove: undefined,
            })}
          />
        </LazyLoad>
        <Button
          style={s(c.buttons.darkFloater)}
          onPress={() => {
            const windowReference = window.open("about:blank", "_blank");
            if (windowReference) {
              windowReference.location = `https://lichess.org/analysis/${props.review.epd}`;
            }
          }}
        >
          <div style={s(c.size(isMobile() ? 20 : 22))}>
            <LichessLogoIcon color={"white"} />
          </div>
          <Spacer width={8} />
          <CMText
            style={s(
              c.buttons.darkFloater.textStyles,
              c.fg("white"),
              c.weightRegular,
              c.fontSize(14),
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
          {props.review.san}
        </CMText>
        <Spacer height={12} />
        {intersperse(
          props.review.annotations.map((x, i) => {
            return (
              <div
                style={s(c.pb(12), c.fullWidth, c.width(300), c.bg(c.gray[80]))}
              >
                <div style={s(c.height(120))}>
                  <AnnotationEditor
                    annotation={() => x.text}
                    onUpdate={(v) => {
                      quick((s) => {
                        s.adminState.editMoveAnnotation({
                          epd: props.review.epd,
                          san: props.review.san,
                          userId: x.userId,
                          text: v,
                        });
                      });
                    }}
                  />
                </div>
                <Spacer height={12} />
                <div style={s(c.row, c.alignCenter, c.justifyBetween)}>
                  {x?.userId === user()?.id ? (
                    <>
                      <CMText style={s(c.fg(c.gray[0]), c.px(12), c.caps)}>
                        mine
                      </CMText>
                      <Spacer height={12} />
                    </>
                  ) : (
                    <>
                      <CMText style={s(c.fg(c.gray[0]), c.px(12))}>
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
                          c.fg(c.gray[90]),
                        ),
                      },
                      c.selfEnd,
                    )}
                    onPress={() => {
                      acceptMoveAnnotation(
                        // @ts-ignore
                        props.review.epd,
                        props.review.san,
                        x.text,
                      );
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
            return <Spacer height={12} />;
          },
        )}
        <Spacer height={14} />
        <Button
          style={s(
            c.buttons.primary,
            c.py(8),
            c.bg(c.red[45]),
            c.px(16),
            {
              textStyles: s(
                c.buttons.basicSecondary.textStyles,
                c.fontSize(14),
                c.fg(c.gray[90]),
              ),
            },
            c.selfEnd,
          )}
          onPress={() => {
            rejectMoveAnnotations()(props.review.epd, props.review.san);
            setReviewed(true);
          }}
        >
          {`Reject ${pluralize(props.review.annotations.length, "annotation")}`}
        </Button>
      </div>
    </div>
  );
};
