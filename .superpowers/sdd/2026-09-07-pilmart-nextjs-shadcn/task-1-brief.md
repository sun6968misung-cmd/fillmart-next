# Task 1: 프로젝트 스캐폴드 + shadcn 초기화

## Context
필마트(Korean grocery e-commerce) HTML/Alpine.js 프로젝트를 Next.js 15 + shadcn/ui로 재구현하는 작업의 첫 번째 태스크다.
작업 디렉터리: `C:\Users\USER\.antigravity-ide\`
신규 프로젝트는 `pilmart-next/` 폴더에 생성한다. 기존 `pilmart/` 폴더는 절대 수정하지 않는다.

## Global Constraints
- 작업 디렉터리: `C:\Users\USER\.antigravity-ide\pilmart-next\`
- pnpm 사용 (npm/yarn 금지)
- TypeScript strict 모드
- Primary 색상: `hsl(142 71% 45%)` (초록)
- NEXT_PUBLIC_TOSS_CLIENT_KEY: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`
- 기존 `pilmart/` 폴더 절대 수정 금지

## Steps

### Step 1: Next.js 프로젝트 생성
`C:\Users\USER\.antigravity-ide` 에서 PowerShell로 실행:
```powershell
pnpm create next-app@latest pilmart-next --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --no-git
```
(모든 프롬프트에 기본값 또는 Yes 사용)

### Step 2: shadcn/ui 초기화
```powershell
cd pilmart-next
pnpm dlx shadcn@latest init
```
프롬프트 응답:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**

### Step 3: shadcn 컴포넌트 + 추가 패키지 설치
```powershell
pnpm dlx shadcn@latest add button card badge sheet dialog input label select tabs toggle-group radio-group separator skeleton avatar accordion command table navigation-menu
pnpm add sonner
pnpm add next-themes
```

### Step 4: `.env.local` 생성
파일 위치: `pilmart-next/.env.local`
내용:
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

### Step 5: 로고 복사
```powershell
Copy-Item "C:\Users\USER\.antigravity-ide\pilmart\logo.png" "C:\Users\USER\.antigravity-ide\pilmart-next\public\logo.png"
```

### Step 6: 초록 테마 CSS 변수 설정
`pilmart-next/app/globals.css` 에서 `:root` 블록의 `--primary` 관련 변수를 교체:
```css
:root {
  --primary: 142 71% 45%;
  --primary-foreground: 0 0% 100%;
  --ring: 142 71% 45%;
}
.dark {
  --primary: 142 71% 55%;
  --primary-foreground: 0 0% 100%;
}
```
(shadcn init이 생성한 globals.css의 기존 --primary 값들을 위 값으로 교체)

### Step 7: 개발 서버 기동 확인
```powershell
pnpm dev
```
`http://localhost:3000` 에서 기본 Next.js 페이지가 보이면 성공. 서버 종료.

### Step 8: git commit
```powershell
cd C:\Users\USER\.antigravity-ide
git add pilmart-next/
git commit -m "feat: scaffold Next.js 15 + shadcn/ui pilmart-next project"
```

## Report File
완료 후 `C:\Users\USER\.antigravity-ide\.superpowers\sdd\2026-09-07-pilmart-nextjs-shadcn\task-1-report.md` 에 보고서를 작성하라.

보고서 형식:
```
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
COMMITS: <commit hashes>
TEST_SUMMARY: pnpm dev 성공 여부
CONCERNS: (있으면 기재)
```
그 다음 상세 내용을 자유 형식으로 작성.
