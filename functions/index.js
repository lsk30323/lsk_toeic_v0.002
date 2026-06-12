const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenAI } = require('@google/genai');

// Gemini API 키를 서버에만 보관하는 프록시 함수.
// 배포: firebase deploy --only functions
// 키 등록: firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const ALLOWED_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-tts-preview',
];

exports.geminiProxy = onCall(
  { secrets: [geminiApiKey], region: 'asia-northeast3', memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    // Firebase Auth 로그인 사용자만 호출 가능 (익명 로그인 포함)
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { model, contents, config } = request.data || {};
    if (!ALLOWED_MODELS.includes(model)) {
      throw new HttpsError('invalid-argument', `Unsupported model: ${model}`);
    }
    if (contents === undefined || contents === null) {
      throw new HttpsError('invalid-argument', 'contents is required');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return {
        text: response.text ?? null,
        candidates: response.candidates ?? null,
      };
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('exceeded your current quota')) {
        throw new HttpsError('resource-exhausted', 'RATE_LIMIT');
      }
      throw new HttpsError('internal', msg.slice(0, 300));
    }
  }
);
