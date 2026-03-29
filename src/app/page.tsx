import { Suspense, use } from "react";

import { getLatestSnapshotPageData } from "@/lib/snapshots/queries";

export const dynamic = "force-dynamic";

function HomeEmptyState() {
  return (
    <section className="hero" aria-live="polite">
      <p className="eyebrow">Auto Git Trend</p>
      <h1>Trending snapshots will render here later.</h1>
      <p className="lead">
        The base app is ready for the daily GitHub Trending pipeline and future
        archive views.
      </p>
      <p>The latest GitHub Trending snapshot is not available yet.</p>
    </section>
  );
}

function LatestSnapshotSection() {
  const snapshot = use(getLatestSnapshotPageData());

  if (!snapshot) {
    return <HomeEmptyState />;
  }

  return (
    <section aria-labelledby="snapshot-heading">
      <h1 id="snapshot-heading">Trending snapshot for {snapshot.snapshotDate}</h1>
      <p>{snapshot.capturedAtLabel}</p>
      <p>{snapshot.totalCount} repositories captured</p>
      <ol>
        {snapshot.items.map((item) => (
          <li key={`${snapshot.snapshotDate}-${item.rank}`}>
            <article>
              <p>#{item.rank}</p>
              <h2>{item.fullName}</h2>
              {item.description ? <p>{item.description}</p> : null}
              <p>{item.summaryKo}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="page">
      <Suspense fallback={<HomeEmptyState />}>
        <LatestSnapshotSection />
      </Suspense>
    </main>
  );
}
