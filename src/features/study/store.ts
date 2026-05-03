import { create } from 'zustand';
import { Question } from '../../lib/gemini';

interface StudyState {
  type: 'LC' | 'RC' | null;
  loading: boolean;
  question: Question | null;
  selectedAnswer: number | null;
  showExplanation: boolean;
  audioUrl: string | null;
  
  // Actions
  setType: (type: 'LC' | 'RC' | null) => void;
  setLoading: (loading: boolean) => void;
  setQuestion: (question: Question | null) => void;
  setAnswer: (idx: number | null) => void;
  setShowExplanation: (show: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  reset: () => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  type: null,
  loading: false,
  question: null,
  selectedAnswer: null,
  showExplanation: false,
  audioUrl: null,

  setType: (type) => set({ type }),
  setLoading: (loading) => set({ loading }),
  setQuestion: (question) => set({ question }),
  setAnswer: (selectedAnswer) => set({ selectedAnswer }),
  setShowExplanation: (showExplanation) => set({ showExplanation }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  reset: () => set({
    type: null,
    loading: false,
    question: null,
    selectedAnswer: null,
    showExplanation: false,
    audioUrl: null
  })
}));
