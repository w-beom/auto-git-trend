# Auto Git Trend

한국어로 다시 읽는 GitHub Trending 일간 스냅샷 사이트입니다. 최신 스냅샷은 `/`, 날짜별 아카이브는 `/archive/[date]`에서 서버 렌더링으로 보여 줍니다.

## Local Setup

1. `npm install`
2. `.env.example`를 `.env.local`로 복사
3. 아래 환경 변수를 채우기
4. `npm run dev`
5. 브라우저에서 `http://localhost:3000` 열기

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `CRON_SECRET`
- `OPENAI_API_KEY`

## Useful Commands

- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run build`

## Local Cron Trigger

Vercel cron은 운영 환경에서 `0 0 * * *`로 `/api/cron/trending`을 호출합니다. 로컬에서는 같은 엔드포인트를 아래처럼 직접 호출하면 됩니다.

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/trending
```

PowerShell 예시:

```powershell
Invoke-WebRequest -Headers @{ Authorization = "Bearer <CRON_SECRET>" } http://localhost:3000/api/cron/trending
```

## Deployment Notes

- `vercel.json`에 cron 스케줄 `0 0 * * *`가 설정되어 있어 09:00 KST에 수집이 실행됩니다.
- 공개 페이지는 클라이언트 fetch 없이 서버에서 스냅샷 데이터를 읽습니다.
