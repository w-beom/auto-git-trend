import type { SnapshotPageItem } from "@/lib/snapshots/queries";

import { RepositoryCard } from "@/components/trending/repository-card";

interface TopThreeGridProps {
  items: SnapshotPageItem[];
}

export function TopThreeGrid({ items }: TopThreeGridProps) {
  const topItems = items.slice(0, 3);

  if (topItems.length === 0) {
    return null;
  }

  return (
    <section className="section-block" aria-labelledby="top-three-heading">
      <div className="section-heading">
        <p className="section-kicker">EDITORS PICK</p>
        <h2 id="top-three-heading">오늘의 톱 3</h2>
      </div>
      <div className="top-three-grid">
        {topItems.map((item) => (
          <RepositoryCard
            key={`top-${item.fullName}`}
            item={item}
            variant="feature"
          />
        ))}
      </div>
    </section>
  );
}
