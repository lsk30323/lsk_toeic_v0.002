import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Loader2, FileText, Plus, BrainCircuit, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { calculateSM2 } from "../lib/srs";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Flashcard {
  id: string;
  front: string;
  back: string;
  reviewCount: number;
  easeFactor?: number;
  interval?: number;
  repetition?: number;
  nextReviewDate: string;
}

export default function Voca() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // Study Mode State
  const [studyMode, setStudyMode] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    try {
      const q = query(collection(db, "flashcards"), where("userId", "==", user!.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Flashcard[];
      setCards(data);
    } catch (error: any) {
      if (error?.message?.includes('offline') || error?.code === 'unavailable') {
        console.warn('Firestore is offline, could not fetch flashcards.');
      } else {
        handleFirestoreError(error, OperationType.GET, "flashcards");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!markdownInput.trim() || !user) return;
    setIsImporting(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Extract flashcards from the following markdown text. Find key terms and their definitions, or questions and answers. Return ONLY a valid JSON array without any markdown wrappers. It must be an array of objects with 'front' and 'back' properties.\n\nMarkdown:\n${markdownInput}`,
        config: {
          temperature: 0,
        }
      });

      let text = response.text;
      if (!text) throw new Error("Failed to parse markdown");
      
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const extracted = JSON.parse(text) as { front: string, back: string }[];
      
      // Save to Firestore
      for (const item of extracted) {
        await addDoc(collection(db, "flashcards"), {
          userId: user.uid,
          front: item.front,
          back: item.back,
          reviewCount: 0,
          nextReviewDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      setMarkdownInput("");
      setShowImportModal(false);
      fetchCards();
    } catch (error: any) {
      console.error("Import error:", error);
      if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("exceeded your current quota")) {
        alert("일일 AI 사용량이 초과되었습니다. 할당량 갱신 후 다시 시도해주세요.");
      } else {
        alert("마크다운을 파싱하는 중 오류가 발생했습니다.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "flashcards", id));
      setCards(cards.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flashcards/${id}`);
    }
  };

  const startStudy = () => {
    const now = new Date();
    const dueCards = cards.filter(c => new Date(c.nextReviewDate) <= now);
    
    if (dueCards.length === 0) {
      alert("현재 복습할 단어가 없습니다!");
      return;
    }

    setStudyQueue(dueCards.sort(() => Math.random() - 0.5));
    setCurrentCardIdx(0);
    setShowBack(false);
    setStudyMode(true);
  };

  const handleRate = async (quality: number) => {
    const currentCard = studyQueue[currentCardIdx];
    try {
      const easeFactor = currentCard.easeFactor ?? 2.5;
      const interval = currentCard.interval ?? 0;
      const repetition = currentCard.repetition ?? 0;

      const srsResult = calculateSM2(quality, repetition, easeFactor, interval);
      
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + srsResult.interval);

      await updateDoc(doc(db, "flashcards", currentCard.id), {
        easeFactor: srsResult.easeFactor,
        interval: srsResult.interval,
        repetition: srsResult.repetitions,
        nextReviewDate: nextDate.toISOString(),
        reviewCount: currentCard.reviewCount + 1,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${currentCard.id}`);
    } finally {
      if (currentCardIdx < studyQueue.length - 1) {
        setCurrentCardIdx(prev => prev + 1);
        setShowBack(false);
      } else {
        setStudyMode(false);
        fetchCards();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (studyMode) {
    const currentCard = studyQueue[currentCardIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-blue-600" />
            단어장 복습
          </h1>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold">
            {currentCardIdx + 1} / {studyQueue.length}
          </span>
        </div>

        <div 
          className="glass-card min-h-[300px] flex flex-col items-center justify-center p-8 rounded-3xl cursor-pointer text-center transition-all hover:shadow-md"
          onClick={() => !showBack && setShowBack(true)}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{currentCard.front}</h2>
          
          {showBack ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-1 bg-blue-100 mx-auto mb-6 rounded-full" />
              <p className="text-xl text-blue-700 font-medium">{currentCard.back}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm animate-pulse">클릭하여 정답 확인</p>
          )}
        </div>

        {showBack && (
          <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => handleRate(1)}
              className="py-4 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors flex flex-col items-center gap-1"
            >
              <span>다시 (틀림)</span>
              <span className="text-xs font-normal opacity-70">1일 후</span>
            </button>
            <button
              onClick={() => handleRate(4)}
              className="py-4 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-colors flex flex-col items-center gap-1"
            >
              <span>보통 (Good)</span>
              <span className="text-xs font-normal opacity-70">알맞은 주기</span>
            </button>
            <button
              onClick={() => handleRate(5)}
              className="py-4 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors flex flex-col items-center gap-1"
            >
              <span>쉬움 (Easy)</span>
              <span className="text-xs font-normal opacity-70">긴 주기</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            마크다운 단어장
          </h1>
          <p className="text-gray-500 mt-1">
            마크다운 노트에서 플래시카드를 추출하고 스마트하게 복습하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            가져오기
          </button>
          <button
            onClick={startStudy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            복습 시작
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">마크다운으로 플래시카드 만들기</h2>
            <p className="text-sm text-gray-500 mb-4">
              단어나 문장이 포함된 마크다운 텍스트를 붙여넣으세요. AI가 자동으로 앞면/뒷면을 분리하여 카드를 생성합니다.
            </p>
            <textarea
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="예:&#10;**Accommodate**: 수용하다, 공간을 제공하다&#10;**Implement**: 실행하다"
              className="w-full h-48 p-4 border rounded-xl mb-4 text-sm resize-none focus:ring-2 focus:ring-blue-500 bg-transparent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !markdownInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                추출 및 저장
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.id} className="glass-card p-5 rounded-xl border border-gray-100 relative group">
            <button 
              onClick={() => handleDelete(card.id)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg mb-2 pr-8">{card.front}</h3>
            <p className="text-gray-600 text-sm mb-4">{card.back}</p>
            <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3">
              <span>복습 {card.reviewCount}회</span>
              <span>다음: {new Date(card.nextReviewDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 glass-card rounded-2xl border border-dashed border-gray-300">
            아직 등록된 단어가 없습니다. '가져오기' 버튼을 눌러 마크다운 노트를 추가해보세요.
          </div>
        )}
      </div>
    </div>
  );
}
