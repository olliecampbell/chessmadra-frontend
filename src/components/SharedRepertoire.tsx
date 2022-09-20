import { HeadSiteMeta, PageContainer } from "app/components/PageContainer";
import { RepertoireBrowsingView } from "app/components/RepertoireBrowsingView";
import React, { useEffect } from "react";
import { useRepertoireState } from "app/utils/app_state";
import { useSearchParams } from "react-router-dom";

export default function SharedRepertoireView() {
  const [fetchSharedRepertoire] = useRepertoireState((s) => [
    s.fetchSharedRepertoire,
  ]);
  const [searchParams] = useSearchParams();
  let shareId = searchParams.get("id");
  useEffect(() => {
    if (shareId) {
      fetchSharedRepertoire(shareId as string);
    }
  }, []);
  return (
    <>
      <PageContainer hideNavBar hideIcons>
        <RepertoireBrowsingView shared />
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
