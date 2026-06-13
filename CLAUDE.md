# CLAUDE.md

TOEIC 학습 앱 — Capacitor 8 + React + Vite + TypeScript, 앱 ID `kr.co.vaultlife.toeic`.

## 먼저 읽을 문서
- **`HANDOFF.md`** — 진행도 전체 + 남은 작업 지시서 (Play Store 배포 준비 중). 새 세션은 반드시 여기서 시작.
- `AGENTS.md` — 코드 컨벤션(Zustand 패턴, Tailwind, 프롬프트는 `src/lib/prompts.ts`)과 과거 이슈.
- `question_pipeline/README.md` — 문제 조사·검수 에이전트 파이프라인 사용법.

## 명령어
```bash
npm run dev          # 개발 서버 (:3000)
npm run lint         # tsc --noEmit (typecheck)
npm run build        # vite 빌드
npm run build:bank   # 문제 은행 재생성 (question_pipeline/reviewed → src/data/questionBank)
npx cap sync android # 웹 자산 → 안드로이드
```

## 절대 규칙
1. **`src/data/questionBank/part*.ts`는 자동 생성 파일 — 직접 수정 금지.** 데이터 수정은 `question_pipeline/reviewed/*.json` → `npm run build:bank`.
2. **Gemini 호출은 반드시 `src/lib/geminiClient.ts`의 `generateContent` 경유** (`@google/genai` 직접 사용 금지 — API 키 프록시 분기가 깨짐).
3. **바이너리 파일을 텍스트 도구로 건드리지 말 것.** 이 저장소는 과거 UTF-8 변환으로 바이너리가 손상된 이력이 있음 (gradle-wrapper.jar는 아직 손상 상태, CI가 재생성으로 우회 — `HANDOFF.md` 2-3 참조).
4. 릴리스 키스토어·비밀번호를 저장소에 커밋 금지 (GitHub Secrets만).
5. 문제 콘텐츠는 오리지널만 — ETS 기출 복제 금지. 앱 이름에 "TOEIC" 상표 사용 주의.

## 빌드/CI 메모
- `android/gradlew`는 실행 권한 없이 커밋됨 → 로컬에서 `chmod +x android/gradlew`.
- 디버그 CI: `android-build.yml` / 서명 릴리스 AAB: `android-release.yml` (수동 실행, Secrets 필요).
- Play Console 업로드마다 `android/app/build.gradle`의 `versionCode` +1.
