"use client";

// ─────────────────────────────────────────────────────────────
// [요구사항 3] 모바일 반응형 레이아웃 동기화
//   - 1024px 이상: 2fr(차트) : 1fr(피드) 유지
//   - 1024px 이하: 1fr 단일 컬럼 (차트 상단, 피드 하단)
// [요구사항 4] 컴포넌트 레벨 Error Boundary 적용
//   - 차트 + IssueAnalysis 영역을 ErrorBoundary 로 래핑
//   - ReactionFeed 영역을 별도 ErrorBoundary 로 래핑
//   → 한 영역이 에러를 던져도 다른 영역은 독립적으로 동작
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Dashboard/Header";
import TrendChart from "@/components/Chart/TrendChart";
import ReactionFeed from "@/components/Feed/ReactionFeed";
import IssueAnalysis from "@/components/Feed/IssueAnalysis";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import styles from "./page.module.css";

export default function Home() {
  const [trendData, setTrendData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [blogData, setBlogData] = useState([]);
  const [recentNewsData, setRecentNewsData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const [chartKeys, setChartKeys] = useState([]);

  // Error Boundary 리셋 키: 키가 바뀌면 ErrorBoundary가 마운트 해제+재마운트
  const [chartBoundaryKey, setChartBoundaryKey] = useState(0);
  const [feedBoundaryKey, setFeedBoundaryKey] = useState(0);

  const handleSearch = useCallback(async ({ keyword: kw, startDate, endDate }) => {
    setIsLoading(true);
    setKeyword(kw);
    setSelectedDate(null);
    setNewsData([]);
    setBlogData([]);

    try {
      const [trendRes, newsRes] = await Promise.all([
        fetch("/api/trend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: kw, startDate, endDate }),
        }),
        fetch(`/api/news?keyword=${encodeURIComponent(kw)}`),
      ]);
      const json = await trendRes.json();
      const newsJson = await newsRes.json();

      setTrendData(json.data || []);
      setDataSource(json.source);
      setChartKeys(json.keys || [kw]);
      setRecentNewsData(newsJson.items || []);

      // Default reaction feed to today's results on search
      const todayStr = new Date().toISOString().split('T')[0];
      handleSearch.todayStr = todayStr; // Internal reference
      handleDateSelect(todayStr, kw, false);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial search on mount
  useEffect(() => {
    const today = new Date();
    let m1 = new Date();
    m1.setMonth(m1.getMonth() - 1);
    const endDate = today.toISOString().split("T")[0];
    const startDate = m1.toISOString().split("T")[0];
    
    handleSearch({ 
      keyword: "정영두 & 홍태용", 
      startDate, 
      endDate 
    });
  }, [handleSearch]);

  const handleDateSelect = useCallback(
    async (date, kw, shouldScroll = true) => {
      const currentKeyword = kw || keyword;
      setSelectedDate(date);
      setIsFeedLoading(true);

      try {
        const [newsRes, blogRes] = await Promise.all([
          fetch(`/api/news?keyword=${encodeURIComponent(currentKeyword)}&date=${date}`),
          fetch(`/api/blog?keyword=${encodeURIComponent(currentKeyword)}&date=${date}`),
        ]);

        const newsJson = await newsRes.json();
        const blogJson = await blogRes.json();

        setNewsData(newsJson.items || []);
        setBlogData(blogJson.items || []);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setIsFeedLoading(false);
        // Scroll only if manually requested (e.g., clicking a Peak)
        if (shouldScroll) {
          setTimeout(() => {
            document.getElementById('reaction-feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    },
    [keyword]
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Header onSearch={handleSearch} isLoading={isLoading} />

        {dataSource && (
          <div className={styles.sourceIndicator}>
            <div
              className={`${styles.sourceTag} ${
                dataSource === "naver" ? styles.sourceReal : styles.sourceMock
              }`}
            >
              {dataSource === "naver" ? (
                <>
                  <span className={styles.statusDot} />
                  네이버 API 실시간 연동
                </>
              ) : (
                <>
                  <span className={`${styles.statusDot} ${styles.dotMock}`} />
                  Mock 데이터 (API 키 미설정)
                </>
              )}
            </div>
          </div>
        )}

        {/* ── [요구사항 3] dashboardGrid: 1024px 이하에서 단일 컬럼 전환 ── */}
        <div className={styles.dashboardGrid}>

          {/* 차트 섹션 — ErrorBoundary 독립 적용 */}
          <section className={styles.chartSection}>
            <ErrorBoundary
              key={chartBoundaryKey}
              label="트렌드 차트"
              onReset={() => setChartBoundaryKey((k) => k + 1)}
            >
              <TrendChart
                data={trendData}
                keyword={keyword}
                chartKeys={chartKeys}
                selectedDate={selectedDate}
                onDateSelect={(date) => handleDateSelect(date)}
              />
              <div className={styles.sideColumn}>
                <ErrorBoundary key={`analysis-${keyword}`} fallback={<div>이슈 분석 로딩 중...</div>}>
                  <IssueAnalysis newsData={recentNewsData} keyword={keyword} />
                </ErrorBoundary>
              </div>
            </ErrorBoundary>
          </section>

          {/* 피드 섹션 — 별도 ErrorBoundary 로 독립 격리 */}
          <section className={styles.feedSection}>
            <ErrorBoundary
              key={feedBoundaryKey}
              label="반응 피드"
              onReset={() => setFeedBoundaryKey((k) => k + 1)}
            >
              <ReactionFeed
                newsData={newsData}
                blogData={blogData}
                selectedDate={selectedDate}
                keyword={keyword}
                isLoading={isFeedLoading}
              />
            </ErrorBoundary>
          </section>
        </div>

        <footer className={styles.footer}>
          <p>정치 이슈 트렌드 대시보드 · Powered by Naver APIs</p>
          <p className={styles.footerSub}>
            검색량 데이터는 네이버 데이터랩 API를 기반으로 하며, 상대적 검색
            비율(0~100)로 표시됩니다.
          </p>
        </footer>
      </div>
    </main>
  );
}
