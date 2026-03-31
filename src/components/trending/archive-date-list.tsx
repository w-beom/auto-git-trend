import Link from "next/link";

interface ArchiveDateListProps {
  dates: string[];
}

export function ArchiveDateList({ dates }: ArchiveDateListProps) {
  if (dates.length === 0) {
    return null;
  }

  return (
    <section
      className="section-block section-block--archive"
      aria-labelledby="archive-date-list-heading"
    >
      <div className="section-heading">
        <p className="section-kicker">ARCHIVE</p>
        <h2 id="archive-date-list-heading">아카이브</h2>
      </div>
      <ul className="archive-date-list" aria-label="저장된 스냅샷 날짜 목록">
        {dates.map((date) => (
          <li key={date}>
            <Link
              href={`/archive/${date}`}
              className="archive-date-list__link"
              aria-label={`${date} 아카이브 보기`}
            >
              {date}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
