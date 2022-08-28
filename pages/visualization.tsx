import { VISUALIZE_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";
import { VisualizationTraining } from "app/components/VisualizationTraining";

export default function Page() {
  return (
    <>
      <VisualizationTraining />
      <HeadSiteMeta
        siteMeta={{
          title: "Visualization Training",
          description: VISUALIZE_DESCRIPTION,
        }}
      />
    </>
  );
}
