import { useResponsive } from "~/utils/useResponsive";
import { quick } from "~/utils/app_state";
import { SidebarTemplate } from "../SidebarTemplate";
import { Spacer } from "../Space";
import { VisualizationTraining } from "../VisualizationTraining";
import { OpeningTrainerRedirect } from "./OpeningTrainerRedirect";

export const DirectorySidebar = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      header="Welcome to Chess Madra!"
      bodyPadding={true}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              s.trainersState.pushView(VisualizationTraining);
            });
          },
          style: "wide",
          text: "Visualization",
        },
        {
          onPress: () => {
            quick((s) => {
              s.trainersState.pushView(OpeningTrainerRedirect);
            });
          },
          style: "wide",
          text: "Opening Builder",
        },
      ]}
    >
      <p class={"body-text"}>Check out some of our training tools!</p>
      <Spacer height={12} />
    </SidebarTemplate>
  );
};
