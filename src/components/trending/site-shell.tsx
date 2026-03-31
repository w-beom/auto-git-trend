import type { SnapshotPageData } from "@/lib/snapshots/queries";

import { ArchiveDateList } from "@/components/trending/archive-date-list";
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
        <SnapshotHero snapshot={snapshot} mode={mode} />
        <TopThreeGrid highlights={snapshot.topThree} items={snapshot.items} />
        <RepositoryList items={snapshot.items} />
        {mode === "latest" && archiveDates.length > 0 ? (
          <ArchiveDateList dates={archiveDates} />
        ) : null}
      </div>
    </main>
  );
}
