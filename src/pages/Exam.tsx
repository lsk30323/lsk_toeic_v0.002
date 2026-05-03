import React, { useEffect } from "react";
import { useExam } from "../features/exam/hooks/useExam";
import { Loader2, Timer, Trophy } from "lucide-react";
import { cn } from "../lib/utils";

export default function Exam() {
  const {
    started,
    finished,
    loading,
    questions,
    currentIdx,
    answers,
    timeLeft,
    score,
    feedback,
    startExam,
    setAnswer,
    nextQuestion,
    finishExam,
    tick,
  } = useExam();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && !finished && timeLeft > 0) {
      timer = setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft === 0 && !finished && started) {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [started, finished, timeLeft, tick, finishExam]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      nextQuestion();
    } else {
      finishExam();
    }
  };

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-10 md:mt-20 px-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <TargetIcon className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-headline">
          미니 실전 모의고사
        </h1>
        <p className="text-sm md:text-lg text-gray-600 mb-8">
          총 5문제 (LC 2문제, RC 3문제)로 구성된 미니 모의고사입니다.
          <br className="hidden md:block" />
          제한 시간은 15분입니다. 준비가 되면 시작하세요.
        </p>
        <button
          onClick={startExam}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white dark:text-gray-900 rounded-xl font-bold text-base md:text-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
          시험 시작하기
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-6 md:mt-10 px-4">
        <div className="glass-card p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            시험 종료!
          </h2>
          <p className="text-sm md:text-base text-gray-500 mb-8">
            수고하셨습니다. 당신의 예상 점수는...
          </p>

          <div className="text-6xl md:text-7xl font-black text-blue-600 dark:text-blue-400 mb-2">
            {score}
          </div>
          <div className="text-sm md:text-base text-gray-400 font-medium mb-10">
            / 990 점
          </div>

          <div className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-left">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2 text-sm md:text-base">
              <span className="text-lg md:text-xl">🤖</span> AI 코치의 피드백
            </h3>
            <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {feedback || "피드백을 불러오는 중..."}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-8 px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm md:text-base"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between glass-card p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-[10px] md:text-xs">
            {currentIdx + 1} / {questions.length}
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-bold uppercase text-[10px] md:text-xs">
            {q.type}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 font-mono text-lg md:text-xl font-bold",
            timeLeft < 60 ? "text-red-600 dark:text-red-400" : "text-gray-900",
          )}
        >
          <Timer className="w-5 h-5 md:w-6 md:h-6" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="glass-card p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 md:space-y-8">
        {q.type === "LC" && q.audioUrl && (
          <div className="flex flex-col gap-4">
            {q.imageUrl && (
                <img src={q.imageUrl} loading="lazy" referrerPolicy="no-referrer" alt="TOEIC Part 1" className="w-full aspect-[4/3] max-w-lg mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm object-cover grayscale" />
            )}
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
              <audio ref={audioRef} src={q.audioUrl} preload="auto" />
              <button
                onClick={playAudio}
                className="w-12 h-12 bg-blue-600 text-white dark:text-gray-900 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
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

        {q.type === "RC" && q.passage && q.passage.trim() !== "" && q.passage.trim() !== q.question.trim() && (
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span className="font-bold text-gray-700 dark:text-gray-300">지문 (Passage)</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {q.passage}
            </div>
          </div>
        )}

        <div className="text-base md:text-lg font-medium text-gray-900 leading-relaxed">
          {q.question}
        </div>

        <div className="space-y-2 md:space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswer(i)}
              className={cn(
                "w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all flex items-center text-sm md:text-base",
                answers[currentIdx] === i
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                  : "border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300",
              )}
            >
              <span className="font-bold mr-2 md:mr-3 opacity-50">
                {(i + 10).toString(36).toUpperCase()}.
              </span>
              {opt}
            </button>
          ))}
        </div>

        <div className="pt-4 md:pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={handleNext}
            disabled={answers[currentIdx] === -1}
            className="w-full sm:w-auto px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm md:text-base"
          >
            {currentIdx === questions.length - 1 ? "제출하기" : "다음 문제"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
