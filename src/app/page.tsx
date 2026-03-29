import { Suspense, use } from "react";

import {
  SnapshotEmptyState,
  SnapshotPageView,
} from "@/lib/snapshots/page-view";
import { getLatestSnapshotPageData } from "@/lib/snapshots/queries";

export const dynamic = "force-dynamic";

function LatestSnapshotSection() {
  const snapshot = use(getLatestSnapshotPageData());

  if (!snapshot) {
    return (
      <SnapshotEmptyState message="The latest GitHub Trending snapshot is not available yet." />
    );
  }

  return (
    <SnapshotPageView
      eyebrow="Latest snapshot"
      heading={`Trending snapshot for ${snapshot.snapshotDate}`}
      snapshot={snapshot}
    />
  );
}

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Auto Git Trend</p>
        <h1>Trending snapshots will render here later.</h1>
        <p className="lead">
          The base app is ready for the daily GitHub Trending pipeline and
          future archive views.
        </p>
      </section>
      <Suspense
        fallback={
          <SnapshotEmptyState message="The latest GitHub Trending snapshot is not available yet." />
        }
      >
        <LatestSnapshotSection />
      </Suspense>
    </main>
  );
}
