import { BlindfoldTrainer } from "app/components/BlindfoldTrainer";
import { BLINDFOLD_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <BlindfoldTrainer />
      <HeadSiteMeta
        siteMeta={{
          title: "Blindfold Puzzle Trainer",
          description: BLINDFOLD_DESCRIPTION,
        }}
      />
    </>
  );
}
