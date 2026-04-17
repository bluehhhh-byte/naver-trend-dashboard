import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// [요구사항 1] 메타데이터 스크래핑 Fallback 강화
//   우선순위: og:description → meta[name=description]
//             → <body> 텍스트 앞 150자 슬라이싱
//             → 접근 불가 시 고정 에러 메시지 반환
// ─────────────────────────────────────────────────────────────

// 인메모리 캐시 (URL 단위 5분 캐싱 — Rate Limit / 중복 스크래핑 방어)
const summaryCache = new Map(); // key: url, value: { text, ts }
const CACHE_TTL = 5 * 60 * 1000; // 5분 (ms)

/** HTML 문자열에서 특정 meta 태그 content 를 추출하는 헬퍼 */
function extractMeta(html, ...patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].slice(0, 200));
    }
  }
  return null;
}

/** 최소한의 HTML 엔티티 디코딩 */
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** <body> 태그 안의 순수 텍스트 앞 150자 추출 */
function extractBodyText(html) {
  // script / style 블록 먼저 제거
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // body 구간만 추출
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? cleaned;

  // 태그 제거 후 공백 정리
  const text = bodyHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 앞 150자 반환 (단어 경계 고려)
  if (text.length <= 150) return text;
  return text.slice(0, 150) + "…";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // ── 캐시 히트 확인 ──────────────────────────────────────────
  const cached = summaryCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ summary: cached.text, cached: true });
  }

  try {
    // 5초 타임아웃 + 브라우저처럼 보이는 User-Agent (블로그 차단 우회)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      // HTTP 오류(403·404 등) → 고정 에러 메시지
      return NextResponse.json({
        summary: "요약을 불러올 수 없는 원문입니다.",
        error: `HTTP ${response.status}`,
      });
    }

    const html = await response.text();

    // 1순위: og:description
    let summary = extractMeta(
      html,
      /property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:description["']/i
    );

    // 2순위: meta[name=description]
    if (!summary) {
      summary = extractMeta(
        html,
        /name=["']description["'][^>]*content=["']([^"']+)["']/i,
        /content=["']([^"']+)["'][^>]*name=["']description["']/i
      );
    }

    // 3순위: body 텍스트 앞 150자 슬라이싱 (네이버 블로그 차단 대비)
    if (!summary) {
      const bodyText = extractBodyText(html);
      summary = bodyText || "요약을 불러올 수 없는 원문입니다.";
    }

    // 캐시 저장
    summaryCache.set(url, { text: summary, ts: Date.now() });

    return NextResponse.json({ summary });
  } catch (err) {
    // 타임아웃, 네트워크 오류, CORS 차단 등 모든 예외 포착
    console.error("[summary] fetch error:", err.message);
    return NextResponse.json({
      summary: "요약을 불러올 수 없는 원문입니다.",
      error: err.message,
    });
  }
}
