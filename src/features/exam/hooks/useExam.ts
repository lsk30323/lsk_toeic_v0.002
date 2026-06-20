import { useExamStore } from '../store';
import { generateQuestion, getAICoachFeedback, generateTTS } from '../../../lib/gemini';
import { nativeTTSAvailable } from '../../../lib/speech';
import { getRandomBankQuestion, getBankExamples } from '../../../data/questionBank';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';

export function useExam() {
  const { user } = useAuth();
  const store = useExamStore();
  const [loading, setLoading] = useState(false);

  const startExam = async () => {
    setLoading(true);
    try {
      // 검수 완료된 로컬 문제 은행 우선 사용, 없으면 AI 생성 폴백 (2 LC, 3 RC)
      const fetchOne = (type: 'LC' | 'RC', subtype?: 'PART1') => {
        const bankQ = getRandomBankQuestion(type, subtype);
        // audioUrl 주입 시 은행 원본이 오염되지 않도록 복사본 사용
        return bankQ ? { ...bankQ } : generateQuestion(type, subtype, getBankExamples(type, subtype, 2));
      };

      // Part 1은 실제 사진이 핵심이라 AI Vision 생성을 우선(실패 시 은행 폴백)
      const fetchPart1 = async () => {
        try {
          return await generateQuestion('LC', 'PART1', getBankExamples('LC', 'PART1', 2));
        } catch (e) {
          return getRandomBankQuestion('LC', 'PART1') ?? generateQuestion('LC');
        }
      };

      const [q1, q2, q3, q4, q5] = await Promise.all([
        fetchPart1(),
        fetchOne('LC'),
        fetchOne('RC'),
        fetchOne('RC'),
        fetchOne('RC')
      ]);
      
      // 오디오: 기기 내장 음성이 가능하면 시험 화면에서 즉시 읽어주므로 생성 단계를 건너뛴다(빠른 시작).
      // 내장 음성이 없을 때만 서버(Gemini) TTS로 미리 음성 파일을 만든다. (TTS 실패는 시험 시작을 막지 않음)
      if (!nativeTTSAvailable()) {
        const safeTTS = async (q: { script?: string; audioUrl?: string }) => {
          if (!q.script) return;
          try {
            q.audioUrl = await generateTTS(q.script);
          } catch (e) {
            console.warn("TTS generation skipped or failed", e);
          }
        };
        await Promise.all([safeTTS(q1), safeTTS(q2)]);
      }

      store.startExam([q1, q2, q3, q4, q5]);
    } catch (error: any) {
      console.error("Exam Start Error:", error);
      if (error?.message === "RATE_LIMIT") {
        alert("일일 AI 사용량이 초과되었습니다. 내일 다시 시도해주세요. (API Quota Exceeded)");
      } else {
        alert("문제 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const finishExam = async () => {
    const { questions, answers } = store;
    
    // Calculate score
    let correctCount = 0;
    answers.forEach((ans, i) => {
      if (ans === questions[i].answer) correctCount++;
    });
    
    const finalScore = Math.round((correctCount / questions.length) * 990);
    
    try {
      const feedback = await getAICoachFeedback(finalScore, 990);
      store.finishExam(finalScore, feedback);

      if (user) {
        await addDoc(collection(db, 'exam_results'), {
          userId: user.uid,
          score: finalScore,
          type: 'Practice',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Exam Finish Error:", error);
      store.finishExam(finalScore, "피드백을 불러오는 중 오류가 발생했습니다.");
    }
  };

  return {
    ...store,
    loading,
    startExam,
    finishExam
  };
}
