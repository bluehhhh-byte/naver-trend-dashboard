import { NextResponse } from "next/server";
import { generateMockTrendData } from "@/lib/mockData";

// ─────────────────────────────────────────────────────────────
// [요구사항 2] API 호출 최적화 — 인메모리 캐싱 (5분 TTL)
//   Next.js Route Handler는 fetch() 레벨 캐싱이 POST 메서드에
//   적용되지 않으므로 서버 모듈 스코프 Map을 이용한 인메모리
//   캐싱으로 동일 키워드 중복 호출을 방지하고 Rate Limit을 방어.
// ─────────────────────────────────────────────────────────────
const trendCache = new Map(); // key: cacheKey, value: { data, keys, source, ts }
const CACHE_TTL = 5 * 60 * 1000; // 5분 (ms)

export async function POST(request) {
  try {
    const { keyword, startDate, endDate } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const keywordsArray = keyword
      .split(/[,&]/)
      .map((k) => k.trim())
      .filter((k) => k)
      .slice(0, 5);

    // ── 캐시 키: 키워드 + 날짜 범위 조합 ──────────────────────
    const cacheKey = `${keywordsArray.join("|")}::${startDate ?? ""}::${endDate ?? ""}`;
    const cached = trendCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // 캐시 히트: 동일 키워드 5분 내 재요청 시 API 미호출
      return NextResponse.json({
        data: cached.data,
        keys: cached.keys,
        source: cached.source,
        cached: true,
      });
    }

    const keywordGroups = keywordsArray.map((kw) => ({ groupName: kw, keywords: [kw] }));

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (clientId && clientSecret && clientId !== "your_client_id_here") {
      // ── 실제 네이버 데이터랩 API 호출 ────────────────────────
      const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
        method: "POST",
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate || "2025-10-01",
          endDate: endDate || "2026-04-01",
          timeUnit: "date",
          keywordGroups,
        }),
        // Next.js fetch 확장: GET과 달리 POST는 no-store가 기본이므로
        // 서버 인메모리 캐시(위 Map)에서 별도 관리
        cache: "no-store",
      });

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const mergedData = {};

        data.results.forEach((group) => {
          group.data.forEach((item) => {
            if (!mergedData[item.period]) {
              mergedData[item.period] = { date: item.period };
            }
            mergedData[item.period][group.title] = item.ratio;
          });
        });

        const transformedData = Object.values(mergedData).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // ── 캐시 저장 ─────────────────────────────────────────
        trendCache.set(cacheKey, {
          data: transformedData,
          keys: keywordsArray,
          source: "naver",
          ts: Date.now(),
        });

        return NextResponse.json({
          data: transformedData,
          keys: keywordsArray,
          source: "naver",
        });
      }
    }

    // ── Mock 데이터 폴백 ──────────────────────────────────────
    const mockData = generateMockTrendData();
    const transformedMock = mockData.map((d) => {
      const row = { date: d.date };
      keywordsArray.forEach((kw, i) => {
        row[kw] = Math.max(0, d.ratio - i * 10);
      });
      return row;
    });

    // Mock 데이터도 캐싱하여 중복 연산 방지
    trendCache.set(cacheKey, {
      data: transformedMock,
      keys: keywordsArray,
      source: "mock",
      ts: Date.now(),
    });

    return NextResponse.json({ data: transformedMock, keys: keywordsArray, source: "mock" });
  } catch (error) {
    console.error("Trend API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
