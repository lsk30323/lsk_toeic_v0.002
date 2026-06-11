import { Question } from '../../lib/gemini';
import { PART1_QUESTIONS } from './part1';
import { PART2_QUESTIONS } from './part2';
import { PART3_QUESTIONS } from './part3';
import { PART4_QUESTIONS } from './part4';
import { PART5_QUESTIONS } from './part5';
import { PART6_QUESTIONS } from './part6';
import { PART7_QUESTIONS } from './part7';

// 검수 파이프라인(question_pipeline/)을 통과한 정적 TOEIC 문제 은행.
// 데이터 갱신은 `node question_pipeline/build_bank.cjs`로 수행한다 (직접 수정 금지).
export interface BankQuestion extends Question {
  id: string;
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const BANK: Record<number, BankQuestion[]> = {
  1: PART1_QUESTIONS,
  2: PART2_QUESTIONS,
  3: PART3_QUESTIONS,
  4: PART4_QUESTIONS,
  5: PART5_QUESTIONS,
  6: PART6_QUESTIONS,
  7: PART7_QUESTIONS
};

export type Subtype = 'PART1' | 'PART2' | 'PART3' | 'PART4' | 'PART5' | 'PART6' | 'PART7' | 'RANDOM';

const LC_PARTS = [1, 2, 3, 4];
const RC_PARTS = [5, 6, 7];

// 같은 문제가 연달아 나오지 않도록 최근 출제 id를 기억한다.
const recentIds: string[] = [];
const RECENT_LIMIT = 30;

function pickRandom(pool: BankQuestion[]): BankQuestion | null {
  if (pool.length === 0) return null;
  const fresh = pool.filter(q => !recentIds.includes(q.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  recentIds.push(picked.id);
  if (recentIds.length > RECENT_LIMIT) recentIds.shift();
  return picked;
}

export function getRandomBankQuestion(type: 'LC' | 'RC', subtype?: Subtype): BankQuestion | null {
  let parts: number[];
  if (subtype && subtype !== 'RANDOM') {
    const part = Number(subtype.replace('PART', ''));
    // 잘못된 조합(LC인데 PART5 등)은 type 기준으로 무시
    parts = (type === 'LC' ? LC_PARTS : RC_PARTS).includes(part) ? [part] : (type === 'LC' ? LC_PARTS : RC_PARTS);
  } else {
    parts = type === 'LC' ? LC_PARTS : RC_PARTS;
  }
  const pool = parts.flatMap(p => BANK[p]);
  return pickRandom(pool);
}

export function getBankCounts(): Record<number, number> {
  return Object.fromEntries(Object.entries(BANK).map(([part, list]) => [part, list.length]));
}
