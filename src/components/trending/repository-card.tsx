import type { SnapshotPageItem } from "@/lib/snapshots/queries";

interface RepositoryCardProps {
  item: SnapshotPageItem;
  variant?: "feature" | "list";
}

function getSummaryParagraphs(summary: string) {
  return summary
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatCount(value: number | null, label: string) {
  if (value === null) {
    return null;
  }

  return `${value.toLocaleString("en-US")} ${label}`;
}

export function RepositoryCard({
  item,
  variant = "list",
}: RepositoryCardProps) {
  const isFeature = variant === "feature";
  const summaryParagraphs = getSummaryParagraphs(item.summaryKo);

  return (
    <article className={`repo-card repo-card--${variant}`}>
      <div className="repo-card__content">
        <div className="repo-card__masthead">
          <span className={`rank-badge rank-badge--${variant}`}>
            {isFeature ? `TOP ${item.rank}` : `${item.rank}위`}
          </span>
          <span className="repo-card__owner">{`@${item.owner}`}</span>
        </div>

        <div className="repo-card__body">
          <p className="repo-card__fullname">{item.fullName}</p>
          <h3 className="repo-card__name">{item.name}</h3>
          <div className="repo-card__summary-block" role="group" aria-label="프로젝트 요약">
            {summaryParagraphs.map((paragraph) => (
              <p key={paragraph} className="repo-card__summary-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="repo-card__footer">
        <dl className="repo-card__meta" aria-label={`${item.fullName} 메타데이터`}>
          {item.starsTotal !== null ? (
            <div>
              <dt>누적 스타</dt>
              <dd>{formatCount(item.starsTotal, "stars")}</dd>
            </div>
          ) : null}
          {item.forksTotal !== null ? (
            <div>
              <dt>포크</dt>
              <dd>{formatCount(item.forksTotal, "forks")}</dd>
            </div>
          ) : null}
        </dl>

        <a
          className="action-link"
          href={item.githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={
            isFeature
              ? `${item.fullName} 하이라이트 GitHub에서 보기`
              : `${item.fullName} GitHub에서 보기`
          }
        >
          GitHub에서 보기
        </a>
      </div>
    </article>
  );
}
