import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { quick, useAdminState, useUserState } from "app/utils/app_state";
import React, { useEffect } from "react";
import { createStaticChessState } from "app/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";

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
        let review = moveAnnotationReviewQueue[0];
        console.log("Epd is ", review.epd);
        let fen = `${review.epd} 0 1`;
        let position = new Chess(fen);
        return (
          <View style={s(isMobile ? c.column : c.row, c.constrainWidth)}>
            <View style={s(c.size(400), c.constrainWidth)}>
              <ChessboardView
                onSquarePress={() => {}}
                state={createStaticChessState({
                  epd: review.epd,
                })}
              />
              <Button
                style={s(c.buttons.darkFloater)}
                onPress={() => {
                  var windowReference = window.open("about:blank", "_blank");
                  windowReference.location = `https://lichess.org/analysis/${review.epd}`;
                }}
              >
                <View style={s(c.size(isMobile ? 20 : 22))}>
                  <LichessLogoIcon color={"white"} />
                </View>
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
            </View>
            <Spacer width={24} />
            <View style={s(c.column, c.flexShrink(1))}>
              <CMText style={s(c.fontSize(24), c.weightBold)}>
                {capitalize(position.turn() === "b" ? "Black" : "White")} plays{" "}
                {review.san}
              </CMText>
              <Spacer height={12} />
              {intersperse(
                review.annotations.map((x, i) => {
                  return (
                    <View
                      key={i}
                      style={s(
                        c.pb(12),
                        c.fullWidth,
                        c.width(300),
                        c.bg(c.grays[80])
                      )}
                    >
                      <View style={s(c.height(120))}>
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
                      </View>
                      <Spacer height={12} />
                      {x.userId === user.id && (
                        <>
                          <CMText style={s(c.fg(c.grays[0]), c.px(12), c.caps)}>
                            mine
                          </CMText>
                          <Spacer height={12} />
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
                          acceptMoveAnnotation(
                            review.epd,
                            review.san,
                            x.userId
                          );
                        }}
                      >
                        Accept
                      </Button>
                    </View>
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
                }}
              >
                Reject all
              </Button>
            </View>
          </View>
        );
      })()}
    </AdminPageLayout>
  );
};
