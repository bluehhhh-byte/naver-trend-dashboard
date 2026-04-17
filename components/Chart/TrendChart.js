"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";
import styles from "./TrendChart.module.css";

const COLORS = [
  "#ef4444", // 1st: Red
  "#3b82f6", // 2nd: Blue
  "#22c55e", // 3rd: Green
  "#a855f7", // 4th: Purple
  "#f97316", // 5th+: Random palette
  "#06b6d4",
  "#ec4899",
  "#eab308"
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({
  data,
  keyword,
  chartKeys = [],
  selectedDate,
  onDateSelect,
}) {
  const safeKeys = chartKeys.length > 0 ? chartKeys : [keyword];

  // Helper to get color consistently for specific keywords
  const getKeyColor = (key, index) => {
    // [요구사항] 3개 이상의 키워드일 경우에는 모든 색상을 랜덤(팔레트 순서)으로 표현
    if (safeKeys.length >= 3) {
      return COLORS[index % COLORS.length];
    }

    const trimmedKey = key.trim();
    // Blue group
    if (["정영두", "김경수", "전재수", "김상욱"].includes(trimmedKey)) return "#3b82f6";
    // Red group
    if (["홍태용", "박완수", "박형준"].includes(trimmedKey)) return "#ef4444";
    // Purple group
    if (trimmedKey === "김해시") return "#a855f7";
    // Green group
    if (trimmedKey === "부울경 메가시티") return "#22c55e";
    
    return COLORS[index % COLORS.length];
  };

  // Find absolute peak (max) for each keyword
  const peaks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return safeKeys.map((k, i) => {
      // Find the row with the maximum value for this specific key
      let maxVal = -1;
      let maxItem = null;
      
      for (const item of data) {
        const val = Number(item[k] || 0);
        if (val > maxVal) {
          maxVal = val;
          maxItem = item;
        }
      }
      
      if (!maxItem) return null;
      
      return {
        date: maxItem.date,
        ratio: maxVal,
        key: k,
        color: getKeyColor(k, i)
      };
    }).filter(Boolean);
  }, [data, safeKeys]);

  // Overall stats
  const stats = useMemo(() => {
    if (!data || !data.length) return null;
    let max = 0;
    let min = 100;
    let sum = 0;
    let count = 0;
    const totalsMap = {};
    safeKeys.forEach(k => { totalsMap[k] = 0; });

    data.forEach(row => {
      safeKeys.forEach(k => {
        const val = row[k] || 0;
        if (val > max) max = val;
        if (val < min) min = val;
        sum += val;
        count++;
        totalsMap[k] += val;
      });
    });

    const avg = count > 0 ? (sum / count).toFixed(1) : 0;
    const keywordTotals = safeKeys.map(k => ({
      name: k,
      total: Number(totalsMap[k].toFixed(1))
    })).sort((a, b) => b.total - a.total);

    return { 
      max, 
      min, 
      avg, 
      peakCount: peaks.length,
      keywordTotals,
      topKeyword: keywordTotals[0],
      secondKeyword: keywordTotals[1]
    };
  }, [data, safeKeys, peaks]);

  const handleChartClick = (e) => {
    if (e && e.activeLabel) {
      // Detect which line was closest or use the highest one at that date
      let targetedKey = keyword;
      if (e.activePayload && e.activePayload.length > 0) {
        // Sort payload by value descending to find the dominant keyword at this point
        const sorted = [...e.activePayload].sort((a, b) => (b.value || 0) - (a.value || 0));
        targetedKey = sorted[0].name;
      }
      onDateSelect(e.activeLabel, targetedKey);
    }
  };

  if (!data || !data.length) {
    return (
      <div className={`${styles.container} glass-card`}>
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
          <p>키워드를 검색하면 검색량 추이가 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} glass-card`} id="trend-chart-section">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>📊</span>
            검색량 추이 비교
          </h2>
          <p className={styles.titleSub}>
            <span className={styles.keywordBadge}>{safeKeys.join(', ')}</span> 
            {safeKeys.length > 1 ? " 간의 상대적 수치 비교" : " 키워드의 기간별 변화"}
          </p>
        </div>
        {stats && (
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>최고 지수</span>
              <span className={`${styles.statValue} ${styles.statHigh}`}>
                {stats.max}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>평균 지수</span>
              <span className={styles.statValue}>{stats.avg}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>최저 지수</span>
              <span className={`${styles.statValue} ${styles.statLow}`}>
                {stats.min}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Peak</span>
              <span className={`${styles.statValue} ${styles.statPeak}`}>
                {stats.peakCount}건
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={data}
            onClick={handleChartClick}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
            
            {safeKeys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={getKeyColor(k, i)}
                strokeWidth={2.5}
                fill={getKeyColor(k, i)}
                fillOpacity={0.15}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}

            {peaks.map((peak) => (
              <ReferenceDot
                key={`${peak.key}-${peak.date}`}
                x={peak.date}
                y={peak.ratio}
                r={6}
                fill={peak.color}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: "pointer", filter: `drop-shadow(0 0 6px ${peak.color})` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDateSelect(peak.date, peak.key);
                }}
              />
            ))}
            {selectedDate && data.find((d) => d.date === selectedDate) && (
              <ReferenceDot
                x={selectedDate}
                // Plot on the highest key
                y={Math.max(...safeKeys.map(k => data.find((d) => d.date === selectedDate)[k] || 0))}
                r={8}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={3}
                style={{ filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        ※ 검색량 지수 산출 방식: 지정 기간 내 최다 검색점(Peak)을 100으로 둘 때의 상대적 검색 비율 지수.
      </div>

      {peaks.length > 0 && (
        <div className={styles.peakList}>
          <span className={styles.peakLabel}>🔥 Peak 포인트:</span>
          {peaks.map((peak) => (
            <button
              key={peak.date}
              className={`${styles.peakChip} ${
                selectedDate === peak.date ? styles.peakChipActive : ""
              }`}
              onClick={() => onDateSelect(peak.date)}
            >
              {peak.date} ({Number(peak.ratio).toFixed(1)})
            </button>
          ))}
        </div>
      )}

      {/* ===== Data Table ===== */}
      <div className={styles.tableContainer}>
        <h3 className={styles.tableHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          상세 검색량 데이터 비교
        </h3>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>날짜</th>
                {safeKeys.map(k => (
                  <th key={k} style={{ textAlign: 'right' }}>{k} 지수</th>
                ))}
                <th style={{ textAlign: 'right' }}>차이</th>
              </tr>
            </thead>
            <tbody>
              {/* Render in reverse order to show latest first */}
              {[...data].reverse().map((row, idx) => (
                <tr key={`${row.date}-${idx}`}>
                  <td className={styles.tdDate}>{row.date}</td>
                  {safeKeys.map((k, i) => {
                    const val = row[k] !== undefined ? row[k] : 0;
                    const rowMax = Math.max(...safeKeys.map(key => row[key] || 0));
                    const isDominant = val > 0 && val === rowMax;
                    
                    return (
                      <td 
                        key={k} 
                        className={`${styles.tdRatio} ${isDominant ? styles.dominantIndex : ""}`} 
                        style={{ color: isDominant ? undefined : getKeyColor(k, i) }}
                      >
                        {Number(val).toFixed(1)}
                      </td>
                    );
                  })}
                  <td className={styles.tdDiff}>
                    {(() => {
                      const vals = safeKeys.map(k => row[k] || 0);
                      return (Math.max(...vals) - Math.min(...vals)).toFixed(1);
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Comparison Insights & Total Analysis ===== */}
      {stats?.keywordTotals && safeKeys.length > 1 && (
        <div className={styles.insightsSection}>
          <h3 className={styles.insightTitle}>
            <span style={{ fontSize: '1.2rem' }}>📈</span> 
            키워드별 누적 검색 점유율 비교
          </h3>
          
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.keywordTotals} layout="vertical" margin={{ left: 20, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={styles.tooltip}>
                          <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>
                            {payload[0].payload.name}: {payload[0].value.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                  {stats.keywordTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getKeyColor(entry.name, safeKeys.indexOf(entry.name))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.insightText}>
            분석 결과, 현재 기간 동안{" "}
            <span className={styles.insightHighlight}>{stats.topKeyword.name}</span>
            {stats.secondKeyword ? (
              <>
                (이)가 총합 <span className={styles.insightHighlight}>{stats.topKeyword.total.toLocaleString()}</span>점으로 
                가장 높은 누적 검색량을 기록하고 있습니다. 이는{" "}
                <span className={styles.insightHighlight}>{stats.secondKeyword.name}</span> 대비 약{" "}
                <span className={styles.insightHighlight}>
                  {((stats.topKeyword.total / stats.secondKeyword.total - 1) * 100).toFixed(1)}%
                </span>{" "}
                우세한 수치입니다.
              </>
            ) : (
              <>
                (이)가 누적 <span className={styles.insightHighlight}>{stats.topKeyword.total.toLocaleString()}</span>점으로 
                단독 트렌드를 형성하고 있습니다.
              </>
            )}
            <br />
            <span style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '8px', display: 'block' }}>
              ※ 누적 점유율은 분석 기간 내 발생한 일별 지수의 합계를 바탕으로 산출되었습니다.
            </span>
          </div>
        </div>
      )}
    </div>

  );
}
