"use client";

import Link from "next/link";

import { usePlayer } from "@/lib/use-player";

export default function HomePage() {
  const player = usePlayer();

  const expPercent = `${Math.min(100, (player.exp / player.expToNext) * 100)}%`;

  return (
    <div style={styles.container}>
      {/* 背景画像 */}
      <img src="/img/background-home.png" alt="背景" style={styles.background} />

      {/* ヘッダー部分（タイトルロゴ ＆ ゴールド ＆ メニュー） */}
      <div style={styles.header}>
        <img src="/img/title.png" alt="Trash Quest" style={styles.logo} />
        <div style={styles.goldContainer}>
          <span style={styles.goldIcon}>🪙</span>
          <span style={styles.goldText}>1661</span>
        </div>
        <div style={styles.menuButton}>☰</div>
      </div>

      {/* ステータス＆キャラクター表示エリア */}
      <div style={styles.statusSection}>
        <div style={styles.levelText}>LV {player.level} 勇者ユウタ</div>
        <div style={styles.expContainer}>
          <div style={styles.expBarLabel}>EXP</div>
          <div style={styles.expBarTrack}>
            <div style={{ ...styles.expBarFill, width: expPercent }} />
          </div>
          <div style={styles.expText}>{player.exp} / {player.expToNext}</div>
        </div>
        <div style={styles.nextExpText}>
          NEXT LVまであと {player.expToNext - player.exp} EXP
        </div>

        {/* 中央の勇者キャラクター (hero.png) */}
        <div style={styles.heroWrapper}>
          <img src="/img/hero.png" alt="勇者" style={styles.heroImage} />
        </div>
      </div>

      {/* 下部のアクションボタンエリア */}
      <div style={styles.buttonContainer}>
        {/* レベリング（お掃除）ボタン */}
        <Link href="/clean" style={styles.actionCardYellow}>
          <img src="/img/clean-home.png" alt="討伐クエスト" style={styles.actionIcon} />
          <div style={styles.actionTextGroup}>
            <span style={styles.actionTitle}>討伐クエストへ</span>
            <span style={styles.actionSub}>（カメラ起動）</span>
          </div>
          <span style={styles.actionCategory}>レベリング</span>
        </Link>

        {/* RPG攻略ボタン */}
        <Link href="/rpg" style={styles.actionCardBlue}>
          <img src="/img/rpg-home.png" alt="冒険に出る" style={styles.actionIcon} />
          <div style={styles.actionTextGroup}>
            <span style={styles.actionTitle}>冒険に出る</span>
            <span style={styles.actionSub}>（ダンジョン）</span>
          </div>
          <span style={styles.actionCategory}>RPG攻略</span>
        </Link>
      </div>
    </div>
  );
}

// スタイル定義（スマホ比率固定 ＆ グリッド感の調整）
const styles = {
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "420px",
    height: "100vh",
    margin: "0 auto",
    overflow: "hidden",
    backgroundColor: "#111",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
    fontFamily: "sans-serif",
  },
  background: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    zIndex: 0,
    filter: "brightness(0.7)", // 背景を少し暗くして文字を見やすく
  },
  header: {
    position: "relative" as const,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 0 16px",
  },
  logo: {
    width: "130px",
    objectFit: "contain" as const,
  },
  goldContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid #d4af37",
  },
  goldIcon: {
    fontSize: "14px",
    marginRight: "4px",
  },
  goldText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
  },
  menuButton: {
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: "2px 8px",
    borderRadius: "6px",
  },
  statusSection: {
    position: "relative" as const,
    zIndex: 10,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "0 16px",
  },
  levelText: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    textShadow: "0 2px 4px rgba(0,0,0,0.9)",
    marginBottom: "4px",
  },
  expContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "4px 10px",
    borderRadius: "12px",
    border: "1px solid #fff",
    width: "100%",
    maxWidth: "280px",
    justifyContent: "space-between",
    marginBottom: "2px",
  },
  expBarLabel: {
    color: "#ffcc00",
    fontWeight: "bold",
    fontSize: "12px",
  },
  expBarTrack: {
    flex: 1,
    height: "8px",
    backgroundColor: "#444",
    borderRadius: "4px",
    margin: "0 8px",
    overflow: "hidden",
  },
  expBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff416c, #ff4b2b)",
    transition: "width 0.5s ease-out",
  },
  expText: {
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
  },
  nextExpText: {
    color: "#ddd",
    fontSize: "10px",
    textShadow: "0 1px 2px rgba(0,0,0,0.9)",
    marginBottom: "12px",
  },
  heroWrapper: {
    height: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    maxHeight: "100%",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.6))",
  },
  buttonContainer: {
    position: "relative" as const,
    zIndex: 10,
    display: "flex",
    gap: "12px",
    padding: "0 16px 24px 16px",
  },
  actionCardYellow: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    backgroundColor: "#e6b800",
    border: "3px solid #fff",
    borderRadius: "12px",
    padding: "10px",
    textDecoration: "none",
    boxShadow: "0 4px 6px rgba(0,0,0,0.4)",
  },
  actionCardBlue: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    backgroundColor: "#4a6fa5",
    border: "3px solid #fff",
    borderRadius: "12px",
    padding: "10px",
    textDecoration: "none",
    boxShadow: "0 4px 6px rgba(0,0,0,0.4)",
  },
  actionIcon: {
    
    width: "200px",
    height: "100px",
    objectFit: "contain" as const,
    marginBottom: "4px",
  },
  actionTextGroup: {
    textAlign: "center" as const,
    marginBottom: "4px",
  },
  actionTitle: {
    display: "block",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "bold",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
  },
  actionSub: {
    display: "block",
    color: "#f0f0f0",
    fontSize: "10px",
  },
  actionCategory: {
    color: "#222",
    backgroundColor: "rgba(255,255,255,0.8)",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "4px",
  },
};
