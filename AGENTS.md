# Project Guidelines & Encountered Issues

이 파일은 프로젝트 진행 중 반복적으로 발생한 이슈와 이를 해결하기 위한 가이드라인을 정리한 문서입니다.

## 반복된 이슈 및 해결 방안

### 1. 파일 편집 및 라인 드리프트 (File Editing & Line Drift)
- **이슈**: 대규모 리팩토링 시 `edit_file` 도구에서 "Target content not found" 에러가 빈번하게 발생했습니다. 특히 파일 끝에 중복 코드가 남거나 괄호가 꼬이는 문제가 있었습니다.
- **가이드라인**: 편집 직전에 반드시 `view_file`로 최신 상태를 확인하세요. 큰 변경 사항은 `multi_edit_file`을 사용하여 작은 단위로 나누어 적용하는 것이 안전합니다.

### 2. 오디오 중복 재생 문제 (Audio Overlap Management)
- **이슈**: LC(듣기) 파트에서 재생 버튼을 여러 번 누를 때 음성이 겹쳐서 출력되는 현상이 있었습니다.
- **가이드라인**: `useRef<HTMLAudioElement | null>(null)`를 사용하여 오디오 인스턴스를 관리하세요. 재생 전 기존 인스턴스를 `pause()`하고 `currentTime = 0`으로 초기화한 뒤 재생해야 합니다. 또한 `useEffect`의 cleanup 함수에서 오디오를 정지시켜야 합니다.

### 3. AI 프롬프트 관리 (AI Prompt Externalization)
- **이슈**: 서비스 로직 내부에 프롬프트가 하드코딩되어 있어 유지보수와 프롬프트 튜닝이 어려웠습니다.
- **가이드라인**: 모든 AI 시스템 지침(System Instructions)은 `src/lib/prompts.ts`에 상수로 정의하여 관리하세요.

### 4. 상태 관리 패턴 (Zustand Pattern)
- **이슈**: 각 기능별 스토어의 로딩 상태 처리나 초기화(reset) 로직이 일관되지 않았습니다.
- **가이드라인**: Zustand 스토어 구현 시 다음 패턴을 준수하세요:
  - `loading` 상태 포함.
  - 상태 초기화를 위한 `reset` 액션 구현.
  - 비즈니스 로직은 커스텀 훅(`useExam`, `useStudy` 등)에 캡슐화하여 UI와 분리.

### 5. AI 응답 안정성 (AI Response Stability)
- **이슈**: Gemini가 JSON 형식이 아닌 텍스트를 반환하거나 마크다운 블록을 포함할 때 파싱 에러가 발생했습니다.
- **가이드라인**: AI 응답 파싱 시 반드시 `try-catch`를 사용하고, 실패 시를 대비한 fallback 로직을 마련하세요. 프롬프트에 "JSON only"를 명시하는 것이 중요합니다.

## 프로젝트 컨벤션
- **스타일링**: Tailwind CSS (Mobile-First approach).
- **아이콘**: `lucide-react`.
- **애니메이션**: `motion/react`.
- **아키텍처**: `src/features/` 아래 도메인별 구조 유지. 로직은 hooks, 상태는 Zustand, UI는 pages에 배치.
