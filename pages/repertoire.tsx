import { HeadSiteMeta, PageContainer } from "app/components/PageContainer";
import { RepertoireBrowsingView } from "app/components/RepertoireBrowsingView";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useRepertoireState } from "app/utils/app_state";

export default function Page() {
  const [fetchSharedRepertoire] = useRepertoireState((s) => [
    s.fetchSharedRepertoire,
  ]);
  const router = useRouter();
  const { id: shareId } = router.query;
  useEffect(() => {
    fetchSharedRepertoire(shareId as string);
  }, []);
  return (
    <>
      <PageContainer hideNavBar hideIcons>
        <RepertoireBrowsingView />
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
