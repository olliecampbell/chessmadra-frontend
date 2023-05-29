import { useResponsive } from "~/utils/useResponsive";
import { CMText } from "../CMText";
import { quick } from "~/utils/app_state";
import { SidebarTemplate } from "../SidebarTemplate";
import { Spacer } from "../Space";
import { VisualizationTraining } from "../VisualizationTraining";
import { LoginSidebar } from "../LoginSidebar";

export const OpeningTrainerRedirect = () => {
  const responsive = useResponsive();
  return (
    <SidebarTemplate
      header="The opening builder has moved!"
      bodyPadding={true}
      actions={[
        {
          onPress: () => {
            quick((s) => {
              window.location.href = "https://chessbook.com/";
            });
          },
          style: "focus",
          text: "Take me there",
        },
        {
          onPress: () => {
            quick((s) => {
              s.trainersState.pushView(LoginSidebar, {
                props: { authType: "register" },
              });
            });
          },
          style: "primary",
          text: "Create an account first",
        },
      ]}
    >
      <p class={"body-text"}>
        This has moved over to <a href="https://chessbook.com/">Chessbook</a>!
        If you have a repertoire that you haven't saved to an account yet, you
        should create an account first.
      </p>
      <Spacer height={12} />
    </SidebarTemplate>
  );
};
