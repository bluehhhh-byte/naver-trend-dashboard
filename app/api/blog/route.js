import { NextResponse } from "next/server";
import { generateMockBlogs } from "@/lib/mockData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  }

  const date = searchParams.get("date") ?? "";

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (clientId && clientSecret && clientId !== 'your_client_id_here') {
    try {
      const fetchNaverBlog = async (q, sort = "sim", display = 50) => {
        const res = await fetch(
          `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(q)}&display=${display}&sort=${sort}`,
          {
            headers: {
              "X-Naver-Client-Id": clientId,
              "X-Naver-Client-Secret": clientSecret,
            },
          }
        );
        return await res.json();
      };

      let items = [];

      if (date) {
        // Step 1: Contextual Search
        const dateStr = date.replace(/-/g, ".");
        const contextData = await fetchNaverBlog(`${keyword} ${dateStr}`, "sim", 30);
        if (contextData.items && contextData.items.length > 0) {
          items = contextData.items;
        }

        // Step 2: Chronological Filter Fallback
        if (items.length < 5) {
          const chronoData = await fetchNaverBlog(keyword, "date", 50);
          if (chronoData.items) {
            const targetDate = new Date(date);
            targetDate.setHours(23, 59, 59, 999);
            const filtered = chronoData.items.filter(item => {
              const p = item.postdate;
              const postDate = new Date(`${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`);
              return postDate <= targetDate;
            });
            if (filtered.length > items.length) items = filtered;
          }
        }
      } else {
        const latestData = await fetchNaverBlog(keyword, "sim", 20);
        items = latestData.items || [];
      }

      if (items.length === 0) {
        const fallbackData = await fetchNaverBlog(keyword, "sim", 20);
        items = fallbackData.items || [];
      }

      items = items.slice(0, 20);
      return NextResponse.json({ items, source: "naver" });
    } catch (error) {
      console.error("Blog API error:", error);
    }
  }

  // Fallback to mock data
  const mockData = generateMockBlogs(keyword);
  return NextResponse.json({ items: mockData, source: "mock" });
}
