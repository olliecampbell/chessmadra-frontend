import { OPENINGS_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";
import { RepertoireBuilder } from "app/components/RepertoireBuilder";

export default function Page() {
  return (
    <>
      <RepertoireBuilder />
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
    </>
  );
}
