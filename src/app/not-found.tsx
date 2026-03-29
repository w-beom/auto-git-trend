import { EmptyState } from "@/components/trending/empty-state";

export default function NotFoundPage() {
  return (
    <EmptyState
      title="요청한 페이지를 찾지 못했습니다"
      description="주소가 바뀌었거나 아직 준비되지 않은 페이지일 수 있습니다."
      kicker="NOT FOUND"
      href="/"
      linkLabel="홈으로 돌아가기"
    />
  );
}
