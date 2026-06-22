// 기기 내장 음성합성(Web Speech API / 안드로이드 시스템 TTS)을 이용한 즉시 재생.
// 실제 토익 LC처럼 들리도록 화자/문항별로 미국(en-US)·영국(en-GB)·호주(en-AU) 억양을
// 번갈아 사용하고, 대화(Part 3)는 화자마다 다른 목소리로 읽는다.
// 내장 음성을 쓸 수 없는 환경에서만 Gemini TTS(파일 생성)로 폴백한다.

export function nativeTTSAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof (window as any).SpeechSynthesisUtterance !== 'undefined'
  );
}

// getVoices()가 비동기로 채워지는 환경을 위해 미리 워밍업한다.
if (nativeTTSAvailable()) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch { /* noop */ }
    };
  } catch { /* noop */ }
}

const ACCENTS = ['en-US', 'en-GB', 'en-AU'] as const;
type Accent = typeof ACCENTS[number];
type Gender = 'male' | 'female' | 'any';

// 문항이 바뀔 때마다 시작 억양을 돌려, 미·영·호 발음이 고르게 나오도록 한다.
let rotation = 0;

function normLang(l: string): string {
  return l.replace(/[_-]/g, '').toLowerCase();
}

function allEnVoices(): SpeechSynthesisVoice[] {
  if (!nativeTTSAvailable()) return [];
  const v = window.speechSynthesis.getVoices() || [];
  return v.filter(x => /^en/i.test(x.lang));
}

// 음성 이름으로 성별을 추정한다(베스트 에포트 — 안드로이드는 이름에 성별이 없을 수 있음).
function guessGender(name: string): Gender {
  const n = (name || '').toLowerCase();
  if (/(female|woman|samantha|karen|moira|tessa|fiona|serena|victoria|zira|hazel|catherine|kate|amy|emma|joanna|salli|nicole|olivia|aria|libby|natasha|sonia)/.test(n)) return 'female';
  if (/(\bmale\b|\bman\b|daniel|alex|rishi|oliver|george|david|james|fred|\blee\b|arthur|brian|matthew|\bguy\b|ryan|liam|william|jamie|gordon|russell)/.test(n)) return 'male';
  return 'any';
}

function pickVoice(accent: Accent, gender: Gender, idx: number): SpeechSynthesisVoice | null {
  const en = allEnVoices();
  if (en.length === 0) return null;
  const target = normLang(accent);
  let pool = en.filter(v => normLang(v.lang).startsWith(target));
  if (pool.length === 0) pool = en; // 해당 억양 음성이 설치 안 됨 → 다른 en 음성으로
  if (gender !== 'any') {
    const g = pool.filter(v => guessGender(v.name) === gender);
    if (g.length) pool = g;
  }
  return pool[idx % pool.length] || pool[0] || null;
}

// (A)/(B) 라벨, 화자 표기, 지문 구분선을 자연스러운 끊어 읽기로 정리한다.
function cleanText(t: string): string {
  return t
    .replace(/\(([ABCD])\)/g, '. ')
    .replace(/\b(?:M|W)[12]?\s*:\s*/g, '. ')
    .replace(/\b(?:Man|Woman)\s*:\s*/gi, '. ')
    .replace(/\s*-{2,}\s*Passage\s*\d+\s*-{2,}\s*/gi, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[.\s]+/, '')
    .trim();
}

function enqueue(text: string, accent: Accent, gender: Gender, idx: number): void {
  const clean = cleanText(text);
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = accent;
  u.rate = 0.92;
  const v = pickVoice(accent, gender, idx);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u); // 여러 번 호출하면 자동으로 순차 재생(큐)
}

// 화자 표기(M:/W:/M1:/Man:/Woman:)로 대화를 턴 단위로 분리한다.
function splitBySpeaker(script: string): { speaker: string; text: string }[] {
  const re = /(\b(?:M|W)[12]?|Man|Woman)\s*:\s*/g;
  const turns: { speaker: string; text: string }[] = [];
  let m: RegExpExecArray | null;
  let lastIdx = -1;
  let lastSpeaker = '';
  let prevEnd = 0;
  while ((m = re.exec(script)) !== null) {
    if (lastIdx >= 0) {
      turns.push({ speaker: lastSpeaker, text: script.slice(prevEnd, m.index) });
    }
    lastSpeaker = m[1].toUpperCase().replace('MAN', 'M').replace('WOMAN', 'W');
    lastIdx = m.index;
    prevEnd = m.index + m[0].length;
  }
  if (lastIdx >= 0) turns.push({ speaker: lastSpeaker, text: script.slice(prevEnd) });
  return turns;
}

export function cancelNativeTTS(): void {
  if (nativeTTSAvailable()) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
}

// 스크립트를 토익식 다중 화자/다중 억양으로 즉시 읽기 시작한다.
export function speakNative(script: string): void {
  if (!nativeTTSAvailable() || !script) return;
  try {
    window.speechSynthesis.cancel(); // 이전 발화 중단(중첩 방지)
    const base = rotation++ % ACCENTS.length;

    // 1) 화자 표기가 있는 대화(Part 3): 화자마다 다른 억양·성별 목소리
    const turns = splitBySpeaker(script);
    if (turns.length > 1) {
      const order: string[] = [];
      turns.forEach(t => { if (!order.includes(t.speaker)) order.push(t.speaker); });
      const map: Record<string, { accent: Accent; gender: Gender; idx: number }> = {};
      order.forEach((sp, i) => {
        map[sp] = {
          accent: ACCENTS[(base + i) % ACCENTS.length],
          gender: /^W/.test(sp) ? 'female' : /^M/.test(sp) ? 'male' : 'any',
          idx: i,
        };
      });
      turns.forEach(t => {
        const cfg = map[t.speaker];
        enqueue(t.text, cfg.accent, cfg.gender, cfg.idx);
      });
      return;
    }

    // 2) (A)(B)(C)[(D)] 보기가 있는 Part 1·2: 안내/질문과 보기를 다른 억양으로
    const opts = script.match(/\([ABCD]\)/g);
    if (opts && opts.length >= 3) {
      const firstOpt = script.search(/\([ABCD]\)/);
      const lead = script.slice(0, firstOpt).trim();
      const body = script.slice(firstOpt).trim();
      if (lead) {
        enqueue(lead, ACCENTS[base], 'any', 0);
        enqueue(body, ACCENTS[(base + 1) % ACCENTS.length], 'any', 1);
      } else {
        // Part 1: 한 명의 내레이터가 4개 문장을 읽음
        enqueue(body, ACCENTS[base], 'any', base);
      }
      return;
    }

    // 3) 단일 내레이션(Part 4 담화 등)
    enqueue(script, ACCENTS[base], 'any', base);
  } catch (e) {
    console.warn('Native TTS failed', e);
  }
}
