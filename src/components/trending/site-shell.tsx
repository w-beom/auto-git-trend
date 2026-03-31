import type { SnapshotPageData } from "@/lib/snapshots/queries";

import { RepositoryList } from "@/components/trending/repository-list";
import { SnapshotHero } from "@/components/trending/snapshot-hero";
import { TopThreeGrid } from "@/components/trending/top-three-grid";

interface SiteShellProps {
  snapshot: SnapshotPageData;
  archiveDates?: string[];
  mode?: "latest" | "archive";
}

export function SiteShell({
  snapshot,
  archiveDates = [],
  mode = "latest",
}: SiteShellProps) {
  return (
    <main className="site-shell">
      <div className="poster-grid">
        <SnapshotHero snapshot={snapshot} archiveDates={archiveDates} mode={mode} />
        <TopThreeGrid highlights={snapshot.topThree} items={snapshot.items} />
        <RepositoryList items={snapshot.items} />
      </div>
    </main>
  );
}
