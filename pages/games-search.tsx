import { GamesSearch } from "app/components/GamesSearch";
import { GAME_SEARCH_DESCRIPTION } from "app/components/NavBar";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <GamesSearch />

      <HeadSiteMeta
        siteMeta={{
          title: "Game Search",
          description: GAME_SEARCH_DESCRIPTION,
        }}
      />
    </>
  );
}
