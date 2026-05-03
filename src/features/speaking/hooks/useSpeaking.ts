import { useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { generateTTS } from '../../../lib/gemini';
import { useSpeakingStore } from '../store';
import { SYSTEM_PROMPTS } from '../../../lib/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useSpeaking() {
  const store = useSpeakingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-flash-lite-preview",
      config: {
        systemInstruction: SYSTEM_PROMPTS.SPEAKING_PARTNER,
        temperature: 0.7,
      }
    });
  }, []);

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
        const transcribeResponse = await ai.models.generateContent({
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

        // Chat
        const chatResponse = await chatRef.current.sendMessage({ message: transcript });
        const modelText = chatResponse.text || "I'm sorry, I didn't catch that.";
        
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
