import { GameMemorization } from "app/components/GameMemorization";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <GameMemorization />
      <HeadSiteMeta
        siteMeta={{
          title: "Game Memorization",
          description: "TODO",
        }}
      />
    </>
  );
}
