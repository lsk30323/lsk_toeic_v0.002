import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_PROMPTS } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Question {
  type: "LC" | "RC";
  question: string;
  script?: string;
  passage?: string;
  options: string[];
  answer: number;
  explanation: string;
  audioUrl?: string;
  imageUrl?: string;
}

// Pexels CC-licensed image URLs for Part 1 — Gemini Vision analyzes them at runtime
// so question content always matches the actual photo (no hardcoded descriptions needed).
const PART1_PIC_URLS = [
  "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1051826/pexels-photo-1051826.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800"
];

// Fetch an image URL and convert to base64 inline data for Gemini multimodal input.
// Pexels CDN serves Access-Control-Allow-Origin: * so browser fetch works fine.
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(',');
      const header = dataUrl.substring(0, commaIdx);
      const data = dataUrl.substring(commaIdx + 1);
      const mimeMatch = header.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      resolve({ data, mimeType });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function generateQuestion(type: "LC" | "RC", subtype?: "PART1" | "PART2" | "PART3" | "PART4" | "PART5" | "PART6" | "PART7" | "RANDOM"): Promise<Question> {
  let prompt = SYSTEM_PROMPTS.QUESTION_GENERATOR(type, subtype);

  // For Part 1, use Gemini Vision: send the actual photo and let the model
  // generate a question based on what it actually sees (perfect image-question match).
  let imageUrl: string | null = null;
  let imagePart: { inlineData: { mimeType: string; data: string } } | null = null;
  const isPart1 = type === "LC" && (subtype === "PART1" || (!subtype || subtype === "RANDOM"));
  if (isPart1) {
    imageUrl = PART1_PIC_URLS[Math.floor(Math.random() * PART1_PIC_URLS.length)];
    try {
      const img = await fetchImageAsBase64(imageUrl);
      imagePart = { inlineData: { mimeType: img.mimeType, data: img.data } };
      prompt += `\n\nThis is a TOEIC Part 1 question. LOOK CAREFULLY at the attached photo and generate a question where one of the four options (A, B, C, D) accurately describes what you see in the photo. The other three options must be plausible distractors that DO NOT match the photo. The JSON response MUST include the field "imageUrl" set to exactly this string: "${imageUrl}".`;
    } catch (e) {
      // Fallback to text-only if image fetch fails (CORS, network, etc.)
      console.warn("Part 1 image fetch failed, falling back to text-only mode:", e);
      prompt += `\n\nGenerate a TOEIC Part 1 question describing a generic office or workplace scene. Include "imageUrl": "${imageUrl}" in the JSON response.`;
      imagePart = null;
    }
  }

  prompt += "\n\nCRITICAL: You MUST return ONLY valid JSON without any markdown formatting (no ```json or ```). The JSON must be an object with the following fields: 'type' (string, 'LC' or 'RC'), 'imageUrl' (string, optional, only for Part 1), 'question' (string), 'script' (string, required for LC, otherwise null), 'passage' (string, for RC Part 6/7, otherwise null/empty), 'options' (array of strings. Make sure it stays matching the answer index.), 'answer' (number corresponding to correct option index), 'explanation' (string in Korean).";

  try {
    const contents = imagePart
      ? [{ parts: [{ text: prompt }, imagePart] }]
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview", // Use flash lite to be faster and less prone to timeouts
      contents: contents as any,
      config: {
        temperature: 0.7,
      }
    });

    let text = response.text;
    if (!text) throw new Error("Failed to generate question");

    // Clean up potential markdown formatting
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text) as Question;
    // Ensure imageUrl is set correctly even if AI omits or alters it
    if (isPart1 && imageUrl && !parsed.imageUrl) {
      parsed.imageUrl = imageUrl;
    }
    return parsed;
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
      throw new Error("RATE_LIMIT");
    }

    // Check if error is a proxy or transient network error
    if (error?.message?.includes("Rpc failed") || error?.message?.includes("xhr error")) {
      console.warn("Transient Gemini API Error, retrying...", error);
      throw error; // Let the caller handle the retry, or we can handle it here recursively
    }

    console.error("JSON Parsing/Generation Error:", error);
    throw new Error("Invalid AI response format");
  }
}

export async function generateYoutubeQuestion(title: string, description: string): Promise<Question> {
  const prompt = `You are a TOEIC question generator. Based on the following YouTube video title and description, create a TOEIC Listening (LC) style question (multiple choice with 4 options).
The question and options must be in English. The explanation must be in Korean.

Title: ${title}
Description: ${description}

CRITICAL: Return ONLY valid JSON without any markdown wrappers.
Format:
{
  "type": "LC",
  "question": "The question here... (e.g. What is the main topic of the video?)",
  "script": "A short summary or script based on the video context...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0, // index of the correct option (0-3)
  "explanation": "해설 (Korean) - 왜 정답인지 설명..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    let text = response.text;
    if (!text) throw new Error("Failed to generate question");
    
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(text) as Question;
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
      throw new Error("RATE_LIMIT");
    }
    console.error("YouTube Question Gen Error:", error);
    throw new Error("Invalid AI response format");
  }
}

function pcmToWavUrl(base64Pcm: string, sampleRate = 24000): string {
  const binaryString = atob(base64Pcm);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  const wavBytes = new Uint8Array(44 + pcmData.length);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(pcmData, 44);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function generateTTS(text: string): Promise<string> {
  const voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const randomVoice = voices[Math.floor(Math.random() * voices.length)];

  // truncate text to avoid payload limits
  const safeText = text.substring(0, 500);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: safeText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: randomVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate TTS");
    
    return pcmToWavUrl(base64Audio);
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
      throw new Error("RATE_LIMIT");
    }
    throw error;
  }
}

export async function getAICoachFeedback(score: number, total: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: SYSTEM_PROMPTS.AI_COACH(score, total),
      config: {
        temperature: 0.7, // Keep some variety for feedback
      }
    });
    return response.text || "수고하셨습니다! 계속해서 꾸준히 연습하세요.";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
      return "무료 사용량이 초과되었습니다. 다음 달 또는 할당량 갱신 후 이용해주세요.";
    }
    console.error("Feedback generation error:", error);
    return "피드백을 생성하는 중 오류가 발생했습니다.";
  }
}

