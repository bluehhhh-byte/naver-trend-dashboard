// Mock trend data — 6 months of "대선" search volume
export function generateMockTrendData() {
  const data = [];
  const startDate = new Date("2025-10-01");
  const endDate = new Date("2026-04-01");

  const peakDates = [
    { date: "2025-11-15", boost: 70 },
    { date: "2025-12-20", boost: 55 },
    { date: "2026-01-10", boost: 85 },
    { date: "2026-02-14", boost: 60 },
    { date: "2026-03-01", boost: 100 },
    { date: "2026-03-15", boost: 75 },
  ];

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    let baseValue = 15 + Math.random() * 20;

    // Add smooth wave pattern
    const dayIndex = Math.floor(
      (current - startDate) / (1000 * 60 * 60 * 24)
    );
    baseValue += Math.sin(dayIndex * 0.05) * 10;
    baseValue += Math.cos(dayIndex * 0.02) * 5;

    // Add peak boosts
    for (const peak of peakDates) {
      const peakDate = new Date(peak.date);
      const diff = Math.abs(current - peakDate) / (1000 * 60 * 60 * 24);
      if (diff < 5) {
        baseValue += peak.boost * Math.exp(-diff * 0.6);
      }
    }

    data.push({
      date: dateStr,
      ratio: Math.min(100, Math.max(0, Math.round(baseValue * 10) / 10)),
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

// Mock news data
export function generateMockNews(keyword) {
  const newsItems = [
    {
      title: `[속보] ${keyword} 관련 여론조사 결과 발표... 역대 최고치 기록`,
      description: `최근 실시된 여론조사에서 ${keyword} 관련 관심도가 급등하며 국민 10명 중 7명이 관심을 표했다. 전문가들은 이번 결과가 향후 정국에 큰 영향을 미칠 것으로 전망했다.`,
      link: "https://news.naver.com/example1",
      originallink: "https://example.com/news1",
      pubDate: "2026-03-01T09:30:00",
    },
    {
      title: `${keyword} 토론회, 시청률 30% 돌파... SNS 실시간 트렌드 1위`,
      description: `어젯밤 열린 ${keyword} 관련 TV 토론회가 시청률 30%를 넘기며 뜨거운 관심을 받았다. SNS에서도 실시간 트렌드 1위에 올라 활발한 논의가 진행됐다.`,
      link: "https://news.naver.com/example2",
      originallink: "https://example.com/news2",
      pubDate: "2026-03-01T11:00:00",
    },
    {
      title: `"${keyword}" 핵심 공약 비교 분석... 전문가 평가 엇갈려`,
      description: `각 진영에서 발표한 ${keyword} 관련 공약을 전문가들이 심층 분석했다. 경제 분야에서는 긍정적 평가가, 복지 분야에서는 실현 가능성에 의문이 제기됐다.`,
      link: "https://news.naver.com/example3",
      originallink: "https://example.com/news3",
      pubDate: "2026-03-01T14:20:00",
    },
    {
      title: `${keyword} 이슈에 2030 세대 반응 폭발... "우리 목소리 반영해야"`,
      description: `${keyword} 이슈에 대해 2030 세대의 관심이 높아지고 있다. 온라인 커뮤니티와 SNS에서 청년층의 적극적인 의견 개진이 이어지고 있다.`,
      link: "https://news.naver.com/example4",
      originallink: "https://example.com/news4",
      pubDate: "2026-03-02T08:15:00",
    },
    {
      title: `국회 ${keyword} 관련 긴급 회의 소집... 여야 날선 공방 예상`,
      description: `${keyword}를 둘러싼 여야 간 갈등이 심화되면서 국회에서 긴급 회의가 소집됐다. 양측 모두 강경한 입장을 유지하고 있어 치열한 공방이 예상된다.`,
      link: "https://news.naver.com/example5",
      originallink: "https://example.com/news5",
      pubDate: "2026-03-02T10:45:00",
    },
    {
      title: `${keyword} 관련 가짜뉴스 기승... 팩트체크 결과 공개`,
      description: `최근 ${keyword}와 관련해 각종 허위정보가 SNS를 통해 확산되고 있어 주요 팩트체크 기관들이 검증 결과를 공개했다.`,
      link: "https://news.naver.com/example6",
      originallink: "https://example.com/news6",
      pubDate: "2026-03-03T16:00:00",
    },
  ];
  return newsItems;
}

// Mock blog data
export function generateMockBlogs(keyword) {
  const blogItems = [
    {
      title: `${keyword} 관련 나의 생각 정리 (feat. 최근 여론 분석)`,
      description: `오늘은 최근 뜨거운 감자인 ${keyword}에 대해 제 의견을 정리해보려 합니다. 다양한 시각에서 바라본 분석과 함께 향후 전망도 살펴봅니다...`,
      link: "https://blog.naver.com/example1",
      bloggername: "정치분석가 김민수",
      postdate: "20260301",
    },
    {
      title: `[데이터 분석] ${keyword} 검색량 추이로 본 국민 관심도 변화`,
      description: `네이버 데이터랩을 활용하여 ${keyword}의 검색량 변화를 분석해봤습니다. 특히 지난 3개월간의 급등 구간에서 흥미로운 패턴을 발견했는데요...`,
      link: "https://blog.naver.com/example2",
      bloggername: "데이터사이언스 Lab",
      postdate: "20260228",
    },
    {
      title: `${keyword}, 외신들은 어떻게 보고 있을까?`,
      description: `해외 주요 언론사들이 한국의 ${keyword} 이슈를 어떻게 다루고 있는지 살펴봤습니다. BBC, CNN, NHK 등의 보도를 비교 분석합니다...`,
      link: "https://blog.naver.com/example3",
      bloggername: "글로벌뉴스워치",
      postdate: "20260302",
    },
    {
      title: `${keyword}에 대한 MZ세대 반응 모음 (트위터/인스타 반응 정리)`,
      description: `트위터, 인스타그램 등 SNS에서 ${keyword}에 대한 MZ세대의 실시간 반응을 모아봤습니다. 밈부터 진지한 토론까지 다양한 목소리를 담았습니다...`,
      link: "https://blog.naver.com/example4",
      bloggername: "SNS트렌드헌터",
      postdate: "20260303",
    },
    {
      title: `[칼럼] ${keyword}이(가) 경제에 미치는 영향은?`,
      description: `${keyword} 이슈가 주식 시장과 환율에 어떤 영향을 미치고 있는지 경제적 관점에서 분석합니다. 과거 사례와 비교하여 투자 전략도 공유합니다...`,
      link: "https://blog.naver.com/example5",
      bloggername: "이코노미스트 박재현",
      postdate: "20260301",
    },
  ];
  return blogItems;
}
