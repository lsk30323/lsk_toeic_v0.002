import React, { useEffect } from "react";
import { useStudy } from "../features/study/hooks/useStudy";
import {
  Loader2,
  Headphones,
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Study({ type: initialType }: { type: "LC" | "RC" }) {
  const {
    loading,
    question,
    selectedAnswer,
    showExplanation,
    audioUrl,
    setType,
    fetchQuestion,
    handleAnswer,
  } = useStudy();

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  const [subtype, setSubtype] = React.useState<'RANDOM' | 'PART1' | 'PART2' | 'PART3' | 'PART4' | 'PART5' | 'PART6' | 'PART7'>('RANDOM');

  // Reset subtype to RANDOM when switching main LC/RC type
  useEffect(() => {
    setSubtype('RANDOM');
  }, [initialType]);

  useEffect(() => {
    setType(initialType);
    fetchQuestion(initialType, subtype);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType, setType]);

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {initialType === "LC" ? "듣기 (LC) 연습" : "읽기 (RC) 연습"}
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            AI가 생성한 맞춤형 문제로 연습하세요.
          </p>
        </div>
        <button
          onClick={() => fetchQuestion(initialType, subtype)}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}새 문제 생성
        </button>
      </div>

      {initialType === "RC" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSubtype('RANDOM')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'RANDOM'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            랜덤 출제
          </button>
          <button
            onClick={() => setSubtype('PART5')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART5'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            단문 빈칸 (Part 5)
          </button>
          <button
            onClick={() => setSubtype('PART6')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART6'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            장문 빈칸 (Part 6)
          </button>
          <button
            onClick={() => setSubtype('PART7')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART7'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            독해 (Part 7)
          </button>
        </div>
      )}

      {initialType === "LC" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSubtype('RANDOM')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'RANDOM'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            랜덤 출제
          </button>
          <button
            onClick={() => setSubtype('PART1')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART1'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            사진 묘사 (Part 1)
          </button>
          <button
            onClick={() => setSubtype('PART2')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART2'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            질의 응답 (Part 2)
          </button>
          <button
            onClick={() => setSubtype('PART3')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART3'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            짧은 대화 (Part 3)
          </button>
          <button
            onClick={() => setSubtype('PART4')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full font-medium transition-colors border",
              subtype === 'PART4'
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            짧은 담화 (Part 4)
          </button>
        </div>
      )}

      <div className="glass-card p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium animate-pulse">
              AI가 문제를 생성하고 있습니다...
            </p>
          </div>
        ) : question ? (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {initialType === "LC" && audioUrl && (
              <div className="flex flex-col gap-4">
                {question.imageUrl && (
                   <img src={question.imageUrl} loading="lazy" referrerPolicy="no-referrer" alt="TOEIC Part 1" className="w-full aspect-[4/3] max-w-lg mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm object-cover grayscale" />
                )}
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                  <audio ref={audioRef} src={audioUrl} preload="auto" />
                  <button
                    onClick={playAudio}
                    className="w-12 h-12 bg-blue-600 text-white dark:text-gray-900 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-100 text-sm md:text-base">
                      오디오 재생
                    </div>
                    <div className="text-xs md:text-sm text-blue-700 dark:text-blue-300">
                      대화문을 잘 듣고 문제를 푸세요.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {initialType === "RC" && question.passage && question.passage.trim() !== "" && question.passage.trim() !== question.question.trim() && (
              <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">지문 (Passage)</span>
                </div>
                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {question.passage}
                </div>
              </div>
            )}

            <div className="text-base md:text-lg font-medium text-gray-900 leading-relaxed">
              {question.question}
            </div>

            <div className="space-y-2 md:space-y-3">
              {question.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = question.answer === i;
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
              <div className="mt-6 md:mt-8 animate-in zoom-in-95 duration-300">
                <div className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-sm md:text-base">
                    해설
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 mb-4 text-sm md:text-base">
                    {question.explanation}
                  </p>

                  {question.script && (
                    <>
                      <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 mt-4 text-sm md:text-base">
                        스크립트
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap text-sm md:text-base">
                        {question.script}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            '새 문제 생성' 버튼을 눌러 학습을 시작하세요.
          </div>
        )}
      </div>
    </div>
  );
}
