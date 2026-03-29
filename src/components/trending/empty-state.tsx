interface EmptyStateProps {
  title: string;
  description: string;
  kicker?: string;
  href?: string;
  linkLabel?: string;
}

export function EmptyState({
  title,
  description,
  kicker = "AUTO GIT TREND",
  href,
  linkLabel,
}: EmptyStateProps) {
  return (
    <main className="site-shell empty-shell">
      <section className="empty-state" aria-live="polite">
        <p className="section-kicker">{kicker}</p>
        <h1 className="empty-state__title">{title}</h1>
        <p className="empty-state__description">{description}</p>
        {href && linkLabel ? (
          <a className="action-link" href={href}>
            {linkLabel}
          </a>
        ) : null}
      </section>
    </main>
  );
}
