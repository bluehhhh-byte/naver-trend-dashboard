"use client";

import { useState } from "react";
import styles from "./ReactionFeed.module.css";

function decodeEntities(text) {
  if (!text) return "";
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html) {
  if (!html) return "";
  const plain = html.replace(/<[^>]*>/g, "");
  return decodeEntities(plain);
}

// Helper to generate a one‑line summary without double quotes
function summarizeText(text) {
  if (!text) return "";
  // Remove HTML tags, decode entities, and remove double quotes
  let plain = text.replace(/<[^>]*>/g, "");
  plain = decodeEntities(plain).replace(/"/g, "");
  
  // Return first sentence
  const sentences = plain.split(/[.!?]\s/);
  return sentences[0] ? sentences[0].trim() + "." : plain.trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  // Handle "20260301" format
  if (dateStr.length === 8 && !dateStr.includes("-")) {
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function NewsCard({ item, index }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={styles.cardHeader}>
        <span className={`badge badge-blue ${styles.cardBadge}`}>뉴스</span>
        <span className={styles.cardDate}>{formatDate(item.pubDate)}</span>
      </div>
      <h3 className={styles.cardTitle}>{stripHtml(item.title)}</h3>
      {/* One-line summary without quotes */}
      <p className={styles.cardDesc}>{summarizeText(item.description)}</p>
      <div className={styles.cardFooter}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15,3 21,3 21,9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span>
          {(() => {
            try {
              return new URL(item.originallink || item.link).hostname.replace("www.", "");
            } catch (e) {
              return "기사 원문 보기";
            }
          })()}
        </span>
      </div>
    </a>
  );
}

function BlogCard({ item, index }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={styles.cardHeader}>
        <span className={`badge badge-purple ${styles.cardBadge}`}>블로그</span>
        <span className={styles.cardDate}>{formatDate(item.postdate)}</span>
      </div>
      <h3 className={styles.cardTitle}>{stripHtml(item.title)}</h3>
      {/* One-line summary without quotes */}
      <p className={styles.cardDesc}>{summarizeText(item.description)}</p>
      <div className={styles.cardFooter}>
        <div className={styles.bloggerInfo}>
          <div className={styles.bloggerAvatar}>
            {item.bloggername?.charAt(0) || "B"}
          </div>
          <span>{item.bloggername}</span>
        </div>
      </div>
    </a>
  );
}

export default function ReactionFeed({
  newsData,
  blogData,
  selectedDate,
  keyword,
  isLoading,
}) {
  const [activeTab, setActiveTab] = useState("news");

  const tabItems = [
    {
      key: "news",
      label: "뉴스 반응",
      icon: "📰",
      count: newsData?.length > 30 ? 30 : (newsData?.length || 0),
    },
    {
      key: "blog",
      label: "SNS / 블로그",
      icon: "💬",
      count: blogData?.length > 30 ? 30 : (blogData?.length || 0),
    },
  ];

  return (
    <div
      className={`${styles.container} glass-card`}
      id="reaction-feed-section"
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>🔍</span>
            반응 피드
          </h2>
          {selectedDate && (
            <p className={styles.titleSub}>
              <span className={styles.dateBadge}>{selectedDate}</span> 시점의{" "}
              <strong>{keyword}</strong> 관련 반응
            </p>
          )}
          {!selectedDate && (
            <p className={styles.titleSub}>
              차트에서 날짜를 클릭하거나 Peak 포인트를 선택하세요
            </p>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${
              activeTab === tab.key ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.feedScrollArea}>
        <div className={styles.feedContent}>
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <p>데이터를 불러오는 중...</p>
            </div>
          )}

          {!isLoading && !selectedDate && (
            <div className={styles.emptyState}>
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <p>위 차트에서 날짜 또는 Peak 포인트를 클릭하면</p>
              <p>해당 시점의 뉴스와 SNS 반응이 표시됩니다</p>
            </div>
          )}

          {!isLoading && selectedDate && activeTab === "news" && (
            <div className={styles.cardGrid}>

              {newsData?.length > 0 ? (
                // Show newest first, max 30 items
                [...newsData]
                  .sort((a, b) => new Date(b.pubDate || b.date) - new Date(a.pubDate || a.date))
                  .slice(0, 30)
                  .map((item, i) => (
                    <NewsCard key={i} item={item} index={i} />
                  ))
              ) : (
                <p className={styles.noData}>관련 뉴스가 없습니다.</p>
              )}
            </div>
          )}

          {!isLoading && selectedDate && activeTab === "blog" && (
            <div className={styles.cardGrid}>
              {blogData?.length > 0 ? (
                // Show newest first, max 30 items
                [...blogData]
                  .sort((a, b) => new Date(b.postdate || b.date) - new Date(a.postdate || a.date))
                  .slice(0, 30)
                  .map((item, i) => (
                    <BlogCard key={i} item={item} index={i} />
                  ))
              ) : (
                <p className={styles.noData}>관련 블로그 글이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
