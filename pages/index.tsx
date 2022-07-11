import { Directory } from "app/components/Directory";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <Directory />
      <HeadSiteMeta
        siteMeta={{
          title: "Chess Madra",
          description:
            "Build your opening repertoire. Improve your visualization. Train your tactics. Search for games. And more.",
        }}
      />
    </>
  );
}
