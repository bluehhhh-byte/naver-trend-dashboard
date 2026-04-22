"use client";

import { useState } from "react";
import styles from "./Header.module.css";

export default function Header({ onSearch, isLoading }) {
  const [keyword, setKeyword] = useState("정영두 & 홍태용");
  
  const today = new Date();
  let m1 = new Date();
  m1.setMonth(m1.getMonth() - 1);
  const defaultEndDate = today.toISOString().split("T")[0];
  const defaultStartDate = m1.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const presetKeywords = ["김해시", "정영두", "홍태용", "김경수", "박완수", "전재수", "박형준", "김상욱", "부울경 메가시티"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    onSearch({ keyword: keyword.trim(), startDate, endDate });
  };

  const handlePresetClick = (preset) => {
    // Split current keywords and handle multi-select logic
    let currentKeywords = keyword.split('&').map(k => k.trim()).filter(Boolean);
    
    if (currentKeywords.includes(preset)) {
      // Remove if already exists
      currentKeywords = currentKeywords.filter(k => k !== preset);
    } else {
      // Add if new
      currentKeywords.push(preset);
    }
    
    const newKeyword = currentKeywords.join(' & ');
    setKeyword(newKeyword);
    
    // Auto trigger search if newKeyword is not empty
    if (newKeyword) {
      onSearch({ keyword: newKeyword, startDate, endDate });
    }
  };

  return (
    <header className={styles.header} id="dashboard-header">
      <a
        href="https://notebooklm.google.com/notebook/7aa09a39-116c-43e3-8033-8a0bc622d3d7"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.notebookBtn}
        title="NotebookLM으로 분석하기"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
        <span>NotebookLM 분석</span>
      </a>

      <div className={styles.titleSection}>

        <div className={styles.logoMark}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
            <path
              d="M8 22L12 12L16 18L20 10L24 16"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="18" r="2" fill="white" opacity="0.8" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>선거 이슈 트렌드 분석 시스템</h1>
          <p className={styles.subtitle}>
            검색량 추이 분석 · 뉴스/SNS 반응 탐색
          </p>
        </div>
      </div>

      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <div className={styles.keywordInputWrap}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="keyword-input"
              type="text"
              className={`${styles.keywordInput} input-field`}
              placeholder="정치 키워드를 입력하세요..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className={styles.dateInputs}>
            <input
              id="start-date-input"
              type="date"
              className={`${styles.dateInput} input-field`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className={styles.dateSep}>~</span>
            <input
              id="end-date-input"
              type="date"
              className={`${styles.dateInput} input-field`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            id="search-button"
            type="submit"
            className={`btn-primary ${styles.searchBtn}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            분석 시작
          </button>
        </div>

        <div className={styles.presets}>
          <span className={styles.presetsLabel}>빠른 검색:</span>
          {presetKeywords.map((pk) => {
            const activeKeys = keyword.split('&').map(s => s.trim()).filter(Boolean);
            const isActive = activeKeys.includes(pk);
            const activeCount = activeKeys.length;
            
            // Define custom styles for specific keywords when active
            let activeStyle = {};
            if (isActive) {
              const trimmedPK = pk.trim();
              // [요구사항] 3개 이상의 키워드일 경우에는 고정 색상 대신 순차적/랜덤 색상 표현
              const useFixedColor = activeCount < 3;

              if (useFixedColor && trimmedPK === "김해시") {
                activeStyle = { 
                  backgroundColor: "rgba(168, 85, 247, 0.15)", 
                  borderColor: "#a855f7", 
                  color: "#a855f7",
                  boxShadow: "0 0 12px rgba(168, 85, 247, 0.2)"
                };
              } else if (useFixedColor && ["정영두", "김경수", "전재수", "김상욱"].includes(trimmedPK)) {
                activeStyle = { 
                  backgroundColor: "rgba(59, 130, 246, 0.15)", 
                  borderColor: "#3b82f6", 
                  color: "#3b82f6",
                  boxShadow: "0 0 12px rgba(59, 130, 246, 0.2)"
                };
              } else if (useFixedColor && ["홍태용", "박완수", "박형준"].includes(trimmedPK)) {
                activeStyle = { 
                  backgroundColor: "rgba(239, 68, 68, 0.15)", 
                  borderColor: "#ef4444", 
                  color: "#ef4444",
                  boxShadow: "0 0 12px rgba(239, 68, 68, 0.2)"
                };
              } else if (useFixedColor && trimmedPK === "부울경 메가시티") {
                activeStyle = { 
                  backgroundColor: "rgba(34, 197, 94, 0.15)", 
                  borderColor: "#22c55e", 
                  color: "#22c55e",
                  boxShadow: "0 0 12px rgba(34, 197, 94, 0.2)"
                };
              } else {
                // Random-ish color for other keywords (excluding Purple, Blue, Red, Green)
                const others = [
                  { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", text: "#f59e0b" }, // Orange
                  { bg: "rgba(6, 182, 212, 0.15)", border: "#06b6d4", text: "#06b6d4" }, // Cyan
                  { bg: "rgba(236, 72, 153, 0.15)", border: "#ec4899", text: "#ec4899" }, // Pink
                ];
                const hash = pk.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const choice = others[hash % others.length];
                activeStyle = { 
                  backgroundColor: choice.bg, 
                  borderColor: choice.border, 
                  color: choice.text,
                  boxShadow: `0 0 12px ${choice.bg}`
                };
              }
            }

            return (
              <button
                key={pk}
                type="button"
                className={`${styles.presetChip} ${
                  isActive ? styles.presetActive : ""
                }`}
                style={isActive ? activeStyle : {}}
                onClick={() => handlePresetClick(pk)}
              >
                {pk}
              </button>
            );
          })}
        </div>
      </form>
    </header>
  );
}
