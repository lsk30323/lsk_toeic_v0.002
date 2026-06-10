# TOEIC 문제 조사·검수 에이전트 파이프라인

Claude Code 에이전트 집합으로 양질의 TOEIC LC/RC 문제를 조사·작성·검수하여
앱의 정적 문제 은행(`src/data/questionBank/`)에 반영하는 파이프라인입니다.

## 에이전트 구성 (`.claude/agents/`)

| # | 에이전트 | 역할 |
|---|---|---|
| 1 | `agent1-repo-integrator` | 검수 완료 데이터의 레포지토리 적합성 최종 판단·정리·통합 |
| 2 | `agent2-lc-reviewer` | 3~6번이 보낸 데이터가 LC 형식에 부합하는지 판단·검수·정리 |
| 3 | `agent3-lc-part1-researcher` | LC Part 1 (사진 묘사) 조사 → 2번에 검수 요청 |
| 4 | `agent4-lc-part2-researcher` | LC Part 2 (질의응답) 조사 → 2번에 검수 요청 |
| 5 | `agent5-lc-part3-researcher` | LC Part 3 (짧은 대화) 조사 → 2번에 검수 요청 |
| 6 | `agent6-lc-part4-researcher` | LC Part 4 (짧은 담화) 조사 → 2번에 검수 요청 |
| 7 | `agent7-rc-reviewer` | 8~10번이 보낸 데이터가 RC 형식에 부합하는지 판단·검수·정리. Part 7 데이터 최대 활용 |
| 8 | `agent8-rc-part5-researcher` | RC Part 5 (단문 공란) 조사 → 7번에 검수 요청 |
| 9 | `agent9-rc-part6-researcher` | RC Part 6 (장문 공란) 조사 → 7번에 검수 요청 |
| 10 | `agent10-rc-part7-researcher` | RC Part 7 (독해) 대량 조사 (누적 목표 2000+, 배치 반복 실행) → 7번에 검수 요청 |

## 데이터 흐름

```
3~6번 (LC 조사)  ──▶ staging/lc_part1~4.json   ──▶ 2번 검수 ──▶ reviewed/lc_part1~4.json ─┐
8~10번 (RC 조사) ──▶ staging/rc_part5~7*.json  ──▶ 7번 검수 ──▶ reviewed/rc_part5~7.json ─┤
                                                                                          ▼
                                          1번 통합: node question_pipeline/build_bank.cjs
                                                  ──▶ src/data/questionBank/part1~7.ts
```

- 앱은 `getRandomBankQuestion()`(문제 은행)을 우선 사용하고, 은행이 비어 있으면 기존 Gemini 실시간 생성으로 폴백합니다 (`useStudy`, `useExam`).
- Part 7 staging 파일은 `rc_part7_<배치번호>.json`으로 누적합니다. 2000문제 목표는 10번 에이전트를 배치 반복 실행해 채웁니다.
- 저작권: ETS 실제 기출 문제의 복제는 금지합니다. 에이전트는 출제 유형·형식을 조사한 뒤 오리지널 문제를 작성합니다.

## 재실행 방법

1. 조사 에이전트(3~6, 8~10) 실행 → `staging/`에 JSON 누적
2. 검수 에이전트(2, 7) 실행 → `reviewed/`에 검수 통과분 저장
3. `node question_pipeline/build_bank.cjs` → `src/data/questionBank/part1~7.ts` 재생성
4. `npx tsc --noEmit`으로 검증 후 커밋
