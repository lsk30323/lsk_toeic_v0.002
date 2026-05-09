import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { logOut, signInWithGoogle, signInWithEmail, signUpWithEmail } from "../lib/firebase";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  RotateCcw,
  Target,
  LayoutDashboard,
  LogOut,
  LogIn,
  Mail,
  Menu,
  X,
  Palette,
  Library,
  Youtube
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Layout() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  // Email login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (authMode === "signIn") {
      signInWithEmail(email, password);
    } else {
      signUpWithEmail(email, password);
    }
  };

  const navItems = [
    { name: "대시보드", path: "/", icon: LayoutDashboard },
    { name: "리스닝 음원", path: "/listening", icon: Headphones },
    { name: "LC 연습", path: "/lc", icon: Headphones },
    { name: "RC 연습", path: "/rc", icon: BookOpen },
    { name: "YouTube 학습", path: "/youtube", icon: Youtube },
    { name: "받아쓰기", path: "/dictation", icon: PenTool },
    { name: "말하기", path: "/speaking", icon: Mic },
    { name: "단어장", path: "/voca", icon: Library },
    { name: "오답 노트", path: "/review", icon: RotateCcw },
    { name: "실전 모의고사", path: "/exam", icon: Target },
  ];

  const themes = [
    { id: "default", name: "기본 (Light Blue)" },
    { id: "lavender", name: "Lavender Mist" },
    { id: "glacier-dark", name: "Glacier Dark" },
  ] as const;

  if (loading && !localStorage.getItem('toeic_app_cached_auth')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">앱을 준비하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden glass-card border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <span className="text-2xl">🔥</span> TOEIC AI
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              aria-label="테마 설정"
              aria-expanded={isThemeMenuOpen}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <Palette className="w-5 h-5" aria-hidden="true" />
            </button>
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-lg py-2 z-50">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-600",
                      theme === t.id
                        ? "text-blue-600 font-bold bg-blue-50/50"
                        : "text-gray-700",
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Slide-out) */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-64 glass-card border-r border-gray-200 flex flex-col transition-transform duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 hidden md:flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="text-3xl">🔥</span> TOEIC AI
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-0 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-blue-600" : "text-gray-400",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Desktop Theme Switcher */}
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
              테마 설정
            </p>
            <div className="space-y-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    theme === t.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <Palette
                    className={cn(
                      "w-4 h-4",
                      theme === t.id ? "text-blue-600" : "text-gray-400",
                    )}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {user ? (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-sm overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">
                    {user.displayName || "사용자"}
                  </p>
                </div>
              </div>
              <button
                onClick={logOut}
                aria-label="로그아웃"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              to="/"
              aria-label="로그인 페이지로"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {!user && location.pathname !== "/" ? (
            <div className="text-center py-10 md:py-20 glass-card rounded-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                로그인이 필요합니다
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-8 px-4">
                모든 기능을 사용하려면 로그인해주세요.
              </p>
              <form
                onSubmit={handleEmailSubmit}
                className="max-w-sm mx-auto flex flex-col gap-3 px-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === "signUp" ? "비밀번호 (6자 이상)" : "비밀번호"}
                  autoComplete={authMode === "signUp" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Mail className="w-5 h-5" aria-hidden="true" />
                  <span>{authMode === "signIn" ? "이메일로 로그인" : "이메일로 회원가입"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "signIn" ? "signUp" : "signIn")}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {authMode === "signIn" ? "처음이신가요? 회원가입하기" : "이미 계정이 있으신가요? 로그인하기"}
                </button>
              </form>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm font-medium animate-pulse">페이지를 불러오는 중...</p>
                </div>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional but good for UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-gray-200 px-2 py-1 flex justify-around items-center z-40 rounded-t-2xl">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive ? "text-blue-600" : "text-gray-400",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2 text-gray-400"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">더보기</span>
        </button>
      </nav>
      {/* Add padding to main content to avoid overlap with bottom nav> */}
      <div className="md:hidden h-16" />
    </div>
  );
}
