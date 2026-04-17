import { NextResponse } from "next/server";
import { generateMockNews } from "@/lib/mockData";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// [요구사항 2] API 호출 최적화 — 인메모리 캐싱 (5분 TTL)
//   동일 keyword + date 조합 요청이 5분 내 반복될 경우
//   Naver API를 재호출하지 않고 캐시 데이터를 즉시 반환.
// ─────────────────────────────────────────────────────────────
const newsCache = new Map(); // key: `${keyword}::${date}`, value: { items, source, ts }
const CACHE_TTL = 5 * 60 * 1000; // 5분 (ms)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const date = searchParams.get("date") ?? "";

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  }

  // ── 캐시 히트 확인 ──────────────────────────────────────────
  const cacheKey = `${keyword}::${date}`;
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ items: cached.items, source: cached.source, cached: true });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (clientId && clientSecret && clientId !== "your_client_id_here") {
    try {
      const fetchNaverNews = async (q, sort = "sim", display = 50) => {
        const res = await fetch(
          `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=${display}&sort=${sort}`,
          {
            headers: {
              "X-Naver-Client-Id": clientId,
              "X-Naver-Client-Secret": clientSecret,
            },
            cache: "no-store",
          }
        );
        return await res.json();
      };

      let items = [];
      
      if (date) {
        // Step 1: Try Contextual Search (Keyword + Date)
        const dateStr = date.replace(/-/g, ".");
        const contextData = await fetchNaverNews(`${keyword} ${dateStr}`, "sim", 30);
        if (contextData.items && contextData.items.length > 0) {
          items = contextData.items;
        }

        // Step 2: Fallback to Chronological Filtering if Step 1 is sparse
        if (items.length < 5) {
          const chronoData = await fetchNaverNews(keyword, "date", 50);
          if (chronoData.items) {
            const targetDate = new Date(date);
            targetDate.setHours(23, 59, 59, 999);
            const filtered = chronoData.items.filter(item => new Date(item.pubDate) <= targetDate);
            // Merge or replace
            if (filtered.length > items.length) items = filtered;
          }
        }
      } else {
        // No specific date: Just get latest relevant
        const latestData = await fetchNaverNews(keyword, "sim", 20);
        items = latestData.items || [];
      }

      // Step 3: Absolute Fallback (General Relevance) if still empty
      if (items.length === 0) {
        const fallbackData = await fetchNaverNews(keyword, "sim", 20);
        items = fallbackData.items || [];
      }

      items = items.slice(0, 20);
      newsCache.set(cacheKey, { items, source: "naver", ts: Date.now() });
      return NextResponse.json({ items, source: "naver" });
    } catch (error) {
      console.error("News API error:", error);
      // API 오류 시 Mock 폴백으로 진행
    }
  }

  // ── Mock 데이터 폴백 ──────────────────────────────────────
  const mockData = generateMockNews(keyword);
  newsCache.set(cacheKey, { items: mockData, source: "mock", ts: Date.now() });
  return NextResponse.json({ items: mockData, source: "mock" });
}
