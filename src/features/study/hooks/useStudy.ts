import { useStudyStore } from '../store';
import { generateQuestion, generateTTS } from '../../../lib/gemini';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

export function useStudy() {
  const { user } = useAuth();
  const store = useStudyStore();

  const fetchQuestion = async (type: 'LC' | 'RC', subtype?: 'PART1' | 'PART2' | 'PART3' | 'PART4' | 'PART5' | 'PART6' | 'PART7' | 'RANDOM', retries = 2) => {
    store.setLoading(true);
    store.setAnswer(null);
    store.setShowExplanation(false);
    store.setAudioUrl(null);
    
    try {
      const q = await generateQuestion(type, subtype);
      store.setQuestion(q);
      
      // Release loading state after question is ready, even if audio follows
      store.setLoading(false);
      
      if (type === 'LC' && q.script) {
        try {
          const audio = await generateTTS(q.script);
          store.setAudioUrl(audio);
        } catch (ttsErr) {
          console.warn("TTS Generation skipped or failed", ttsErr);
        }
      }
    } catch (error: any) {
      // Re-ensure loading is false on error
      store.setLoading(false);
      console.error("Study Fetch Error:", error);
      
      if (error?.message?.includes("Rpc failed") || error?.message?.includes("xhr error")) {
        if (retries > 0) {
           console.warn(`Transient API error. Retrying... (${retries} attempts left)`);
           await new Promise(res => setTimeout(res, 1000));
           return fetchQuestion(type, subtype, retries - 1);
        }
      }

      if (error?.message === "RATE_LIMIT") {
        alert("일일 AI 사용량이 초과되었습니다. 내일 다시 시도해주세요. (API Quota Exceeded)");
      } else {
        alert("문제 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      store.setLoading(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (store.selectedAnswer !== null) return;
    store.setAnswer(index);
    store.setShowExplanation(true);

    if (index !== store.question?.answer && user && store.question) {
      // Save to wrong answers
      try {
        await addDoc(collection(db, 'wrong_answers'), {
          userId: user.uid,
          ...store.question,
          reviewCount: 0,
          nextReviewDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error saving wrong answer:", error);
      }
    }
  };

  return {
    ...store,
    fetchQuestion,
    handleAnswer
  };
}
