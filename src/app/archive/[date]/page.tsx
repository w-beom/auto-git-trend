import { notFound } from "next/navigation";

import { SiteShell } from "@/components/trending/site-shell";
import {
  getSnapshotArchiveDates,
  getSnapshotPageDataByDate,
} from "@/lib/snapshots/queries";

export const revalidate = 300;

interface ArchivePageProps {
  params: Promise<{
    date: string;
  }>;
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { date } = await params;
  const [snapshot, archiveDates] = await Promise.all([
    getSnapshotPageDataByDate(date),
    getSnapshotArchiveDates(),
  ]);

  if (!snapshot) {
    notFound();
  }

  return <SiteShell snapshot={snapshot} archiveDates={archiveDates} mode="archive" />;
}
