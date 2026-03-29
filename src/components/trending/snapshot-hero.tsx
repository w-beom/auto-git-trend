import type { SnapshotPageData } from "@/lib/snapshots/queries";

interface SnapshotHeroProps {
  snapshot: SnapshotPageData;
  mode?: "latest" | "archive";
}

export function SnapshotHero({
  snapshot,
  mode = "latest",
}: SnapshotHeroProps) {
  const isArchive = mode === "archive";

  return (
    <section className="hero-panel" aria-labelledby="snapshot-heading">
      <div className="hero-panel__intro">
        <p className="section-kicker">
          {isArchive ? "ARCHIVE ISSUE" : "KOREAN OPEN SOURCE DIGEST"}
        </p>
        <h1
          id="snapshot-heading"
          className={`hero-panel__title${isArchive ? "" : " hero-panel__title--latest"}`}
        >
          {isArchive
            ? `${snapshot.snapshotDate} 아카이브 호`
            : "가장 최근 GitHub 트렌드 스냅샷"}
        </h1>
        <p className="hero-panel__lede">
          {isArchive
            ? "지난 트렌드를 다시 읽는 하루치 오픈소스 다이제스트"
            : "가장 최근에 저장된 트렌드 보드를 한국어 큐레이션으로 다시 읽어보세요"}
        </p>
      </div>

      <div className="hero-panel__meta">
        <p className="meta-chip meta-chip--accent">{`${snapshot.snapshotDate} 발행`}</p>
        <p className="meta-chip">{snapshot.capturedAtLabel}</p>
        <p className="meta-chip">{`총 ${snapshot.totalCount}개 저장소`}</p>
      </div>
    </section>
  );
}
