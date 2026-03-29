import type { SnapshotPageItem } from "@/lib/snapshots/queries";

import { RepositoryCard } from "@/components/trending/repository-card";

interface RepositoryListProps {
  items: SnapshotPageItem[];
}

export function RepositoryList({ items }: RepositoryListProps) {
  return (
    <section className="section-block" aria-labelledby="repository-list-heading">
      <div className="section-heading">
        <p className="section-kicker">FULL RANKING</p>
        <h2 id="repository-list-heading">전체 랭킹</h2>
      </div>
      <ol className="repository-list">
        {items.map((item) => (
          <li key={item.fullName}>
            <RepositoryCard item={item} />
          </li>
        ))}
      </ol>
    </section>
  );
}
