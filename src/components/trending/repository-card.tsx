import type { SnapshotPageItem } from "@/lib/snapshots/queries";

interface RepositoryCardProps {
  item: SnapshotPageItem;
  variant?: "feature" | "list";
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
  const supportingContext = item.readmeExcerpt ?? item.description;
  const isFeature = variant === "feature";

  return (
    <article className={`repo-card repo-card--${variant}`}>
      <div className="repo-card__masthead">
        <span className={`rank-badge rank-badge--${variant}`}>
          {isFeature ? `TOP ${item.rank}` : `${item.rank}위`}
        </span>
        <span className="repo-card__avatar" aria-hidden="true">
          {item.owner.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="repo-card__body">
        <p className="repo-card__fullname">{item.fullName}</p>
        <h3 className="repo-card__name">{item.name}</h3>
        <p className="repo-card__summary">{item.summaryKo}</p>
        {supportingContext ? (
          <p className="repo-card__supporting">{supportingContext}</p>
        ) : null}
      </div>

      <dl className="repo-card__meta" aria-label={`${item.fullName} 메타데이터`}>
        {item.primaryLanguage ? (
          <div>
            <dt>언어</dt>
            <dd>{item.primaryLanguage}</dd>
          </div>
        ) : null}
        {item.starsToday !== null ? (
          <div>
            <dt>오늘 증가</dt>
            <dd>{`+${item.starsToday.toLocaleString("en-US")} today`}</dd>
          </div>
        ) : null}
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
    </article>
  );
}
