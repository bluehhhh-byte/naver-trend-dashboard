import "./globals.css";

export const metadata = {
  title: "정치 이슈 검색량 추이 분석 대시보드 | Political Trend Dashboard",
  description:
    "네이버 데이터랩 API를 활용하여 정치 키워드의 검색량 추이를 시각화하고, Peak 시점의 뉴스·SNS 반응을 분석하는 인터랙티브 대시보드입니다.",
  keywords: ["정치", "검색 트렌드", "네이버 데이터랩", "뉴스 분석", "대시보드"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
