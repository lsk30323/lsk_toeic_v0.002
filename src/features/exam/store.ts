import { create } from 'zustand';
import { Question } from '../../lib/gemini';

interface ExamState {
  started: boolean;
  finished: boolean;
  loading: boolean;
  questions: Question[];
  currentIdx: number;
  answers: number[];
  timeLeft: number;
  score: number;
  feedback: string;
  
  // Actions
  startExam: (questions: Question[]) => void;
  setAnswer: (idx: number) => void;
  nextQuestion: () => void;
  finishExam: (score: number, feedback: string) => void;
  tick: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  started: false,
  finished: false,
  loading: false,
  questions: [],
  currentIdx: 0,
  answers: [],
  timeLeft: 15 * 60,
  score: 0,
  feedback: '',

  startExam: (questions) => set({
    started: true,
    finished: false,
    questions,
    answers: new Array(questions.length).fill(-1),
    currentIdx: 0,
    timeLeft: 15 * 60,
    score: 0,
    feedback: ''
  }),

  setAnswer: (idx) => set((state) => {
    const newAnswers = [...state.answers];
    newAnswers[state.currentIdx] = idx;
    return { answers: newAnswers };
  }),

  nextQuestion: () => set((state) => ({
    currentIdx: Math.min(state.currentIdx + 1, state.questions.length - 1)
  })),

  finishExam: (score, feedback) => set({
    finished: true,
    score,
    feedback
  }),

  tick: () => set((state) => ({
    timeLeft: Math.max(0, state.timeLeft - 1)
  })),

  reset: () => set({
    started: false,
    finished: false,
    loading: false,
    questions: [],
    currentIdx: 0,
    answers: [],
    timeLeft: 15 * 60,
    score: 0,
    feedback: ''
  })
}));
