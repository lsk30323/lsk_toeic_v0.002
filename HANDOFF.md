# 프로젝트 인수인계 문서 (HANDOFF)

> **목적**: 이 문서는 다른 환경(VS Code + Claude Code 등)에서 작업을 이어받기 위한 진행도 보고서 + 작업 지시서입니다.
> **최종 갱신**: 2026-06-13 (main `1b9f80c` 기준)
> **저장소**: https://github.com/lsk30323/lsk_toeic_v0.002

---

## 1. 프로젝트 개요

TOEIC 학습 안드로이드 앱. **Capacitor 8 + React + Vite 6 + TypeScript** 웹앱을 안드로이드로 패키징.

- 상태관리: Zustand (`src/features/*/store.ts` + 로직은 `hooks/`)
- 인증/DB: Firebase Auth + Firestore (구글 로그인은 Supabase OAuth 브리지 경유)
- AI: Gemini API (문제 생성 폴백, TTS, AI 코치, 스피킹, 복습 튜터, 단어장 추출)
- 스타일: Tailwind CSS, lucide-react, motion/react (컨벤션은 `AGENTS.md` 참조)
- 앱 ID: **`kr.co.vaultlife.toeic`** (구 `com.example.toeicapp`에서 변경됨 — Play Store가 `com.example.*` 거부)

---

## 2. 완료된 작업 (진행도)

### 2-1. TOEIC 문제 조사·검수 에이전트 파이프라인 (PR #1, 머지됨)

`.claude/agents/`에 10개 에이전트 정의:

| # | 에이전트 | 역할 |
|---|---|---|
| 1 | agent1-repo-integrator | 검수 완료 데이터의 저장소 적합성 최종 판단·통합 (`build_bank.cjs` 운용) |
| 2 | agent2-lc-reviewer | LC Part 1~4 검수 (전 문항 직접 풀이로 정답 키 검증) |
| 3~6 | agent3~6-lc-partN-researcher | LC Part 1~4 조사·오리지널 문제 작성 → 2번에 검수 요청 |
| 7 | agent7-rc-reviewer | RC Part 5~7 검수. **Part 7 최대 활용 규칙** (경미 결함은 수정해 채택) |
| 8~10 | agent8~10-rc-partN-researcher | RC Part 5~7 조사·작성 → 7번에 검수 요청. 10번은 배치 누적 방식 |

**데이터 흐름**: 조사 에이전트 → `question_pipeline/staging/*.json` → 검수 에이전트 → `question_pipeline/reviewed/*.json` → `npm run build:bank` → `src/data/questionBank/part1~7.ts`

**문제 은행 현황 (총 4,004문제, 전수 검수 완료)**:

| 파트 | 수량 | 비고 |
|---|---|---|
| LC Part 1 | 40 | 사진 묘사. 앱에서는 **AI Vision 생성(실제 사진+오디오)을 우선**, 은행은 오프라인 폴백 |
| LC Part 2 | 80 | options 3개, 간접응답 다수 |
| LC Part 3 | 72 | 대화 24개 × 3문제 (같은 script 반복 = 의도된 설계) |
| LC Part 4 | 72 | 담화 24개 × 3문제 |
| RC Part 5 | **1,120** | 문법/어휘 7개 도메인. 보기 셔플로 정답 위치 균등 분산 |
| RC Part 6 | 80 | 빈칸 마커는 `_______` (7개 언더스코어) |
| RC Part 7 | **2,540** | 지문 세트 603개 (단일·이중·삼중 지문), 중복 0 |

**LC 오디오/사진 & AI 생성 (2026-06-13 추가)**: Part 1~4는 런타임 TTS로 오디오 재생(자동재생+로딩표시). Part 1은 `generateQuestion('LC','PART1')` Vision 경로로 실제 사진+일치 문장+오디오를 함께 생성(은행은 폴백). `generateQuestion(type, subtype, examples?)`는 은행 문제를 few-shot 예시로 주입해 "넣어준 데이터 기반" 생성을 한다(`getBankExamples`).

검수 품질: 전 문항 풀이 검증, 검수 중 정답 키 오류 2건·금액 불일치 1건·문장삽입 마커 1건 등 적발·수정. ETS 기출 복제 금지 — 전량 오리지널.

