import { Pressable, View } from "react-native";
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
import React, { useEffect, useState } from "react";
import { createStaticChessState } from "app/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { AdminPageLayout } from "./AdminPageLayout";
import { AnnotationEditor } from "./AnnotationEditor";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { AdminMoveAnnotation } from "app/utils/admin_state";
import { SelectOneOf } from "./SelectOneOf";
import { Link } from "react-router-dom";

export const MoveAnnotationsDashboard = ({}) => {
  const isMobile = useIsMobile();
  const user = useUserState((s) => s.user);
  const [dashboard] = useAdminState((s) => [s.moveAnnotationsDashboard]);
  const [activeTab, setActiveTab] = useState("Needed");
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
          <View style={s(c.column)}>
            <CMText style={s(c.weightSemiBold, c.selfEnd)}>
              <Link to="/admin/move-annotations/community">
                Go to community review queue
                <Spacer width={8} />
                <i className="fa fa-arrow-right" style={s()} />
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
            <View key={activeTab} style={s(c.gridColumn({ gap: 24 }))}>
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
            </View>
          </View>
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
  let fen = `${ann.previousEpd} 0 1`;
  let position = new Chess(fen);
  let [annotation, setAnnotation] = useState(ann.annotation?.text ?? "");
  return (
    <View style={s(c.bg(c.grays[30]), c.br(2), c.px(12), c.py(12), c.column)}>
      <View style={s(c.row)}>
        <View style={s(c.size(180))}>
          <ChessboardView
            onSquarePress={() => {}}
            state={createStaticChessState({
              epd: ann.previousEpd,
              side: position.turn() === "b" ? "black" : "white",
              nextMove: ann.sanPlus,
            })}
          />
        </View>

        <Spacer width={24} />
        <View style={s(c.width(400))}>
          <AnnotationEditor annotation={annotation} onUpdate={setAnnotation} />
        </View>
      </View>
      {completed && (
        <>
          <Spacer height={8} />
          <CMText style={s()}>
            Reviewer: {ann.reviewerEmail ?? "me@mbuffett.com"}
          </CMText>
        </>
      )}
      <Spacer height={8} />
      <View style={s(c.row, c.justifyEnd)}>
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
            quick((s) =>
              s.adminState.acceptMoveAnnotation(
                ann.previousEpd,
                ann.sanPlus,
                annotation
              )
            );
          }}
        >
          Save
        </Button>
      </View>
    </View>
  );
};
