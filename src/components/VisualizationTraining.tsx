import React, { useEffect } from "react";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { TrainerLayout } from "app/components/TrainerLayout";
import { useVisualizationTraining } from "../utils/useVisualizationTraining";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { useVisualizationState } from "app/utils/app_state";
import { VISUALIZE_DESCRIPTION } from "./NavBar";
import { trackModule } from "app/utils/user_state";

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
