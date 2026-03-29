import { EmptyState } from "@/components/trending/empty-state";

export default function NotFoundPage() {
  return (
    <EmptyState
      title="요청한 아카이브 호를 찾지 못했습니다"
      description="해당 날짜의 GitHub Trending 스냅샷이 아직 없거나 보관되지 않았습니다."
      kicker="ARCHIVE"
      href="/"
      linkLabel="최신 스냅샷으로 돌아가기"
    />
  );
}
