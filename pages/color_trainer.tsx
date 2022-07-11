import { ColorTraining } from "app/components/ColorTraining";
import { COLOR_TRAINER_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <ColorTraining />
      <HeadSiteMeta
        siteMeta={{
          title: "Square Color Trainer",
          description: COLOR_TRAINER_DESCRIPTION,
        }}
      />
    </>
  );
}
