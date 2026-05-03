import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, Youtube as YoutubeIcon, BrainCircuit, CheckCircle2, XCircle, Play } from 'lucide-react';
import { generateYoutubeQuestion, Question } from '../lib/gemini';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '../components/ui/Skeleton';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

export default function YoutubePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('토익 LC 실전');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const searchVideos = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setVideos([]);
    setSelectedVideo(null);
    setQuestion(null);
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY is not set");
      }
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(searchQuery)}&type=video&key=${apiKey}`);
      const data = await response.json();
      if (data.items) {
        const parsedVideos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
        }));
        setVideos(parsedVideos);
      }
    } catch (error) {
      console.error("YouTube search error:", error);
      alert("YouTube 영상을 검색하는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchVideos(query);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(query);
  };

  const handleGenerateQuestion = async () => {
    if (!selectedVideo) return;
    setGenerating(true);
    setQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    try {
      const q = await generateYoutubeQuestion(selectedVideo.title, selectedVideo.description);
      setQuestion(q);
    } catch (error: any) {
      if (error?.message === "RATE_LIMIT") {
        alert("일일 AI 사용량이 초과되었습니다. 할당량 갱신 후 이용해주세요.");
      } else {
        alert("문제를 생성하는 데 실패했습니다.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = async (index: number) => {
    if (selectedAnswer !== null || !question) return;
    setSelectedAnswer(index);
    setShowExplanation(true);

    if (index !== question.answer && user) {
      try {
        await addDoc(collection(db, 'wrong_answers'), {
          userId: user.uid,
          ...question,
          source: 'youtube',
          videoId: selectedVideo?.id,
          videoTitle: selectedVideo?.title,
          reviewCount: 0,
          nextReviewDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to save wrong answer:", err);
      }
    }
  };

  const decodeHTMLEntities = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <YoutubeIcon className="w-8 h-8 text-red-600" />
            YouTube 학습
          </h1>
          <p className="text-gray-500 mt-1">유튜브 영상을 시청하고 생성형 AI가 만든 TOEIC 문제를 풀어보세요.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex relative w-full md:w-96">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="학습할 영상 검색 (예: 토익 LC, 토익 꿀팁)"
            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {!selectedVideo ? (
        <div>
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse border border-gray-100 dark:border-gray-800 flex flex-col">
                   <Skeleton className="aspect-video" />
                   <div className="p-3 flex-1 space-y-2">
                     <Skeleton className="h-4 w-3/4" />
                     <Skeleton className="h-3 w-1/2" />
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => setSelectedVideo(video)}
                  className="glass-card rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group border border-gray-100 dark:border-gray-800 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                        <Play className="w-5 h-5 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm text-black dark:text-white line-clamp-2" title={decodeHTMLEntities(video.title)}>
                      {decodeHTMLEntities(video.title)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{video.channelTitle}</p>
                  </div>
                </div>
              ))}
              {videos.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-500">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <button 
              onClick={() => { setSelectedVideo(null); setQuestion(null); }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            >
              ← 검색 목록으로 돌아가기
            </button>
            <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold text-lg text-black dark:text-white">{decodeHTMLEntities(selectedVideo.title)}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedVideo.channelTitle}</p>
              </div>
            </div>

            <button
              onClick={handleGenerateQuestion}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  문제를 생성하는 중...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5" />
                  이 영상으로 연습 문제 만들기
                </>
              )}
            </button>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-4">
            {question && (
              <div className="glass-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">YouTube LC</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-6">{question.question}</h3>
                
                <div className="space-y-3">
                  {question.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === question.answer;
                    const showResult = showExplanation;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={showResult}
                        className={cn(
                          "w-full text-left px-4 py-4 rounded-xl border-2 transition-all flex items-center gap-3",
                          showResult
                            ? isCorrect
                              ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                              : isSelected
                              ? "bg-red-50 border-red-500 dark:bg-red-900/20"
                              : "border-gray-100 dark:border-gray-800 opacity-50"
                            : "border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                          showResult && isCorrect ? "bg-green-500 text-white" : "",
                          showResult && isSelected && !isCorrect ? "bg-red-500 text-white" : "",
                          !showResult ? "bg-gray-100 text-gray-500 dark:bg-gray-800" : ""
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn(
                          "font-medium",
                          showResult && isCorrect ? "text-green-800 dark:text-green-200" : "",
                          showResult && isSelected && !isCorrect ? "text-red-800 dark:text-red-200" : ""
                        )}>{option}</span>
                      </button>
                    )
                  })}
                </div>

                {showExplanation && (
                  <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-3">
                      {selectedAnswer === question.answer ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {selectedAnswer === question.answer ? "정답입니다!" : "틀렸습니다."}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">해설</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {question.explanation}
                        </p>
                      </div>
                      {question.script && (
                        <div>
                           <p className="text-xs text-blue-600 uppercase font-bold mb-1">스크립트 (요약)</p>
                           <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                             {question.script}
                           </p>
                        </div>
                      )}
                      {selectedAnswer !== question.answer && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          이 문제는 자동으로 오답 노트에 저장되었습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
