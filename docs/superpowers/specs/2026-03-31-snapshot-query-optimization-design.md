# Snapshot Query Optimization Design

## Goal

날짜 전환 시 반복되는 서버 재조회 비용을 줄여서 아카이브 전환 체감을 개선한다. 이번 범위는 `archiveDates` 재조회 캐시와 스냅샷 본문 쿼리의 select slim화다.

## Findings

- 날짜 전환마다 `getSnapshotArchiveDates()`와 `getSnapshotPageDataByDate()`가 모두 다시 실행된다.
- 실측 기준 `getSnapshotArchiveDates()`는 약 150ms~280ms, `getSnapshotPageDataByDate()`는 약 280ms~320ms가 걸렸다.
- 같은 전환에서 클라이언트 측 카루셀/섹션 높이 계산은 0ms~6ms 수준이라 주병목이 아니다.

## Scope

- `src/lib/snapshots/queries.ts`에서 아카이브 날짜 목록을 서버 프로세스 단위로 재사용한다.
- 스냅샷 페이지용 select 구문을 실제 렌더에 필요한 필드만 읽도록 줄인다.
- 페이지/컴포넌트 인터페이스는 가능하면 유지해서 UI 변경 범위를 최소화한다.

## Design

### Archive Date Cache

- `getSnapshotArchiveDates()` 내부에서 모듈 단위 메모리 캐시를 사용한다.
- 캐시는 `value`, `expiresAt`, `pendingPromise`를 가진다.
- 캐시 TTL은 짧게 유지해서 데이터 신선도를 해치지 않으면서도 날짜 전환 연속 클릭 비용을 줄인다.
- 첫 요청이 진행 중일 때 같은 함수가 다시 호출되면 같은 Promise를 재사용한다.

### Snapshot Select Slimming

- `SNAPSHOT_SELECT`에서 현재 UI가 사용하지 않는 필드를 제거한다.
- 제거 대상:
  - `trending_snapshot_items.readme_excerpt`
  - `trending_snapshot_items.stars_today`
  - `repositories.description`
  - `repositories.primary_language`
  - `repositories.avatar_url`
- 현재 UI가 사용하는 필드는 유지한다:
  - `snapshot_date`, `captured_at`, `item_count`
  - `rank`, `summary_ko`, `repo_description_snapshot`
  - `owner`, `name`, `full_name`, `github_url`, `stars_total`, `forks_total`

### Mapping Compatibility

- `SnapshotPageItem` 반환 shape는 유지한다.
- slim된 필드들은 `null`로 채워서 기존 테스트 fixture와 컴포넌트 API를 깨지 않는다.
- `description`은 `repo_description_snapshot`만 사용하고 저장소 원본 description fallback은 제거한다.

## Testing

- `tests/snapshots/queries.test.ts`
  - 아카이브 날짜를 두 번 요청해도 실제 list query는 한 번만 실행되는지 검증
  - latest/by-date query select 문자열에 불필요 필드가 없는지 검증
  - slim된 row에서도 기존 반환 shape가 유지되는지 검증
- `tests/app/home-page.test.tsx`, `tests/app/archive-page.test.tsx`
  - 기존 페이지 렌더 회귀 여부만 확인

## Risks

- 프로세스 메모리 캐시는 서버 재시작 시 사라진다. 이번 목적은 즉시 체감 개선이므로 허용한다.
- UI에서 미래에 `readmeExcerpt`나 `primaryLanguage`를 다시 렌더하면 query select와 mapper를 함께 복원해야 한다.
