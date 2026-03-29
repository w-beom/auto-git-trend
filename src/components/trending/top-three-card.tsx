import type { SnapshotPageItem } from "@/lib/snapshots/queries";

interface TopThreeCardProps {
  item: SnapshotPageItem;
}

function formatCount(value: number | null, label: string) {
  if (value === null) {
    return null;
  }

  return `${value.toLocaleString("en-US")} ${label}`;
}

function getLeadSummary(summary: string) {
  const lead = getSummaryParagraphs(summary)
    .find(Boolean);

  return lead ?? summary.trim();
}

function getSummaryParagraphs(summary: string) {
  return summary
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function TopThreeCard({ item }: TopThreeCardProps) {
  const leadSummary = getLeadSummary(item.summaryKo);
  const featureMeta = [
    item.starsTotal !== null
      ? { label: "누적 스타", value: formatCount(item.starsTotal, "stars") }
      : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  return (
    <article className="top-card">
      <div className="top-card__masthead">
        <span className="rank-badge rank-badge--feature">{`TOP ${item.rank}`}</span>
        <span className="top-card__owner">{`@${item.owner}`}</span>
      </div>

      <div className="top-card__body">
        <p className="top-card__fullname">{item.fullName}</p>
        <h3 className="top-card__name">{item.name}</h3>
        <div className="top-card__summary-block" role="group" aria-label="하이라이트 요약">
          <p className="top-card__summary">{leadSummary}</p>
        </div>
      </div>

      <div className="top-card__footer">
        {featureMeta.length > 0 ? (
          <dl className="top-card__meta" aria-label={`${item.fullName} 핵심 메타데이터`}>
            {featureMeta.map((entry) => (
              <div key={entry.label}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <a
          className="action-link"
          href={item.githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.fullName} 하이라이트 GitHub에서 보기`}
        >
          GitHub에서 보기
        </a>
      </div>
    </article>
  );
}
