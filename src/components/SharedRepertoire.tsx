import { HeadSiteMeta, PageContainer } from "~/components/PageContainer";
import { SidebarLayout } from "~/components/RepertoireBrowsingView";
import React, { useEffect } from "react";
import { useRepertoireState } from "~/utils/app_state";
import { useSearchParams } from "react-router-dom";

export default function SharedRepertoireView() {
  const [fetchSharedRepertoire] = useRepertoireState((s) => [
    s.fetchSharedRepertoire,
  ]);
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("id");
  useEffect(() => {
    if (shareId) {
      fetchSharedRepertoire(shareId as string);
    }
  }, []);
  return (
    <>
      <PageContainer hideNavBar hideIcons>
        <SidebarLayout mode="build" shared />
      </PageContainer>
      <HeadSiteMeta
        siteMeta={{
          title: "Check out my openings",
          description: null,
        }}
      />
    </>
  );
}
