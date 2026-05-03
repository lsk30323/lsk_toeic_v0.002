import { create } from 'zustand';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SpeakingState {
  isRecording: boolean;
  messages: Message[];
  loading: boolean;
  
  // Actions
  setIsRecording: (isRecording: boolean) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useSpeakingStore = create<SpeakingState>((set) => ({
  isRecording: false,
  messages: [
    { role: 'model', text: 'Hello! I am your English speaking partner. How can I help you today?' }
  ],
  loading: false,

  setIsRecording: (isRecording) => set({ isRecording }),
  setMessages: (messages) => set((state) => ({
    messages: typeof messages === 'function' ? messages(state.messages) : messages
  })),
  setLoading: (loading) => set({ loading }),
  reset: () => set({
    isRecording: false,
    messages: [
      { role: 'model', text: 'Hello! I am your English speaking partner. How can I help you today?' }
    ],
    loading: false
  })
}));
