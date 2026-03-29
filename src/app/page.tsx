import { getLatestSnapshotPageData } from "@/lib/snapshots/queries";
import { EmptyState } from "@/components/trending/empty-state";
import { SiteShell } from "@/components/trending/site-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getLatestSnapshotPageData();

  if (!snapshot) {
    return (
      <EmptyState
        title="아직 오늘의 스냅샷이 도착하지 않았습니다"
        description="크론 수집이 끝나면 한국어 큐레이션과 함께 여기에 정리됩니다."
        kicker="DAILY SNAPSHOT"
      />
    );
  }

  return <SiteShell snapshot={snapshot} mode="latest" />;
}
