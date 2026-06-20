// 기기 내장 음성합성(Web Speech API / 안드로이드 시스템 TTS)을 이용한 즉시 재생.
// 서버(Gemini) TTS는 생성에 수 초가 걸리지만, 내장 음성은 네트워크 없이 즉시 읽어준다.
// 내장 음성을 쓸 수 없는 환경에서만 Gemini TTS(파일 생성)로 폴백한다.

export function nativeTTSAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof (window as any).SpeechSynthesisUtterance !== 'undefined'
  );
}

// 일부 브라우저/WebView는 getVoices()가 비동기로 채워진다. 미리 한 번 호출해 워밍업한다.
if (nativeTTSAvailable()) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch { /* noop */ }
    };
  } catch { /* noop */ }
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!nativeTTSAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  return (
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null
  );
}

// 스크립트의 라벨((A)/(B)/(C)/(D), M:/W: 화자 표기)을 자연스러운 끊어 읽기로 정리한다.
function cleanForSpeech(text: string): string {
  return text
    .replace(/\s*\(([ABCD])\)\s*/g, '. ')
    .replace(/\b(M[12]?|W[12]?|Man|Woman)\s*:\s*/g, '. ')
    .replace(/\s*-{2,}\s*Passage\s*\d+\s*-{2,}\s*/gi, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function cancelNativeTTS(): void {
  if (nativeTTSAvailable()) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
}

// 내장 음성으로 즉시 읽기 시작. (사용자 제스처 없이 자동재생이 막히면 조용히 실패한다.)
export function speakNative(text: string, opts?: { rate?: number }): void {
  if (!nativeTTSAvailable() || !text) return;
  const synth = window.speechSynthesis;
  try {
    synth.cancel(); // 이전 발화 중단(중첩 방지)
    const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
    u.lang = 'en-US';
    u.rate = opts?.rate ?? 0.95;
    const v = pickEnglishVoice();
    if (v) u.voice = v;
    synth.speak(u);
  } catch (e) {
    console.warn('Native TTS failed', e);
  }
}
