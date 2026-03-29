import type { SnapshotPageData } from "@/lib/snapshots/queries";

export function SnapshotEmptyState(props: { message: string }) {
  return (
    <section aria-live="polite">
      <p>{props.message}</p>
    </section>
  );
}

export function SnapshotPageView(props: {
  eyebrow: string;
  heading: string;
  snapshot: SnapshotPageData;
}) {
  const { snapshot } = props;

  return (
    <section aria-labelledby="snapshot-heading">
      <p>{props.eyebrow}</p>
      <h2 id="snapshot-heading">{props.heading}</h2>
      <p>{snapshot.snapshotDate}</p>
      <p>{snapshot.capturedAtLabel}</p>
      <p>{snapshot.totalCount} repositories captured</p>
      <ol>
        {snapshot.items.map((item) => (
          <li key={`${snapshot.snapshotDate}-${item.rank}`}>
            <article>
              <p>#{item.rank}</p>
              <h3>{item.fullName}</h3>
              {item.description ? <p>{item.description}</p> : null}
              <p>{item.summaryKo}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
