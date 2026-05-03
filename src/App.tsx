import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// 경량화를 위한 Lazy Loading (코드 스플리팅)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Study = lazy(() => import('./pages/Study'));
const ListeningPlayer = lazy(() => import('./pages/ListeningPlayer'));
const Dictation = lazy(() => import('./pages/Dictation'));
const Review = lazy(() => import('./pages/Review'));
const Exam = lazy(() => import('./pages/Exam'));
const Speaking = lazy(() => import('./pages/Speaking'));
const Voca = lazy(() => import('./pages/Voca'));
const YoutubePage = lazy(() => import('./pages/Youtube'));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium animate-pulse">애플리케이션을 준비 중입니다...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="lc" element={<Study type="LC" />} />
                  <Route path="rc" element={<Study type="RC" />} />
                  <Route path="listening" element={<ListeningPlayer />} />
                  <Route path="dictation" element={<Dictation />} />
                  <Route path="speaking" element={<Speaking />} />
                  <Route path="voca" element={<Voca />} />
                  <Route path="review" element={<Review />} />
                  <Route path="exam" element={<Exam />} />
                  <Route path="youtube" element={<YoutubePage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
