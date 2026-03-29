import { getLatestSnapshotPageData } from "@/lib/snapshots/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getLatestSnapshotPageData();

  if (!snapshot) {
    return (
      <main className="page">
        <section aria-live="polite">
          <p>The latest GitHub Trending snapshot is not available yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
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
    </main>
  );
}
