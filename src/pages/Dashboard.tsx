import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ExamResult {
  id: string;
  score: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const q = query(
          collection(db, "exam_results"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "asc"),
          limit(10),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ExamResult[];
        setResults(data);
      } catch (error: any) {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn('Firestore is offline, could not fetch exam results.');
        } else {
          handleFirestoreError(error, OperationType.GET, "exam_results");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  if (!user) {
    return (
      <div className="glass-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">환영합니다!</h2>
        <p className="text-gray-600">
          로그인하여 학습 기록을 관리하고 AI 코칭을 받아보세요.
        </p>
      </div>
    );
  }

  const chartData = results.map((r, i) => ({
    name: format(new Date(r.createdAt), "MM/dd"),
    score: r.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-headline">
          학습 대시보드
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          최근 학습 기록과 성취도를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-card p-4 md:p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">
            최근 모의고사 점수
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {results.length > 0 ? results[results.length - 1].score : 0}{" "}
            <span className="text-base md:text-lg text-gray-400 font-normal">
              / 990
            </span>
          </p>
          <div className="mt-3 inline-block mist-chip px-3 py-1 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
            상위 15%
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">
            응시 횟수
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {results.length}{" "}
            <span className="text-base md:text-lg text-gray-400 font-normal">
              회
            </span>
          </p>
          <div className="mt-3 inline-block mist-chip px-3 py-1 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
            꾸준한 학습
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 rounded-2xl shadow-sm sm:col-span-2 md:col-span-1">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">
            목표 달성률
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {results.length > 0
              ? Math.min(
                  100,
                  Math.round((results[results.length - 1].score / 900) * 100),
                )
              : 0}
            %
          </p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
              style={{
                width: `${results.length > 0 ? Math.min(100, Math.round((results[results.length - 1].score / 900) * 100)) : 0}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 md:p-6 rounded-2xl shadow-sm">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 font-headline">
          성적 추이
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            데이터를 불러오는 중...
          </div>
        ) : results.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--card-border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-gray-500)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 990]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-gray-500)", fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    backgroundColor: "var(--card-bg)",
                  }}
                  itemStyle={{ color: "var(--text-color)" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-blue-600)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "var(--color-blue-600)",
                    strokeWidth: 2,
                    stroke: "var(--card-bg)",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            아직 모의고사 기록이 없습니다. 실전 모의고사를 시작해보세요!
          </div>
        )}
      </div>
    </div>
  );
}