**앱 통합**: `useStudy`/`useExam`이 문제 은행 우선 사용(`getRandomBankQuestion`, 최근 30문제 중복 회피), 은행 미스 시 Gemini 실시간 생성 폴백. `useExam`의 TTS 실패는 격리되어 시험 시작을 막지 않음.

CodeRabbit 리뷰 전 회차 대응 완료 (반영 9건 + 사유 명시 스킵: Part 6 빈칸 검사 완화 유지, setLoading 조기 해제는 의도된 UX 등 — 커밋 메시지에 사유 기록).

### 2-2. Play Store 배포 준비 (PR #2, 머지됨)

1. **패키지명 일괄 변경** `com.example.toeicapp` → `kr.co.vaultlife.toeic`:
   - `android/app/build.gradle` (namespace, applicationId)
   - `capacitor.config.ts` (appId)
   - `android/app/src/main/AndroidManifest.xml` (딥링크 스킴)
   - `android/app/src/main/res/values/strings.xml` (package_name, custom_url_scheme)
   - `android/app/src/main/java/kr/co/vaultlife/toeic/MainActivity.java` (이동+패키지문)
   - `src/lib/firebase.ts`, `src/App.tsx` (OAuth 리다이렉트 `kr.co.vaultlife.toeic://login-callback`)
2. **릴리스 서명**: `build.gradle`에 환경변수 기반 signingConfig (`RELEASE_KEYSTORE_FILE/RELEASE_KEYSTORE_PASSWORD/RELEASE_KEY_ALIAS/RELEASE_KEY_PASSWORD`). 키스토어는 저장소에 없음.
3. **릴리스 CI**: `.github/workflows/android-release.yml` (workflow_dispatch 수동 실행) — Secrets의 키스토어로 서명된 **AAB + APK** 아티팩트 생성. **빌드 성공 확인됨** (run 27410422950).
4. **Gemini API 키 프록시**:
   - 서버: `functions/index.js`의 `geminiProxy` (Firebase Functions v2 onCall, 리전 `asia-northeast3`, **로그인 필수**, 모델 화이트리스트, 키는 Secret Manager의 `GEMINI_API_KEY`) — **아직 배포 전**
   - 클라이언트: `src/lib/geminiClient.ts` 단일 진입점. `VITE_GEMINI_PROXY_URL` 설정 시 `httpsCallableFromURL`로 프록시 경유(키가 번들에서 제거됨), 미설정 시 기존 직접 호출(개발용)
   - 호출부 전부 교체 완료: `src/lib/gemini.ts`(4곳), `useSpeaking.ts`(전사 + 채팅을 히스토리 누적 방식으로 재구현), `Review.tsx`, `Voca.tsx`

### 2-3. 손상 바이너리 복구 (PR #3, 머지됨) — ⚠️ 중요 배경지식

**이 저장소의 커밋된 바이너리들은 과거 UTF-8 텍스트 변환을 거치며 손상되었던 이력이 있음** (PNG 시그니처 `89 50 4E 47` → `EF BF BD 50 ...`).

- PNG 29개 전부 손상이었음 → 런처 아이콘(전 밀도 사각/원형/adaptive foreground)과 Capacitor 스플래시 전체를 **파란 배경 + 흰색 "T" 임시 디자인으로 재생성 완료** (Pillow 사용). 미사용 손상 이미지 3장은 삭제.
- 디버그 빌드는 PNG crunch를 건너뛰어 그동안 통과했고, 릴리스 빌드에서 처음 발각된 것.
- **`android/gradle/wrapper/gradle-wrapper.jar`는 여전히 손상 상태로 커밋되어 있음.** 두 CI 워크플로 모두 "Gradle 8.14.3 직접 설치 → `gradle wrapper` 재생성" 단계로 우회 중. (개선 과제 G-5 참조)
- `android/gradlew`는 실행 권한 없이(100644) 커밋됨 → CI에서 `chmod +x` 필수.

### 2-4. CI 워크플로 현황

| 워크플로 | 트리거 | 비고 |
|---|---|---|
| `android-build.yml` | main push/PR + 수동 | 디버그 APK. gradle 직접설치+wrapper 재생성, gradlew chmod, google-services.json **패키지 불일치 시 경고 후 제외** 가드 |
| `android-release.yml` | 수동(workflow_dispatch) | 서명된 AAB+APK. 동일한 wrapper/chmod/google-services 가드. `VITE_GEMINI_PROXY_URL` Secret 있으면 키 미포함 빌드 |

