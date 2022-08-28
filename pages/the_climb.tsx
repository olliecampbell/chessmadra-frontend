import { CLIMB_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";
import { TheClimb } from "app/components/TheClimb";

export default function Page() {
  return (
    <>
      <TheClimb />
      <HeadSiteMeta
        siteMeta={{
          title: "The Climb",
          description: CLIMB_DESCRIPTION,
        }}
      />
    </>
  );
}
