"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";

// クエリパラメータを安全に取得するための内部コンポーネント
function ResultContent() {
  const searchParams = useSearchParams();
  const defeatedStr = searchParams.get("defeated") || "0";
  const defeatedCount = parseInt(defeatedStr, 10);

  // 報酬の計算（1体につき EXP 150, ゴールド 100）
  const earnedExp = defeatedCount * 150;
  const earnedGold = defeatedCount * 100;

  // 画面を開いた瞬間に、前回の保存データに今回の報酬を自動加算する
  useEffect(() => {
    const currentExp = parseInt(localStorage.getItem("player_exp") || "0", 10);
    const currentGold = parseInt(localStorage.getItem("player_gold") || "0", 10);

    localStorage.setItem("player_exp", (currentExp + earnedExp).toString());
    localStorage.setItem("player_gold", (currentGold + earnedGold).toString());
  }, [earnedExp, earnedGold]);

  return (
    <div style={styles.card}>
      <div style={styles.badge}>QUEST CLEAR!!</div>
      
      <h1 style={styles.congratsTitle}>🎉 討伐大成功！ 🎉</h1>
      <p style={styles.subText}>お部屋の魔物を綺麗に浄化しました！</p>

      {/* 成果表示エリア */}
      <div style={styles.statsBox}>
        <div style={styles.statRow}>
          <span>⚔️ 討伐した魔物:</span>
          <span style={styles.statValue}>{defeatedCount} 体</span>
        </div>
        <div style={styles.statRow}>
          <span>✨ 獲得 EXP:</span>
          <span style={styles.statValueExp}>+{earnedExp} EXP</span>
        </div>
        <div style={styles.statRow}>
          <span>💰 獲得 ゴールド:</span>
          <span style={styles.statValueGold}>+{earnedGold} G</span>
        </div>
      </div>

      {/* ホームへ戻るボタン */}
      <Link href="/home" style={styles.homeButton}>
        🏰 冒険の拠点（ホーム）へ帰還する
      </Link>
    </div>
  );
}

// Suspenseで囲むことでNext.jsのビルドエラーを防ぐ
export default function CleanResultPage() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>クエストリザルト</div>
      </div>

      <div style={styles.content}>
        <Suspense fallback={<div style={{color: "#fff"}}>報酬を集計中...</div>}>
          <ResultContent />
        </Suspense>
      </div>
    </div>
  );
}

// スタイル定義
const styles = {
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    maxWidth: "420px",
    height: "100vh",
    margin: "0 auto",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontFamily: "sans-serif",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    backgroundColor: "#16213e",
    borderBottom: "2px solid #e94560",
  },
  title: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#e94560",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "#0f3460",
    padding: "28px 20px",
    borderRadius: "16px",
    textAlign: "center" as const,
    width: "100%",
    border: "2px solid #e6b800",
    boxShadow: "0 0 20px rgba(230, 184, 0, 0.3)",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#e6b800",
    color: "#111",
    fontWeight: "bold",
    fontSize: "14px",
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "16px",
  },
  congratsTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "8px",
  },
  subText: {
    fontSize: "14px",
    color: "#ccc",
    marginBottom: "24px",
  },
  statsBox: {
    backgroundColor: "#16213e",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #533483",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "16px",
  },
  statValue: {
    fontWeight: "bold",
    color: "#fff",
  },
  statValueExp: {
    fontWeight: "bold",
    color: "#4caf50",
    fontSize: "18px",
  },
  statValueGold: {
    fontWeight: "bold",
    color: "#ffcc00",
    fontSize: "18px",
  },
  homeButton: {
    display: "block",
    backgroundColor: "#e94560",
    color: "#fff",
    padding: "16px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    boxShadow: "0 4px 0 #b02a42",
    textAlign: "center" as const,
  },
};