### 2-5. GitHub Secrets 등록 현황

| Secret | 상태 |
|---|---|
| `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ (기존) |
| `ANDROID_RELEASE_KEYSTORE_BASE64`, `RELEASE_KEYSTORE_PASSWORD` | ✅ (사용자 등록 완료) |
| `GOOGLE_SERVICES_JSON_BASE64` | ⚠️ **구 패키지(com.example.toeicapp) 기준 — 갱신 필요** (과제 A) |
| `VITE_GEMINI_PROXY_URL` | ⬜ 미등록 (과제 C) |

**릴리스 키스토어**: 사용자가 채팅으로 전달받아 보관 중 (저장소에 없음). alias `release`, 유효기간 2056년.
- SHA1: `D6:A8:4C:C6:1C:4A:B1:E6:06:75:44:F4:52:9F:9D:99:51:D7:2B:6D`
- SHA256: `6B:8C:52:C4:B3:EE:2E:E4:B6:6F:44:36:0D:00:81:86:86:F9:E4:00:21:C4:40:68:FF:80:73:68:61:DF:22:2A`
- ⚠️ 분실 시 앱 업데이트 영구 불가. 비밀번호 등은 절대 저장소에 커밋 금지.

---

## 3. 남은 작업 (지시서 — 우선순위 순)

### A. Firebase에 새 패키지 등록 (콘솔 작업 + Secret 갱신)
1. Firebase Console → 프로젝트 설정 → 내 앱 → **Android 앱 추가**: 패키지 `kr.co.vaultlife.toeic`
2. SHA 지문 등록: 위 릴리스 SHA1/SHA256 **그리고** 디버그 키스토어 지문(디버그 키는 `android-build.yml`에 base64로 인라인되어 있음 — 의도된 것, 디버그 키는 비밀 아님)
3. 새 `google-services.json` 다운로드 → `base64 -w0 google-services.json` → GitHub Secret `GOOGLE_SERVICES_JSON_BASE64` 값 교체
4. 완료 전까지는 빌드가 경고와 함께 Firebase 설정 없이 진행됨 (구글 로그인만 비활성)

### B. Supabase 리다이렉트 URL 추가
Supabase Dashboard → Authentication → URL Configuration → Redirect URLs에 `kr.co.vaultlife.toeic://login-callback` 추가.

### C. Gemini 프록시 배포 + 키 제거 빌드
```bash
npm i -g firebase-tools && firebase login
firebase functions:secrets:set GEMINI_API_KEY   # 값 입력
cd functions && npm install && cd ..
firebase deploy --only functions
```
배포 후 함수 URL(형식: `https://asia-northeast3-<프로젝트ID>.cloudfunctions.net/geminiProxy`)을 GitHub Secret **`VITE_GEMINI_PROXY_URL`** 로 등록 → 이후 릴리스 빌드부터 API 키가 번들에서 제거됨.
- 로컬 개발 시에는 `.env.local`에 `GEMINI_API_KEY`/`VITE_GEMINI_API_KEY`를 두면 기존처럼 직접 호출로 동작.

### D. 앱 표시명 결정 (⚠️ 상표 문제)
"TOEIC"은 ETS 등록상표 — 앱 이름에 쓰면 Play Store 거부/삭제 위험. 새 이름 결정 후:
- `android/app/src/main/res/values/strings.xml`의 `app_name`, `title_activity_main`
- `capacitor.config.ts`의 `appName`
(문제 콘텐츠는 전량 오리지널이라 저작권 문제 없음. 설명문구의 "토익 대비" 같은 서술적 사용은 비교적 안전.)

### E. 버전 관리
현재 `android/app/build.gradle`: `versionCode 1`, `versionName "1.0"`. **Play Console 업로드마다 versionCode +1 필수.**

### F. Play Console 배포 절차 (사용자 직접)
1. 개발자 계정 등록 ($25 일회성)
2. 앱 생성 → 위 D의 이름 사용
3. **개인 계정은 프로덕션 전 비공개 테스트 의무** (테스터 모집 + 14일)
4. 개인정보처리방침 URL 필수 (Firebase 로그인·학습기록 저장 고지), 데이터 보안 양식 작성
5. A~C 완료 후 `android-release.yml` 재실행 → 새 AAB 업로드

