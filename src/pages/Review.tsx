import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Loader2, CheckCircle2, XCircle, BrainCircuit, Sparkles, AlertCircle, Youtube } from "lucide-react";
import { cn } from "../lib/utils";
import { calculateSM2 } from "../lib/srs";
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPTS } from "../lib/prompts";

interface WrongAnswer {
  id: string;
  type: string;
  question: string;
  script?: string;
  passage?: string;
  options: string[];
  answer: number;
  explanation: string;
  reviewCount: number;
  easeFactor?: number;
  interval?: number;
  repetition?: number;
  nextReviewDate: string;
}

export default function Review() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<{ whyWrong: string; whyCorrect: string; tip: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchWrongAnswers = async () => {
      try {
        const q = query(
          collection(db, "wrong_answers"),
          where("userId", "==", user.uid),
        );
        const snap = await getDocs(q);
        const now = new Date();
        const data = snap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((doc: any) => new Date(doc.nextReviewDate) <= now) as WrongAnswer[];
        // Shuffle
        setQuestions(data.sort(() => Math.random() - 0.5));
      } catch (error: any) {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn('Firestore is offline, could not fetch wrong_answers.');
        } else {
          handleFirestoreError(error, OperationType.GET, "wrong_answers");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWrongAnswers();
  }, [user]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleRate = async (quality: number) => {
    try {
      const easeFactor = currentQuestion.easeFactor ?? 2.5;
      const interval = currentQuestion.interval ?? 0;
      const repetition = currentQuestion.repetition ?? 0;

      const srsResult = calculateSM2(quality, repetition, easeFactor, interval);
      
      // If quality is high and it's been reviewed successfully multiple times, we could delete it.
      // But for Anki, we usually just keep increasing the interval.
      // Let's delete it if the interval gets larger than 30 days (mastered).
      if (srsResult.interval > 30) {
        await deleteDoc(doc(db, "wrong_answers", currentQuestion.id));
      } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + srsResult.interval);

        await updateDoc(doc(db, "wrong_answers", currentQuestion.id), {
          easeFactor: srsResult.easeFactor,
          interval: srsResult.interval,
          repetition: srsResult.repetitions,
          nextReviewDate: nextDate.toISOString(),
          reviewCount: currentQuestion.reviewCount + 1,
        });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `wrong_answers/${currentQuestion.id}`,
      );
    } finally {
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAiAnalysis(null);
    setIsAiLoading(false);
    setAiError(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleAskAI = async () => {
    if (!currentQuestion || selectedAnswer === null) return;
    
    setIsAiLoading(true);
    setAiError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const promptText = `
        문제: ${currentQuestion.question}
        보기: ${currentQuestion.options.map((o, idx) => `[${idx}] ${o}`).join(', ')}
        정답 보기 인덱스(0부터 시작): ${currentQuestion.answer}
        사용자가 선택한 오답 보기 인덱스: ${selectedAnswer}
        스크립트/추가문맥: ${currentQuestion.script || '없음'}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: promptText,
        config: {
          systemInstruction: SYSTEM_PROMPTS.REVIEW_AI_TUTOR,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whyWrong: {
                type: Type.STRING,
                description: "사용자가 선택한 오답이 왜 틀린 것인지에 대한 친절하고 명확한 설명",
              },
              whyCorrect: {
                type: Type.STRING,
                description: "정답이 왜 정답인지에 대한 논리적인 해설",
              },
              tip: {
                type: Type.STRING,
                description: "이런 유형의 문제를 다시 틀리지 않기 위한 핵심 꿀팁이나 문법/어휘 포인트",
              },
            },
            required: ["whyWrong", "whyCorrect", "tip"],
          },
        },
      });

      const jsonStr = response.text || "{}";
      const parsed = JSON.parse(jsonStr);
      setAiAnalysis({
        whyWrong: parsed.whyWrong || "",
        whyCorrect: parsed.whyCorrect || "",
        tip: parsed.tip || "",
      });
    } catch (err: any) {
      console.error("AI Tutor Error:", err);
      if (err?.message?.includes("429") || err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("exceeded your current quota")) {
        setAiError("일일 AI 사용량이 초과되었습니다. 할당량 갱신 후 이용해주세요.");
      } else {
        setAiError("AI 해설을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          복습할 오답이 없습니다!
        </h2>
        <p className="text-gray-500">
          훌륭합니다. 현재 복습 주기가 돌아온 문제가 없습니다.
        </p>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="glass-card p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          오늘의 복습 완료!
        </h2>
        <p className="text-gray-500 mb-6">모든 오답을 한 번씩 확인했습니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-blue-700"
        >
          다시 확인하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-headline flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-blue-600" />
            스마트 오답 노트
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            망각 곡선(Anki SRS) 기반으로 최적의 타이밍에 복습합니다.
          </p>
        </div>
        <div className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold text-gray-700 dark:text-gray-300 text-center text-sm md:text-base">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="glass-card p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
            {currentQuestion.type}
          </span>
          {(currentQuestion as any).source === 'youtube' && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Youtube className="w-3 h-3" />
              YouTube
            </span>
          )}
          <span className="text-xs md:text-sm text-gray-500 font-medium">
            복습 횟수: {currentQuestion.reviewCount}
          </span>
        </div>

        {currentQuestion.type === "RC" && currentQuestion.passage && currentQuestion.passage.trim() !== "" && currentQuestion.passage.trim() !== currentQuestion.question.trim() && (
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span className="font-bold text-gray-700 dark:text-gray-300">지문 (Passage)</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {currentQuestion.passage}
            </div>
          </div>
        )}

        {(currentQuestion as any).source === 'youtube' && (currentQuestion as any).videoId && (
          <div className="aspect-video w-full rounded-xl overflow-hidden glass-card border border-gray-100 dark:border-gray-800">
            <iframe
              src={`https://www.youtube.com/embed/${(currentQuestion as any).videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}

        <div className="text-base md:text-lg font-medium text-gray-900">
          {currentQuestion.question}
        </div>

        <div className="space-y-2 md:space-y-3">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = currentQuestion.answer === i;
            const showStatus = showExplanation;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all flex items-center justify-between text-sm md:text-base",
                  !showStatus &&
                    "border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  showStatus &&
                    isCorrect &&
                    "border-green-500 bg-green-50 dark:bg-green-900/20",
                  showStatus &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-500 bg-red-50 dark:bg-red-900/20",
                  showStatus &&
                    !isSelected &&
                    !isCorrect &&
                    "border-gray-100 dark:border-gray-800 opacity-50",
                )}
              >
                <span className="flex-1 pr-2">
                  <span className="font-bold mr-2 md:mr-3 text-gray-400">
                    {(i + 10).toString(36).toUpperCase()}.
                  </span>{" "}
                  {opt}
                </span>
                {showStatus && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                {showStatus && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 md:mt-8 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-sm md:text-base">
                해설
              </h4>
              <p className="text-blue-800 dark:text-blue-200 mb-4 text-sm md:text-base">
                {currentQuestion.explanation}
              </p>

              {currentQuestion.script && (
                <>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 mt-4 text-sm md:text-base">
                    스크립트
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap text-sm md:text-base">
                    {currentQuestion.script}
                  </p>
                </>
              )}
            </div>

            {/* AI Tutor Section */}
            {selectedAnswer !== currentQuestion.answer && showExplanation && (
              <div className="pt-2">
                {!aiAnalysis && !isAiLoading && (
                  <button
                    onClick={handleAskAI}
                    className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm md:text-base border border-purple-200 dark:border-purple-800"
                  >
                    <Sparkles className="w-5 h-5" />
                    AI 튜터에게 1:1 맞춤형 해설 받기
                  </button>
                )}

                {isAiLoading && (
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
                    <p className="text-purple-800 dark:text-purple-300 text-sm font-medium">
                      오답 원인을 분석하고 있습니다...
                    </p>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 dark:text-red-300 text-sm">
                      {aiError}
                    </p>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="p-5 md:p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-bold text-purple-900 dark:text-purple-100">
                        AI 튜터의 맞춤 해설
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs md:text-sm font-bold text-red-600 dark:text-red-400 mb-1">
                          ❌ 내가 선택한 오답 분석
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                          {aiAnalysis.whyWrong}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400 mb-1">
                          ✅ 정답인 이유
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                          {aiAnalysis.whyCorrect}
                        </p>
                      </div>

                      <div className="pt-2">
                        <div className="bg-yellow-100/50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                          <h5 className="text-xs md:text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-1 flex items-center gap-1">
                            💡 핵심 꿀팁
                          </h5>
                          <p className="text-yellow-900 dark:text-yellow-200 text-sm md:text-base font-medium">
                            {aiAnalysis.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-center text-sm font-bold text-gray-500 mb-4">
                이 문제, 어떠셨나요? (기억력 평가)
              </h4>
              {selectedAnswer !== currentQuestion.answer ? (
                <button
                  onClick={() => handleRate(1)}
                  className="w-full py-3 md:py-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm md:text-base"
                >
                  다시 학습 (틀림)
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <button
                    onClick={() => handleRate(3)}
                    className="py-3 md:py-4 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl font-bold hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm md:text-base flex flex-col items-center justify-center gap-1"
                  >
                    <span>어려움</span>
                    <span className="text-[10px] md:text-xs font-normal opacity-70">Hard</span>
                  </button>
                  <button
                    onClick={() => handleRate(4)}
                    className="py-3 md:py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm md:text-base flex flex-col items-center justify-center gap-1"
                  >
                    <span>보통</span>
                    <span className="text-[10px] md:text-xs font-normal opacity-70">Good</span>
                  </button>
                  <button
                    onClick={() => handleRate(5)}
                    className="py-3 md:py-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm md:text-base flex flex-col items-center justify-center gap-1"
                  >
                    <span>쉬움</span>
                    <span className="text-[10px] md:text-xs font-normal opacity-70">Easy</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
