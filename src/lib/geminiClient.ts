import { GoogleGenAI } from '@google/genai';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallableFromURL } from 'firebase/functions';

// Gemini 호출 단일 진입점.
// VITE_GEMINI_PROXY_URL이 설정되면 Firebase Functions 프록시(geminiProxy)를 경유해
// API 키가 앱 번들에 포함되지 않는다 (스토어 배포용). 미설정 시 기존처럼 직접 호출 (개발용).
const PROXY_URL: string | undefined = (import.meta as any).env?.VITE_GEMINI_PROXY_URL;

export interface GeminiResult {
  text?: string;
  candidates?: any[];
}

export interface GenerateContentParams {
  model: string;
  contents: any;
  config?: any;
}

let _ai: GoogleGenAI | null = null;
function getDirectAi(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

export async function generateContent(params: GenerateContentParams): Promise<GeminiResult> {
  if (PROXY_URL) {
    try {
      const fn = httpsCallableFromURL(getFunctions(getApp()), PROXY_URL);
      const res = await fn(params);
      return res.data as GeminiResult;
    } catch (e: any) {
      // 기존 호출부의 쿼터 검사(message.includes("429") 등)가 그대로 동작하도록 메시지를 정규화
      if (e?.code === 'functions/resource-exhausted' || e?.message?.includes('RATE_LIMIT')) {
        throw new Error('429 RESOURCE_EXHAUSTED: AI quota exceeded');
      }
      if (e?.code === 'functions/unauthenticated') {
        throw new Error('AI 기능을 사용하려면 로그인이 필요합니다.');
      }
      throw e;
    }
  }

  const response = await getDirectAi().models.generateContent(params as any);
  return { text: response.text, candidates: response.candidates as any[] };
}
