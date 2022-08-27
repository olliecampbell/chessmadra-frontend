import { HeadSiteMeta, PageContainer } from "app/components/PageContainer";
import { RepertoireBrowsingView } from "app/components/RepertoireBrowsingView";
import { useRepertoireState } from "app/utils/repertoire_state";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

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
      <PageContainer>
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
