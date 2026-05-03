import { useExamStore } from '../store';
import { generateQuestion, getAICoachFeedback, generateTTS } from '../../../lib/gemini';
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
      // Generate questions in parallel (2 LC, 3 RC)
      const [q1, q2, q3, q4, q5] = await Promise.all([
        generateQuestion('LC', 'PART1'),
        generateQuestion('LC'),
        generateQuestion('RC'),
        generateQuestion('RC'),
        generateQuestion('RC')
      ]);
      
      // Generate audio in parallel for LC questions
      await Promise.all([
        (async () => { if (q1.script) q1.audioUrl = await generateTTS(q1.script); })(),
        (async () => { if (q2.script) q2.audioUrl = await generateTTS(q2.script); })()
      ]);

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