### G. 선택 과제 (품질 개선)
1. **문제 증량**: `question_pipeline/README.md`의 절차로 에이전트 파이프라인 재실행 (Part 7은 `rc_part7_<배치번호>.json` 배치 누적, 검수 후 `reviewed/rc_part7.json` **단일 파일로 병합** — 빌드는 이 파일만 읽음)
2. **아이콘 교체**: 현재 임시 "T" 디자인. 원본 로고 확보 시 전 밀도 재생성 (PR #3 커밋의 Pillow 스크립트 방식 참조)
3. **코드 스플리팅**: 메인 청크 5.2MB (문제 은행 데이터 포함) — 경고만 있고 동작엔 문제 없음. dynamic import 검토
4. **minify**: 릴리스 `minifyEnabled false` 상태 — proguard 규칙 정비 후 활성화 검토
5. **wrapper jar 정상화**: 로컬에서 정상 `gradle-wrapper.jar`를 바이너리 그대로 커밋하면 CI의 재생성 단계 제거 가능

---

## 4. 주의사항 / 함정 (이 저장소 특이사항)

1. **바이너리 손상 이력**: 텍스트 처리 도구(sed, 인코딩 변환 등)로 바이너리를 절대 건드리지 말 것. 바이너리 추가/수정 시 시그니처 확인 권장 (`head -c 4 file | od -t x1`).
2. **gradlew**: 저장소에 실행 권한 없음 — 로컬에서 `chmod +x android/gradlew` 필요.
3. **문제 은행 데이터 계약** (`question_pipeline/build_bank.cjs` 검증 규칙):
   - dedup 키 = `question|script|passage` (options/해설 달라도 같으면 중복 처리)
   - LC는 `script` 필수, Part 6/7은 `passage` 필수, Part 5는 `passage` 금지, Part 2만 options 3개
   - Part 6 빈칸: 3개 이상 연속 언더스코어 허용(현 데이터는 전부 7개), Part 7은 `_______`(7개) 금지·짧은 밑줄(양식 필드)은 허용
   - `src/data/questionBank/part*.ts`는 **자동 생성 파일 — 직접 수정 금지**, 수정은 reviewed JSON → `npm run build:bank`
4. **staging JSON은 출처 기록용으로 커밋 유지** (빌드 입력은 reviewed만)
5. `android-build.yml`의 디버그 키스토어 인라인은 의도된 것 (디버그 키는 비밀이 아님). **릴리스 키는 Secrets로만.**
6. 과거 작업 환경(Claude Code on the Web)은 Actions 아티팩트 호스트가 차단되어 git 경유 우회를 썼음 — **로컬 VS Code에서는 해당 없음.**

---

## 5. 주요 파일 맵

```
.claude/agents/                  # 문제 파이프라인 에이전트 10개 정의
question_pipeline/
  README.md                      # 파이프라인 사용법 (재실행 절차)
  build_bank.cjs                 # reviewed JSON → TS 변환·검증 (npm run build:bank)
  staging/ , reviewed/           # 조사 원본 / 검수 통과분
src/data/questionBank/           # 자동 생성 문제 은행 (index.ts만 수동 관리)
src/lib/gemini.ts                # Gemini 기능 함수들 (callGemini 경유)
src/lib/geminiClient.ts          # Gemini 단일 진입점 (프록시/직접 분기)
src/lib/firebase.ts              # Firebase + Supabase OAuth 브리지, 딥링크
functions/index.js               # geminiProxy (배포 전)
firebase.json                    # functions/firestore 배포 설정
.github/workflows/android-build.yml    # 디버그 APK CI
.github/workflows/android-release.yml  # 서명 릴리스 AAB CI (수동)
android/app/build.gradle         # applicationId, signingConfig, versionCode
AGENTS.md                        # 코드 컨벤션·과거 이슈 가이드
```

## 6. 자주 쓰는 명령어

```bash
npm install                  # 의존성
npm run dev                  # 개발 서버 (포트 3000)
npm run build                # 웹 빌드 (vite)
npm run lint                 # tsc --noEmit
npm run build:bank           # 문제 은행 재생성 (reviewed → part*.ts)
npx cap sync android         # 웹 자산 → 안드로이드 동기화
cd android && ./gradlew assembleDebug   # 로컬 디버그 APK (chmod +x gradlew 선행)
```
