import type { SnapshotHighlight, SnapshotPageItem } from "@/lib/snapshots/queries";

import { TopThreeCard } from "@/components/trending/top-three-card";

interface TopThreeGridProps {
  highlights: SnapshotHighlight[];
  items: SnapshotPageItem[];
}

export function TopThreeGrid({
  highlights,
  items,
}: TopThreeGridProps) {
  const topItems = highlights
    .map((highlight) =>
      items.find((item) => item.fullName === highlight.fullName),
    )
    .filter((item): item is SnapshotPageItem => item !== undefined);

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
          <TopThreeCard key={`top-${item.fullName}`} item={item} />
        ))}
      </div>
    </section>
  );
}
