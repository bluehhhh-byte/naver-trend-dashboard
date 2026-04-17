"use client";

// ─────────────────────────────────────────────────────────────
// [요구사항 4] 컴포넌트 레벨 Error Boundary
//   React의 클래스형 Error Boundary를 구현.
//   차트(TrendChart)와 피드(ReactionFeed / IssueAnalysis) 영역에
//   각각 래핑하여 한 쪽이 오류를 던져도 다른 영역은 정상 동작.
// ─────────────────────────────────────────────────────────────

import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** 하위 트리에서 에러가 발생하면 호출 — state를 갱신해 fallback UI 표시 */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /** 에러 로깅 (Sentry 등 연동 가능) */
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // props.fallback 이 있으면 커스텀 UI, 없으면 기본 에러 카드 표시
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`${styles.errorCard} glass-card`} role="alert">
          <div className={styles.iconWrap}>
            <span className={styles.icon}>⚠️</span>
          </div>
          <h3 className={styles.title}>
            {this.props.label ?? "섹션"} 로딩 실패
          </h3>
          <p className={styles.message}>
            {this.state.error?.message ?? "알 수 없는 오류가 발생했습니다."}
          </p>
          <button className={styles.retryBtn} onClick={this.handleReset}>
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
