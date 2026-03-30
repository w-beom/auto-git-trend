# Auto Git Trend

GitHub Trending을 하루 한 번 수집해서 한국어로 다시 읽을 수 있게 정리해 주는 Next.js 앱입니다. GitHub Trending HTML에서 순위와 당일 스타 수를 읽고, GitHub API로 저장소 메타데이터와 README를 보강한 뒤, 한국어 요약을 생성해서 날짜별 스냅샷으로 보관합니다.

## 현재 구현 범위

- `/`: 가장 최근 `success` 상태 스냅샷 표시
- `/archive/[date]`: `YYYY-MM-DD` 형식의 특정 날짜 스냅샷 표시
- `/api/cron/trending`: `Authorization: Bearer <CRON_SECRET>` 인증이 필요한 수집 엔드포인트
- 홈 히어로, Top 3 카루셀, 전체 랭킹 리스트 UI 제공
- 저장소 설명과 README 발췌가 이전 성공 스냅샷과 같으면 한국어 요약 재사용
- 스냅샷이 없으면 빈 상태 화면 표시
- 존재하지 않는 아카이브 날짜는 404 화면 표시

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres
- Vercel Cron
- GitHub Trending HTML + GitHub REST API
- OpenAI Responses API (`gpt-5-mini`)
- Vitest + Testing Library

## 데이터 흐름

1. 스케줄러 또는 수동 호출이 `/api/cron/trending`을 실행합니다.
2. 서버가 GitHub Trending HTML을 가져와 순위, `owner/repo`, `stars today`를 파싱합니다.
3. 각 저장소에 대해 GitHub API로 메타데이터와 README를 가져옵니다.
4. 저장소 설명과 README 발췌를 바탕으로 한국어 요약을 생성합니다.
5. 이전 성공 스냅샷과 입력이 같으면 기존 요약을 재사용합니다.
6. 결과를 Supabase의 `repositories`, `trending_snapshots`, `trending_snapshot_items`에 저장합니다.
7. 공개 페이지는 최신 또는 날짜별 `success` 스냅샷을 서버에서 읽어 렌더링합니다.

## 데이터베이스 테이블

- `repositories`: GitHub 저장소 기준의 정규화된 메타데이터
- `trending_snapshots`: 하루 단위 수집 실행 정보와 상태
- `trending_snapshot_items`: 특정 날짜의 순위, 요약, README 발췌

`trending_snapshots.status`는 `running`, `success`, `failed` 세 값을 사용합니다.

## 프로젝트 구조

```text
src/
  app/
    api/cron/trending/route.ts
    archive/[date]/page.tsx
    page.tsx
  components/trending/
  lib/
    github/
    snapshots/
    summaries/
    supabase/
supabase/
  migrations/
tests/
docs/
```

## 로컬 실행 방법

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. Supabase 프로젝트를 만든 뒤, [supabase/migrations/20260329133000_initial_schema.sql](supabase/migrations/20260329133000_initial_schema.sql)의 내용을 SQL Editor에서 실행합니다.

3. 환경 변수 파일을 만듭니다.

   ```bash
   cp .env.example .env.local
   ```

   PowerShell에서는 아래 명령을 사용할 수 있습니다.

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. `.env.local`에 필요한 값을 채웁니다.

5. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

6. 브라우저에서 `http://localhost:3000`을 엽니다.

처음 실행하면 성공한 스냅샷이 없어서 빈 상태 화면이 보일 수 있습니다. 이 경우 아래의 수동 크론 호출로 첫 데이터를 적재하면 됩니다.

## 필수 환경 변수

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 읽기/쓰기 키
- `GITHUB_TOKEN`: Trending 보강 정보와 README 조회에 사용하는 GitHub 토큰
- `CRON_SECRET`: 크론 엔드포인트 보호용 시크릿. 코드상 최소 16자 이상이어야 합니다.
- `OPENAI_API_KEY`: 한국어 요약 생성에 사용하는 OpenAI API 키

`SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용해야 하며 브라우저로 노출되면 안 됩니다.

## 자주 쓰는 명령어

- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run start`

## 로컬에서 수동 수집 실행하기

개발 서버가 켜져 있고 환경 변수가 채워져 있다면 아래처럼 크론 엔드포인트를 직접 호출할 수 있습니다.

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/trending
```

PowerShell 예시는 아래와 같습니다.

```powershell
Invoke-WebRequest -Headers @{ Authorization = "Bearer <CRON_SECRET>" } http://localhost:3000/api/cron/trending
```

성공하면 JSON 응답으로 `snapshotId`, `status`, `itemCount`를 받습니다. 같은 UTC 날짜에 이미 성공한 스냅샷이 있으면 `status`는 `skipped`가 될 수 있습니다.

## 시간대와 스냅샷 날짜

- `snapshot_date`는 서버의 UTC 날짜 문자열로 저장됩니다.
- `captured_at`은 실제 수집 시각이며 UI에서는 KST로 포맷해서 보여 줍니다.
- `vercel.json`의 스케줄 `0 0 * * *`는 `00:00 UTC`, 한국 시간으로는 오전 9시입니다.

즉, 운영 스케줄에서는 보통 `snapshot_date`와 한국 날짜가 자연스럽게 맞지만, 로컬에서 임의 시각에 수동 실행하면 UTC 기준 날짜로 저장됩니다.

## 배포 메모

- 프로덕션에서도 동일한 환경 변수를 설정해야 합니다.
- 배포 설정은 [vercel.json](vercel.json)에 있으며, 하루 한 번 `/api/cron/trending`을 호출하도록 되어 있습니다.
- 크론 엔드포인트는 인증 헤더가 없으면 401을 반환합니다.
- 공개 페이지는 클라이언트에서 별도 fetch를 하지 않고 서버에서 Supabase를 읽어 렌더링합니다.
