import { notFound } from "next/navigation";

import { SiteShell } from "@/components/trending/site-shell";
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

  return <SiteShell snapshot={snapshot} mode="archive" />;
}
