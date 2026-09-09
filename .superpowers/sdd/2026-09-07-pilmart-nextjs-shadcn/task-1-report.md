STATUS: DONE_WITH_CONCERNS
COMMITS: 4723920
TEST_SUMMARY: pnpm dev 성공 — Next.js 16.3.4 (Turbopack), Ready in 3.3s, .env.local 로드 확인
CONCERNS: 1) 설치된 Next.js 버전이 16.3.4 (브리프는 "Next.js 15"로 표기했으나 pnpm create next-app@latest 실행 시 최신 버전인 16이 설치됨). 2) shadcn/ui가 이제 Tailwind v4 + oklch 색상 공간을 사용하므로, 브리프의 hsl() 기반 --primary 지시를 oklch로 변환하여 적용함 (hsl(142 71% 45%) → oklch(0.56 0.157 149.4), dark: oklch(0.65 0.157 149.4)). 3) shadcn init --defaults가 Style=Default, Base color=Zinc를 자동 선택함.

---

## 상세 내용

### Step 1: Next.js 프로젝트 생성
- 명령: `pnpm create next-app@latest pilmart-next --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*" --no-git`
- 결과: Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3, Tailwind CSS 4.3.3 설치 완료
- 주의: `--src-dir=no` 플래그 대신 `--no-src-dir`을 사용함 (플래그 형식 차이)

### Step 2: shadcn/ui 초기화
- 명령: `pnpm dlx shadcn@latest init --defaults`
- 결과: components.json 생성, lib/utils.ts 생성, components/ui/button.tsx 생성, globals.css 업데이트
- Tailwind v4 지원으로 새로운 CSS 구조 적용됨

### Step 3: shadcn 컴포넌트 설치
설치된 컴포넌트 (20개):
- button, card, badge, input, label, select, tabs, radio-group, separator, skeleton, avatar, accordion, command, table, navigation-menu, toggle, toggle-group, sheet, dialog, input-group
- sonner 2.0.8, next-themes 0.4.6 설치 완료

### Step 4: .env.local 생성
- `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq` 기록
- dev 서버 시작 시 `.env.local` 로드 확인됨

### Step 5: 로고 복사
- `pilmart/logo.png` → `pilmart-next/public/logo.png` 복사 완료

### Step 6: 초록 테마 CSS 변수 설정
shadcn v4가 oklch 색상 공간을 사용하므로 hsl 값을 oklch로 변환:
- `:root --primary`: oklch(0.56 0.157 149.4) [= hsl(142 71% 45%)]
- `:root --primary-foreground`: oklch(1 0 0) [= white]
- `:root --ring`: oklch(0.56 0.157 149.4)
- `.dark --primary`: oklch(0.65 0.157 149.4) [= hsl(142 71% 55%)]
- `.dark --primary-foreground`: oklch(1 0 0)

### Step 7: 개발 서버 기동 확인
- `pnpm dev` 실행 결과: Ready in 3.3s (Turbopack)
- http://localhost:3000 서버 정상 기동 확인
- .env.local 로드 확인

### Step 8: git commit
- 브랜치: feature/pilmart-nextjs-shadcn
- 커밋 해시: 4723920
- 44개 파일 변경, 8866 라인 삽입
