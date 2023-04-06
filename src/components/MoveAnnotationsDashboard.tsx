import { Pressable } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { isEmpty, isNil } from "lodash-es";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "./CMText";
import { quick, useAdminState, useUserState } from "~/utils/app_state";
import React, { useEffect } from "react";
import { createStaticChessState } from "~/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { AdminMoveAnnotation } from "~/utils/admin_state";
import { SelectOneOf } from "./SelectOneOf";
import { Link } from "react-router-dom";

export const MoveAnnotationsDashboard = ({}) => {
  const isMobile = useIsMobile();
  const user = useUserState((s) => s.user);
  const [dashboard] = useAdminState((s) => [s.moveAnnotationsDashboard]);
  const [activeTab, setActiveTab] = createSignal("Needed");
  useEffect(() => {
    quick((s) => s.adminState.fetchMoveAnnotationDashboard());
  }, []);
  return (
    <AdminPageLayout>
      {(() => {
        if (isNil(dashboard)) {
          return <CMText style={s()}>Loading...</CMText>;
        }
        if (isEmpty(dashboard)) {
          return (
            <CMText style={s()}>
              Looks like there's nothing left to review
            </CMText>
          );
        }
        return (
          <div style={s(c.column)}>
            <CMText style={s(c.weightSemiBold, c.selfEnd)}>
              <Link to="/admin/move-annotations/community">
                Go to community review queue
                <Spacer width={8} />
                <i class="fa fa-arrow-right" style={s()} />
              </Link>
            </CMText>
            <Spacer height={32} />
            <SelectOneOf
              tabStyle
              containerStyles={s(c.fullWidth, c.justifyBetween)}
              choices={["Needed", "Completed"]}
              activeChoice={activeTab}
              horizontal
              onSelect={(tab) => {}}
              renderChoice={(tab, active) => {
                return (
                  <Pressable
                    onPress={() => {
                      quick((s) => {
                        setActiveTab(tab);
                      });
                    }}
                    style={s(
                      c.column,
                      c.grow,
                      c.alignCenter,
                      c.borderBottom(
                        `2px solid ${active ? c.grays[90] : c.grays[20]}`
                      ),
                      c.zIndex(5),
                      c.pb(8)
                    )}
                  >
                    <CMText
                      style={s(
                        c.fg(
                          active ? c.colors.textPrimary : c.colors.textSecondary
                        ),
                        c.fontSize(16),
                        c.weightBold
                      )}
                    >
                      {tab === "Needed" ? "Most needed" : "Completed"}
                    </CMText>
                  </Pressable>
                );
              }}
            />
            <div key={activeTab} style={s(c.gridColumn({ gap: 24 }))}>
              <Spacer height={24} />
              {(activeTab === "Needed"
                ? dashboard.needed
                : dashboard.completed
              ).map((ann) => {
                return (
                  <MoveAnnotationRow
                    key={ann.previousEpd + ann.sanPlus + ann.epd ?? ""}
                    completed={activeTab === "Completed"}
                    annotation={ann}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}
    </AdminPageLayout>
  );
};

export const MoveAnnotationRow = ({
  annotation: ann,
  completed,
}: {
  annotation: AdminMoveAnnotation;
  completed: boolean;
}) => {
  const fen = `${ann.previousEpd} 0 1`;
  const position = new Chess(fen);
  const [annotation, setAnnotation] = createSignal(ann.annotation?.text ?? "");
  const [saved, setSaved] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  return (
    <div style={s(c.bg(c.grays[30]), c.br(2), c.px(12), c.py(12), c.column)}>
      <div style={s(c.row)}>
        <div style={s(c.size(180))}>
          <ChessboardView
            onSquarePress={() => {}}
            state={createStaticChessState({
              epd: ann.previousEpd,
              side: position.turn() === "b" ? "black" : "white",
              nextMove: ann.sanPlus,
            })}
          />
        </div>

        <Spacer width={24} />
        <div style={s(c.width(400))}>
          <AnnotationEditor annotation={annotation} onUpdate={setAnnotation} />
        </div>
      </div>
      <Show when={completed }>
        <>
          <Spacer height={8} />
          <CMText style={s()}>
            Reviewer: {ann.reviewerEmail ?? "me@mbuffett.com"}
          </CMText>
        </>
        </Show>
      <Spacer height={8} />
      <div style={s(c.row, c.justifyEnd)}>
        <CMText style={s()}>{ann.games.toLocaleString()} games</CMText>
        <Spacer grow />
        <Button
          style={s(c.buttons.basic, c.selfEnd)}
          onPress={() => {
            quick((s) =>
              s.repertoireState.analyzeMoveOnLichess(
                fen,
                ann.sanPlus,
                position.turn() === "b" ? "black" : "white"
              )
            );
          }}
        >
          Analyze on lichess
        </Button>
        <Spacer width={12} />
        <Button
          style={s(c.buttons.primary, c.selfEnd)}
          onPress={() => {
            setLoading(true);
            quick((s) =>
              s.adminState
                .acceptMoveAnnotation(ann.previousEpd, ann.sanPlus, annotation)
                .then(() => {
                  setSaved(true);
                  setLoading(false);
                })
            );
          }}
        >
          <CMText style={s(c.buttons.primary.textStyles)}>
          <Show when={saved }>
              <i
                class="fa fa-check"
                style={s(c.fg(c.grays[90]), c.mr(4))}
              />
              </Show>
            {loading ? "Loading.." : saved ? "Saved" : "Save"}
          </CMText>
        </Button>
      </div>
    </div>
  );
};
