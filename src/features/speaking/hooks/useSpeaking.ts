import { useRef } from 'react';
import { generateTTS } from '../../../lib/gemini';
import { generateContent as callGemini } from '../../../lib/geminiClient';
import { useSpeakingStore } from '../store';
import { SYSTEM_PROMPTS } from '../../../lib/prompts';

export function useSpeaking() {
  const store = useSpeakingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // 대화 히스토리를 직접 관리해 매 턴 전체 맥락을 전달한다 (프록시 경유 호환)
  const historyRef = useRef<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      store.setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && store.isRecording) {
      mediaRecorderRef.current.stop();
      store.setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    store.setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Transcribe
        const transcribeResponse = await callGemini({
          model: "gemini-3.1-flash-lite-preview",
          contents: [
            { inlineData: { data: base64data, mimeType: "audio/webm" } },
            { text: "Transcribe the English audio exactly as spoken." }
          ],
          config: { temperature: 0 }
        });

        const transcript = transcribeResponse.text || "";
        if (!transcript.trim()) {
          store.setLoading(false);
          return;
        }

        store.setMessages(prev => [...prev, { role: 'user', text: transcript }]);

        // Chat (히스토리 누적 방식)
        historyRef.current.push({ role: 'user', parts: [{ text: transcript }] });
        const chatResponse = await callGemini({
          model: "gemini-3.1-flash-lite-preview",
          contents: historyRef.current,
          config: {
            systemInstruction: SYSTEM_PROMPTS.SPEAKING_PARTNER,
            temperature: 0.7,
          }
        });
        const modelText = chatResponse.text || "I'm sorry, I didn't catch that.";
        historyRef.current.push({ role: 'model', parts: [{ text: modelText }] });

        store.setMessages(prev => [...prev, { role: 'model', text: modelText }]);
        
        // TTS
        const audioUrl = await generateTTS(modelText);
        const audio = new Audio(audioUrl);
        audio.play();
        store.setLoading(false);
      };
    } catch (error: any) {
      console.error(error);
      if (error?.message === "RATE_LIMIT" || error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
        store.setMessages(prev => [...prev, { role: 'model', text: "[시스템 안내] 일일 AI 사용량이 초과되었습니다." }]);
      } else {
        store.setMessages(prev => [...prev, { role: 'model', text: "Sorry, an error occurred." }]);
      }
      store.setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (store.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    ...store,
    toggleRecording
  };
}
