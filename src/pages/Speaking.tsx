import React, { useEffect, useRef } from "react";
import { useSpeaking } from "../features/speaking/hooks/useSpeaking";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function Speaking() {
  const { isRecording, messages, loading, toggleRecording } = useSpeaking();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-headline">
          말하기 (Speaking) 연습
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          AI 원어민과 대화하며 스피킹 실력을 키우세요.
        </p>
      </div>

      <div className="flex-1 glass-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden mb-16 md:mb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2 md:px-5 md:py-3 text-sm md:text-base",
                  msg.role === "user"
                    ? "bg-blue-600 text-white dark:text-gray-900 rounded-br-none"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none",
                )}
              >
                {msg.role === "model" && (
                  <div className="flex items-center gap-2 mb-1 text-[10px] md:text-xs font-bold text-gray-500 uppercase">
                    <Volume2 className="w-3 h-3" /> AI Coach
                  </div>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 md:px-5 md:py-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 md:px-4 md:py-3 min-h-[48px] md:min-h-[56px] flex items-center text-xs md:text-sm">
              {isRecording ? (
                <span className="text-gray-900 dark:text-gray-100">
                  듣고 있습니다...
                </span>
              ) : (
                <span className="text-gray-400">
                  마이크 버튼을 눌러 말을 시작하세요.
                </span>
              )}
            </div>

            <button
              onClick={toggleRecording}
              disabled={loading}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : "bg-blue-600 text-white dark:text-gray-900 hover:bg-blue-700",
              )}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
