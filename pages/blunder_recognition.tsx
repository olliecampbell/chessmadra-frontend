import { BlunderRecognition } from "app/components/BlunderRecognition";
import { BLUNDER_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <BlunderRecognition />
      <HeadSiteMeta
        siteMeta={{
          title: "Blunder Recognition Training",
          description: BLUNDER_DESCRIPTION,
        }}
      />
    </>
  );
}
