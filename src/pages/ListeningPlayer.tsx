import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, FastForward, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Track {
  id: string;
  duration: string;
  file: string;
  transcript?: string;
}

interface Unit {
  id: string;
  tracks: Track[];
}

interface ManifestData {
  units: Unit[];
}

export default function ListeningPlayer() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch('/audio/manifest.json')
      .then(async (res) => {
        if (!res.ok) throw new Error('Cannot fetch manifest.json');
        
        // Check content type to prevent SPA HTML fallback from being parsed as JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("MANIFEST_NOT_FOUND");
        }
        
        return res.json();
      })
      .then((data) => {
        // Handle possible flat array or `{ units: [] }` structure
        let parsedUnits: Unit[] = [];
        if (data.units) {
          parsedUnits = data.units;
        } else if (Array.isArray(data)) {
          // If flat array, try to group by a 'unit' field, else just put them all in "Unit 1"
          const grouped = data.reduce((acc: Record<string, Track[]>, track: any) => {
            const u = track.unit || "Unit 1";
            if (!acc[u]) acc[u] = [];
            acc[u].push(track);
            return acc;
          }, {});
          parsedUnits = Object.keys(grouped).map(id => ({ id, tracks: grouped[id] }));
        }
        
        setUnits(parsedUnits);
        if (parsedUnits.length > 0) {
          setSelectedUnitId(parsedUnits[0].id);
        }
      })
      .catch((err) => {
        console.error("Manifest parse error:", err);
        if (err.message === "MANIFEST_NOT_FOUND") {
          setError('음원 목록(manifest.json)을 찾을 수 없습니다.');
        } else {
          setError('오디오 데이터를 불러오는데 실패했습니다.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const currentUnit = units.find(u => u.id === selectedUnitId);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    setPlaybackError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        if (e.message.includes("no supported sources") || e.name === "NotSupportedError") {
          setPlaybackError("오디오 파일을 재생할 수 없습니다. 파일(MP3)이 없거나 경로가 잘못되었습니다.");
        } else {
          setPlaybackError("재생 중 오류가 발생했습니다.");
        }
      });
    }
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        Math.max(audioRef.current.currentTime + amount, 0),
        audioRef.current.duration || 0
      );
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const cycleSpeed = () => {
    setPlaybackRate(prev => {
      if (prev === 0.75) return 1;
      if (prev === 1) return 1.25;
      return 0.75;
    });
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setPlaybackError(null);
    if (audioRef.current) {
      // The audio element will automatically start playing due to autoPlay prop or we can call play after it loads
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">오디오 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 text-center text-red-500 min-h-[400px]">
        <p>{error}</p>
        <p className="text-sm mt-2">public/audio/manifest.json 파일을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 w-full max-w-6xl mx-auto">
      {/* Sidebar: Units */}
      <div className="w-full md:w-48 lg:w-64 flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {units.map((unit) => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnitId(unit.id)}
            className={cn(
              "whitespace-nowrap px-4 py-3 rounded-xl font-medium text-left transition-colors",
              selectedUnitId === unit.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-transparent shadow-sm"
            )}
          >
            {unit.id}
          </button>
        ))}
      </div>

      {/* Main Content: Track List & Player */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Track List */}
        <div className="glass-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 overflow-auto max-h-[50vh] md:max-h-[60vh]">
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">{currentUnit?.id} 트랙 리스트</h2>
          <div className="space-y-2">
            {currentUnit?.tracks.map((track) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                      : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                    )}>
                      {isActive ? <Play className="w-4 h-4" /> : <span className="text-xs font-bold font-mono">{(track.id.replace(/[^0-9]/g, '')) || '▶'}</span>}
                    </div>
                    <span className={cn("font-medium", isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300")}>
                      {track.id}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-mono">{track.duration}</span>
                </button>
              );
            })}
            {!currentUnit?.tracks.length && (
              <p className="text-gray-500 p-4 text-center">트랙이 없습니다.</p>
            )}
          </div>
        </div>

        {/* Player Block */}
        <div className="glass-card rounded-2xl p-4 md:p-6 shadow-sm border border-blue-100 dark:border-blue-900 flex flex-col gap-4">
          <audio
            ref={audioRef}
            src={currentTrack ? `/${currentTrack.file}` : undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error("Audio element error", e.currentTarget.error);
              setIsPlaying(false);
              setPlaybackError("오디오 파일을 로드할 수 없습니다. 파일 경로 및 파일 존재 유무를 확인해주세요.");
            }}
            onLoadedData={() => {
              if (isPlaying && audioRef.current) {
                audioRef.current.play().catch(e => {
                   console.error("Auto-play error:", e);
                   setIsPlaying(false);
                   setPlaybackError("오디오를 재생할 수 없습니다.");
                });
                audioRef.current.playbackRate = playbackRate;
              }
            }}
          />
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
              {currentTrack ? `${currentUnit?.id} - ${currentTrack.id}` : '트랙을 선택하세요'}
            </span>
            <button
              onClick={cycleSpeed}
              className="text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
            >
              {playbackRate}x
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-gray-700"
              disabled={!currentTrack}
            />
            <span className="text-xs text-gray-500 font-mono w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6 mt-2">
            <button
              onClick={() => skip(-10)}
              disabled={!currentTrack}
              className="p-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors disabled:opacity-50"
              title="10초 뒤로 가기"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            <button
              onClick={() => skip(10)}
              disabled={!currentTrack}
              className="p-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors disabled:opacity-50"
              title="10초 앞으로 가기"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          
          {playbackError && (
            <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
              {playbackError}
            </div>
          )}

          {/* Transcript area */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700 text-sm leading-relaxed max-h-48 overflow-y-auto">
            {currentTrack?.transcript ? (
              <p className="text-gray-800 dark:text-gray-200">{currentTrack.transcript}</p>
            ) : (
              <p className="text-gray-400 italic text-center">
                {currentTrack ? "전사 준비 중" : "재생할 트랙을 선택하면 스크립트가 표시됩니다."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
