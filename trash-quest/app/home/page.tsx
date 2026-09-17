"use client";

import Link from "next/link";
import { useState } from "react";

import { ITEMS, type ItemId } from "@/lib/game";
import { usePlayer } from "@/lib/use-player";

export default function HomePage() {
  const player = usePlayer();
  const [statusOpen, setStatusOpen] = useState(false);

  const expPercent = `${Math.min(100, (player.exp / player.expToNext) * 100)}%`;

  return (
    <div style={styles.container}>
      {/* 背景画像 */}
      <img src="/img/background-home.png" alt="背景" style={styles.background} />

      {/* ヘッダー部分（タイトルロゴ ＆ ゴールド ＆ メニュー） */}
      <div style={styles.header}>
        <img src="/img/title.png" alt="Trash Quest" style={styles.logo} />
        <div style={styles.goldContainer}>
          <img src="/img/gold.png" alt="ゴールド" style={styles.goldIcon} />
          <span style={styles.goldText}>{player.gold}</span>
        </div>
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
        <div style={styles.floorRecord}>最高到達　第{player.highestFloor}階層</div>

        {/* 中央の勇者キャラクター (hero.png) */}
        <button
          type="button"
          style={styles.heroWrapper}
          onClick={() => setStatusOpen(true)}
          aria-label="勇者のステータスと持ち物を見る"
        >
          <img src="/img/hero.png" alt="勇者" style={styles.heroImage} />
          <span style={styles.heroHint}>タップでステータス</span>
        </button>
      </div>

      {statusOpen && (
        <div style={styles.modalBackdrop} onClick={() => setStatusOpen(false)}>
          <section
            style={styles.statusModal}
            role="dialog"
            aria-modal="true"
            aria-label="勇者のステータス"
            onClick={(event) => event.stopPropagation()}
          >
            <header style={styles.modalHeader}>
              <strong>勇者ユウタ　LV {player.level}</strong>
              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setStatusOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </header>

            <div style={styles.statsGrid}>
              <span>HP <strong>{player.maxHp}</strong></span>
              <span>MP <strong>{player.maxMp}</strong></span>
              <span>攻撃力 <strong>{player.attack}</strong></span>
              <span>防御力 <strong>{player.defense}</strong></span>
            </div>

            <div style={styles.skillLine}>
              魔法　{player.unlockedSkills.includes("fire") ? "🔥 ファイア" : "未習得"}
            </div>

            <h2 style={styles.inventoryTitle}>INVENTORY</h2>
            <div style={styles.inventoryList}>
              {Object.entries(ITEMS).map(([id, item]) => {
                const itemId = id as ItemId;
                return (
                  <div key={itemId} style={styles.inventoryRow}>
                    <img src={item.image} alt="" style={styles.inventoryIcon} />
                    <span>
                      <strong>{item.name}</strong>
                      <small style={styles.inventoryDescription}>{item.description}</small>
                    </span>
                    <strong>×{player.inventory[itemId]}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 下部のメインメニュー */}
      <div style={styles.buttonContainer}>
        <Link href="/shop" style={styles.roundAction} aria-label="ショップへ">
          <span style={styles.shopCircle} aria-hidden="true">
            <img src="/img/shop.png" alt="" style={styles.rpgShopImage} />
          </span>
          <span style={styles.menuLabel}>ショップ</span>
        </Link>

        <Link href="/clean" style={styles.questAction}>
          トラッシュ<br />クエスト
        </Link>

        <Link href="/rpg" style={styles.roundAction} aria-label="冒険に出る">
          <span style={styles.rpgCircle}>
            <img src="/img/rpg-home.png" alt="" style={styles.rpgMenuImage} />
          </span>
          <span style={styles.menuLabel}>冒険に出る</span>
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
    width: "22px",
    height: "22px",
    objectFit: "contain" as const,
    marginRight: "4px",
  },
  goldText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
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
    marginBottom: "4px",
  },
  floorRecord: {
    marginBottom: "8px",
    padding: "3px 10px",
    borderRadius: "999px",
    color: "#fff4ae",
    backgroundColor: "rgba(0,0,0,0.62)",
    fontSize: "11px",
    fontWeight: "bold",
    textShadow: "0 1px 2px #000",
  },
  heroWrapper: {
    position: "relative" as const,
    height: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    color: "#fff",
    backgroundColor: "transparent",
    cursor: "pointer",
  },
  heroImage: {
    maxHeight: "100%",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.6))",
  },
  heroHint: {
    position: "absolute" as const,
    bottom: "0",
    padding: "3px 9px",
    borderRadius: "999px",
    backgroundColor: "rgba(0,0,0,0.62)",
    fontSize: "10px",
  },
  modalBackdrop: {
    position: "absolute" as const,
    inset: 0,
    zIndex: 30,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  statusModal: {
    width: "100%",
    maxHeight: "84vh",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    padding: "18px",
    border: "3px solid #fff",
    borderRadius: "12px",
    color: "#fff",
    background: "linear-gradient(160deg, #20205f, #11132f)",
    boxShadow: "0 14px 45px rgba(0,0,0,0.65)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
    color: "#ffe066",
    fontSize: "18px",
  },
  closeButton: {
    width: "32px",
    height: "32px",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: "50%",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
    cursor: "pointer",
    fontSize: "20px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  skillLine: {
    marginTop: "10px",
    padding: "9px",
    borderRadius: "7px",
    backgroundColor: "rgba(255,255,255,0.08)",
    fontWeight: "bold",
  },
  inventoryTitle: {
    margin: "16px 0 7px",
    color: "#ffe066",
    fontSize: "13px",
    letterSpacing: "0.14em",
  },
  inventoryList: { display: "grid", gap: "7px" },
  inventoryRow: {
    display: "grid",
    gridTemplateColumns: "54px 1fr auto",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.06)",
    fontSize: "13px",
  },
  inventoryIcon: { width: "52px", height: "52px", objectFit: "contain" as const },
  inventoryDescription: {
    display: "block",
    marginTop: "2px",
    color: "#c9c9d9",
    fontSize: "10px",
  },
  buttonContainer: {
    position: "relative" as const,
    zIndex: 10,
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1fr",
    alignItems: "end",
    gap: "8px",
    padding: "24px 12px 20px",
    background:
      "linear-gradient(180deg, transparent, rgba(5,9,17,0.88) 34%)",
  },
  roundAction: {
    display: "grid",
    justifyItems: "center",
    gap: "7px",
    minWidth: 0,
    color: "#fff",
    textDecoration: "none",
  },
  shopCircle: {
    display: "grid",
    width: "clamp(72px, 21vw, 88px)",
    height: "clamp(72px, 21vw, 88px)",
    placeItems: "center",
    border: "2px solid #fff",
    borderRadius: "50%",
    background: "linear-gradient(150deg, #4596bb, #1d3d59)",
    boxShadow: "0 9px 19px rgba(0,0,0,0.52)",
    fontSize: "clamp(30px, 9vw, 38px)",
  },
  questAction: {
    display: "grid",
    minHeight: "76px",
    marginBottom: "26px",
    padding: "8px 12px",
    placeItems: "center",
    border: "2px solid #ffe8a4",
    borderRadius: "999px",
    color: "#fff9e2",
    background: "linear-gradient(155deg, #b9781f, #86392b)",
    boxShadow: "0 11px 23px rgba(0,0,0,0.58)",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "bold",
    lineHeight: 1.2,
    textShadow: "0 2px 4px rgba(0,0,0,0.75)",
  },
  rpgCircle: {
    display: "grid",
    width: "clamp(72px, 21vw, 88px)",
    height: "clamp(72px, 21vw, 88px)",
    overflow: "hidden",
    placeItems: "center",
    border: "2px solid #fff",
    borderRadius: "50%",
    background: "linear-gradient(150deg, #405f83, #17283d)",
    boxShadow: "0 9px 19px rgba(0,0,0,0.52)",
  },
  rpgMenuImage: {
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
  transform: "translateY(-30px)",
  },
  rpgShopImage: {
    width: "60%",
    height: "60%",
    objectFit: "contain" as const,
    transform: "scale(1.16)",
  },
  menuLabel: {
    overflow: "hidden",
    color: "#fff3ce",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: "13px",
    fontWeight: "bold",
    textShadow: "0 2px 4px rgba(0,0,0,0.9)",
  },
};
