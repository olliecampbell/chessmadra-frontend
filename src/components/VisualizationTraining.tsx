import React, { useEffect } from "react";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { TrainerLayout } from "~/components/TrainerLayout";
import { useVisualizationTraining } from "../utils/useVisualizationTraining";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { useVisualizationState } from "~/utils/app_state";
import { VISUALIZE_DESCRIPTION } from "./NavBar";
import { trackModule } from "~/utils/user_state";

export const VisualizationTraining = () => {
  const state = useVisualizationState((s) => s);
  const { chessboardProps, ui } = useVisualizationTraining({ state });
  useEffect(() => {
    trackModule("visualization");
  }, []);
  useEffect(() => {
    state.refreshPuzzle();
  }, []);
  return (
    <PageContainer>
      <TrainerLayout chessboard={<ChessboardView {...chessboardProps} />}>
        {ui}
      </TrainerLayout>
      <HeadSiteMeta
        siteMeta={{
          title: "Visualization Training",
          description: VISUALIZE_DESCRIPTION,
        }}
      />
    </PageContainer>
  );
};
