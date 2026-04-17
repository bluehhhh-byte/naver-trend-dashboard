import { useMemo } from 'react';
import styles from './IssueAnalysis.module.css';

// 불용어 (형태소 분석기 부재로 인한 임시 필터)
const STOP_WORDS = ["있다", "없는", "있는", "위해", "대한", "통해", "것으로", "기자", "및", "등", "이", "그", "저", "수", "관련", "대해", "따르면", "밝혔다", "오늘", "내일", "어제"];

export default function IssueAnalysis({ newsData, keyword }) {
  const analysisResult = useMemo(() => {
    if (!newsData || newsData.length === 0) return null;

    const wordCounts = {};
    const textCorpus = newsData.map(n => `${n.title} ${n.description}`).join(' ');
    
    // HTML 엔티티(&quot; 등), HTML 태그, 그리고 특수문자 제거 후 단어 추출
    const words = textCorpus
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.includes(w) && w !== keyword);

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sortedKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return sortedKeywords;
  }, [newsData, keyword]);

  if (!analysisResult || analysisResult.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} glass-card`} id="issue-analysis-section">
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>🔍</span>
          최근 7일 주요 이슈 분석 (Fact-based)
        </h2>
        <p className={styles.titleSub}>
          실제 뉴스 보도 내용 기반 빈도 분석 (최대 10개 핵심어)
        </p>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.keywordCloud}>
          {analysisResult.map(([word, count], idx) => {
            // 크기를 빈도수에 비례해 약간 조절 (CSS inline)
            const fontSize = Math.max(0.8, Math.min(1.5, 0.8 + (count * 0.05))) + 'rem';
            const opacity = Math.max(0.6, Math.min(1, 0.5 + (count * 0.1)));
            return (
              <a 
                key={word} 
                href={`https://search.naver.com/search.naver?query=${encodeURIComponent(word)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.wordBadge} 
                style={{ fontSize, opacity, textDecoration: 'none' }}
              >
                #{word} <span className={styles.count}>{count}</span>
              </a>
            );
          })}
        </div>

        <div className={styles.latestNews}>
          <h3 className={styles.subTitle}>📌 최근 보도 헤드라인</h3>
          <ul className={styles.newsList}>
            {(() => {
              const seenTitles = new Set();
              const uniqueNews = [];
              
              for (const news of newsData) {
                // Clean title for comparison (remove HTML, entities, spaces, and special chars)
                const cleanTitle = news.title
                  .replace(/<[^>]*>?/gm, "")
                  .replace(/&[a-z]+;/gi, "")
                  .replace(/[^a-zA-Z0-9가-힣]/g, "")
                  .replace(/\s+/g, "");

                // Check if a significantly similar title has been seen
                // Simple heuristic: exact match of cleaned characters or long common substring
                let isDuplicate = false;
                for (const seen of seenTitles) {
                  if (seen.includes(cleanTitle) || cleanTitle.includes(seen) || 
                      (cleanTitle.length > 10 && seen.length > 10 && 
                       (seen.slice(0, 15) === cleanTitle.slice(0, 15)))) {
                    isDuplicate = true;
                    break;
                  }
                }

                if (!isDuplicate) {
                  seenTitles.add(cleanTitle);
                  uniqueNews.push(news);
                }
                if (uniqueNews.length >= 15) break;
              }

              return uniqueNews.map((news, idx) => {
                let domain = "알수없음";
                try {
                  domain = new URL(news.originallink || news.link).hostname.replace("www.", "");
                } catch (e) {}

                const dateStr = news.pubDate
                  ? new Date(news.pubDate).toLocaleDateString("ko-KR")
                  : "";

                return (
                  <li key={idx}>
                    <a href={news.link} target="_blank" rel="noopener noreferrer" className={styles.newsItemBox}>
                      <div
                        className={styles.newsItemTitle}
                        dangerouslySetInnerHTML={{ __html: news.title.replace(/<[^>]*>?/gm, "").replace(/&quot;/g, '"') }}
                      />
                      <div className={styles.newsItemMeta}>
                        {domain && <span className={styles.newsDomain}>{domain}</span>}
                        {dateStr && <span className={styles.newsDate}>{dateStr}</span>}
                      </div>
                    </a>
                  </li>
                );
              });
            })()}
          </ul>
        </div>
      </div>
    </div>
  );
}
