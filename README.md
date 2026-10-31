# cafe-order-demo — 의도적으로 취약한 데모 저장소

> ⚠️ **이 저장소는 일부러 보안 문제를 넣은 교육·시연용 과녁입니다. 배포하거나 코드를 가져다 쓰지 마세요.**
> 들어 있는 키·토큰·주소는 모두 **가짜**이며 어떤 서비스에도 연결되지 않습니다. 고객 이름·주문도 가상 데이터입니다.

[72hours](https://github.com/maebsy/YMCA-hackathon-2026) 보안 점검 서비스가 바이브코딩으로 만든 작은 카페 주문 사이트에서
**찾기 → 위험도 판단 → OS별 수정 안내 → AI 수정 지시(MCP) → 재검사로 해결 확인 → 실제 공격 재현(실검증) → 보고서**
흐름을 보여 주는지 확인하려고 만든 저장소입니다.

## 구성

| 경로 | 내용 |
|---|---|
| `app/` | Next.js 화면·API (관리자 페이지, 후기 카드, 주문 API, 로그인) |
| `server/` | Express 주문 서버. `npm start`(포트 3100)·`npm test`로 실행되며 실검증 과녁으로 씁니다 |
| `supabase/migrations/` | DB 테이블 정의 |
| `_layouts/` | 공개 소개 페이지 레이아웃 (검색 위젯) |
| `tests/fixtures/` | 테스트용 예시 값 |
| `verify/attacks.json` | 실검증이 재생할 공격 요청과 성공 판정 기준 |
| `verify/fix/server.js` | 사람이 쓴 기준 수정본 |
| `expected-findings.json` | **정답지**: 걸려야 하는 것과 걸리면 안 되는 것 |

## 들어 있는 문제 (정답지 요약)

| # | 위치 | 문제 | 보여 주려는 것 |
|---|---|---|---|
| 1 | `app/admin/page.tsx` | 브라우저 코드에서 Supabase service_role 키 사용 | 브라우저 노출 판단, 키 폐기·재발급 |
| 2 | `app/admin/page.tsx` | `NEXT_PUBLIC_` 접두어 비밀값 | 빌드 결과에 키가 박힌다는 설명 |
| 3 | `app/api/orders/route.ts` | SQL 문자열 연결 + 로그인 확인 없는 쓰기 | 인증 누락, 매개변수 바인딩 |
| 4 | `app/reviews/ReviewCard.tsx` | `dangerouslySetInnerHTML` | XSS 설명과 AI 수정 지시 |
| 5 | `app/login/page.tsx` | 토큰을 `localStorage`에 저장 | 낮은 위험 예시 |
| 6 | `server/server.js` | SQL 주입 (`/api/orders`) | **실검증**: 수정 전 공격 성공 → 수정 후 차단 |
| 7 | `server/server.js` | 반사형 XSS (`/search`) | **실검증** |
| 8 | `server/server.js` | 명령 주입 (`exec("ping " + host)`) | OS별 대응 명령 |
| 9 | `server/server.js` | JWT 서명 키 하드코딩 | 환경 변수 이동 + 재발급 |
| 10 | `server/server.js` | CORS `origin: "*"` + 쿠키 허용 | 중간 위험 예시 |
| 11 | `.env` | 환경 파일이 저장소에 올라감 (가짜 키) | 값은 읽지 않고 이름만 보고 |
| 12 | `.gitignore` | `.env` 규칙 없음 | 재발 방지 안내 |
| 13 | `supabase/migrations/001_init.sql` | RLS를 켜지 않은 테이블 | 테이블 이름까지 넣은 SQL 수정 |
| 14 | `package-lock.json` | 오래된 의존성 (lodash 4.17.11) | KEV·EPSS 근거 위험도, 업그레이드 명령 |

**오탐 함정** — 단순 스캐너와 다르게 판단해야 하는 곳:
- `_layouts/base.html`의 Algolia **검색 전용** 키: 위험 단정 대신 "키 권한 확인 필요(사람 확인)"
- `tests/fixtures/sample.env`의 예시 값: 테스트·예시 문맥
- `server/server.js`의 `// nosemgrep` 주석: 경고를 숨기려는 시도로 지적
- `server/server.js`의 `/api/orders/safe`: 이미 매개변수 바인딩이라 걸리면 안 됨

## 실측 결과 (72hours 보안엔진, v1-vulnerable)

| 엔진 | 탐지 |
|---|---|
| Opengrep (코드) | 10 |
| Gitleaks (비밀값) | 3 |
| config (설정) | 5 |
| OSV (의존성, lodash) | 7 |
| **합계** | **25** |

정답지 줄 단위 기준: **탐지 15 / 미탐 1 / 오탐 0 / 함정 통과 2**. 알려진 한계는 그대로 남겨 두고 개선 대상으로 추적합니다.
- `server/server.js:57`: `// nosemgrep` 주석으로 숨긴 SQL 주입을 탐지하지 못함
- `.env:3`: Supabase service_role JWT가 "공개 키일 가능성"(low)으로 낮게 분류됨

## 시연 순서 (재검사)

| 단계 | 브랜치·태그 | 기대 결과 |
|---|---|---|
| 1. 첫 검사 | `main` = 태그 `v1-vulnerable` | 위 문제 탐지, 위험도별 정렬 |
| 2. 일부 수정 후 재검사 | 브랜치 `v2-partial-fix`를 `main`에 반영 | **해결**: service_role·SQL 주입·.env, 나머지는 **계속** |
| 3. 원래대로 | `main`을 `v1-vulnerable`로 되돌림 | 다음 시연 준비 |

```bash
# 2단계: 일부 수정 반영 (main 을 v2 로)
git push origin v2-partial-fix:main --force-with-lease
# 3단계: 다음 시연을 위해 되돌림
git push origin v1-vulnerable:main --force-with-lease
```

## 실검증 (서버 실행)

```bash
cd server
npm ci
npm start        # http://127.0.0.1:3100
npm test         # 기능 테스트 3개 (검색어가 화면에 보이는지 포함)
```

`verify/attacks.json`의 공격을 수정 전 코드에 보내면 성공하고, `verify/fix/server.js`를 적용하면 막히며 기능 테스트는 그대로 통과해야 합니다.
Node 22.5 이상(내장 `node:sqlite`)이 필요합니다.

## 라이선스

MIT. 교육·시연 목적 외 사용을 권하지 않습니다.
