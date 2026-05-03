import React, { useState, useRef, useEffect } from "react";
import { generateTTS } from "../lib/gemini";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { ALL_TOEIC_SENTENCES, ToeicSentence } from "../data/toeicSentences";

export default function Dictation() {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentSentenceInfo, setCurrentSentenceInfo] = useState<ToeicSentence | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadNewSentence = async () => {
    setLoading(true);
    setIsChecked(false);
    setUserInput("");
    setAudioUrl(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const sentenceInfo =
        ALL_TOEIC_SENTENCES[Math.floor(Math.random() * ALL_TOEIC_SENTENCES.length)];
      setCurrentSentenceInfo(sentenceInfo);
      const audio = await generateTTS(sentenceInfo.english);
      setAudioUrl(audio);
    } catch (error: any) {
      console.error(error);
      if (error?.message === "RATE_LIMIT" || error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
        alert("일일 AI 사용량이 초과되었습니다. 다음 달 또는 할당량 갱신 후 이용해주세요.");
      } else {
        alert("음성을 생성하는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    setIsChecked(true);
  };

  const renderComparison = () => {
    if (!isChecked || !currentSentenceInfo) return null;

    const correctWords = currentSentenceInfo.english
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .split(" ");
    const userWords = userInput.toLowerCase().replace(/[.,!?]/g, "").split(" ");

    let score = 0;
    const wordElements = correctWords.map((word, i) => {
      const isCorrect = userWords[i] === word;
      if (isCorrect) score++;

      return (
        <span
          key={i}
          className={cn(
            "mr-1",
            isCorrect
              ? "text-green-600 dark:text-green-400 font-bold"
              : "text-red-500 dark:text-red-400 line-through",
          )}
        >
          {userWords[i] || "___"}
        </span>
      );
    });

    return (
      <div className="mt-4 md:mt-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">
            결과
          </h4>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-[10px] md:text-xs font-bold">
            {score} / {correctWords.length} 단어 일치
          </span>
        </div>

        <div className="mb-4">
          <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">
            나의 입력
          </p>
          <div className="text-sm md:text-lg leading-relaxed">
            {wordElements}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">
              정답 (영어)
            </p>
            <p className="text-sm md:text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {currentSentenceInfo.english}
            </p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">
              해석 (한국어)
            </p>
            <p className="text-sm md:text-lg font-medium text-blue-700 dark:text-blue-400 leading-relaxed">
              {currentSentenceInfo.korean}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-headline">
            받아쓰기 연습
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            음성을 듣고 정확하게 타이핑해보세요.
          </p>
        </div>
        <button
          onClick={loadNewSentence}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}새 문장
          듣기
        </button>
      </div>

      {loading && (
        <div className="glass-card p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm md:text-base">음성을 생성하고 있습니다...</p>
        </div>
      )}

      {!loading && audioUrl && (
        <div className="glass-card p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex flex-col items-center justify-center py-4 md:py-8">
            <audio ref={audioRef} src={audioUrl} preload="auto" />
            <button
              onClick={playAudio}
              className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 text-white dark:text-gray-900 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 ml-1 md:ml-2" />
            </button>
            <p className="mt-4 text-xs md:text-sm text-gray-500 font-medium">
              버튼을 눌러 음성을 재생하세요
            </p>
          </div>

          <div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isChecked}
              placeholder="들은 문장을 여기에 입력하세요..."
              className="w-full h-24 md:h-32 p-3 md:p-4 text-sm md:text-base border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-500 bg-transparent"
            />
          </div>

          {!isChecked ? (
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm md:text-base"
            >
              정답 확인하기
            </button>
          ) : (
            renderComparison()
          )}
        </div>
      )}

      {!loading && !audioUrl && (
        <div className="glass-card p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center text-gray-500 text-sm md:text-base">
          '새 문장 듣기' 버튼을 눌러 학습을 시작하세요.
        </div>
      )}
    </div>
  );
}
