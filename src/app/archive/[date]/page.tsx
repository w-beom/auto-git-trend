import { notFound } from "next/navigation";

import { SnapshotPageView } from "@/lib/snapshots/page-view";
import { getSnapshotPageDataByDate } from "@/lib/snapshots/queries";

export const dynamic = "force-dynamic";

interface ArchivePageProps {
  params: Promise<{
    date: string;
  }>;
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { date } = await params;
  const snapshot = await getSnapshotPageDataByDate(date);

  if (!snapshot) {
    notFound();
  }

  return (
    <main className="page">
      <SnapshotPageView
        eyebrow="Archive"
        heading={`Trending snapshot for ${snapshot.snapshotDate}`}
        snapshot={snapshot}
      />
    </main>
  );
}
