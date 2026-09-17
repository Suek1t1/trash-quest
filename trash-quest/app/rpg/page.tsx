"use client";

import { useState } from "react";
import Link from "next/link";

import { usePlayer } from "@/lib/use-player";

export default function RpgPage() {
  const floor = 1;
  const player = usePlayer();
  const heroHp = player.maxHp;
  const [spentMp, setSpentMp] = useState(0);
  const heroMp = player.maxMp - spentMp;
  const [slimeHp, setSlimeHp] = useState(50);
  const slimeMp = 20;
  const [battleMessage, setBattleMessage] = useState("コマンドを選んでください");

  const fireUnlocked = player.unlockedSkills.includes("fire");

  const handleAttack = () => {
    if (slimeHp > 0) {
      setSlimeHp((previous) => Math.max(0, previous - player.attack));
      setBattleMessage(`勇者の攻撃！ ${player.attack} ダメージ`);
    }
  };

  const handleMagic = () => {
    if (!fireUnlocked) {
      setBattleMessage("まだ魔法を習得していない");
      return;
    }
    if (heroMp < 10) {
      setBattleMessage("MPが足りない");
      return;
    }
    if (slimeHp === 0) return;

    const damage = player.attack + 10;
    setSpentMp((previous) => previous + 10);
    setSlimeHp((previous) => Math.max(0, previous - damage));
    setBattleMessage(`🔥 ファイア！ ${damage} ダメージ`);
  };

  return (
    <div style={styles.container}>
      {/* ーーー 背景画像 ーーー */}
      <img src="/img/background-rpg.png" alt="草原の背景" style={styles.backgroundImage} />

      {/* ーーー 上部：階層表示 ーーー */}
      <div style={styles.topHud}>
        <div style={styles.floorWindow}>第 {floor} 階層</div>
      </div>

      {/* ーーー 中央：バトルエリア（キャラクター＆ゲージ） ーーー */}
      <div style={styles.battleArea}>
        
        {/* 左側：勇者 */}
        <div style={styles.characterWrapper}>
          <img src="/img/hero.png" alt="勇者" style={{ ...styles.characterImage, transform: "translateY(10px)" }} />
          {/* 勇者のHP/MPゲージ */}
          <div style={styles.gaugeContainer}>
            <div style={styles.gaugeRow}>
              <span style={styles.gaugeLabel}>HP</span>
              <div style={styles.gaugeBg}>
                <div style={{ ...styles.gaugeFill, width: `${(heroHp / player.maxHp) * 100}%`, backgroundColor: "#4caf50" }}></div>
              </div>
            </div>
            <div style={styles.gaugeRow}>
              <span style={styles.gaugeLabel}>MP</span>
              <div style={styles.gaugeBg}>
                <div style={{ ...styles.gaugeFill, width: `${(heroMp / player.maxMp) * 100}%`, backgroundColor: "#2196f3" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：スライム */}
        <div style={styles.characterWrapper}>
          <img 
            src="/img/slime.png" 
            alt="スライム" 
            style={{ 
              ...styles.characterImage, 
              opacity: slimeHp === 0 ? 0.3 : 1, // 倒したら薄くなる演出
              transform: slimeHp === 0 ? "scale(0.9)" : "scale(1)" 
            }} 
          />
          {/* スライムのHP/MPゲージ */}
          <div style={styles.gaugeContainer}>
            <div style={styles.gaugeRow}>
              <span style={styles.gaugeLabel}>HP</span>
              <div style={styles.gaugeBg}>
                <div style={{ ...styles.gaugeFill, width: `${(slimeHp / 50) * 100}%`, backgroundColor: "#4caf50" }}></div>
              </div>
            </div>
            <div style={styles.gaugeRow}>
              <span style={styles.gaugeLabel}>MP</span>
              <div style={styles.gaugeBg}>
                <div style={{ ...styles.gaugeFill, width: `${(slimeMp / 20) * 100}%`, backgroundColor: "#2196f3" }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ーーー 下部：コマンドウィンドウ ーーー */}
      <div style={styles.bottomUi}>
        <div style={styles.battleMessage}>{battleMessage}</div>
        <div style={styles.commandWindow}>
          <button style={styles.commandButton} onClick={handleAttack}>攻撃</button>
          <button
            style={{
              ...styles.commandButton,
              opacity: fireUnlocked ? 1 : 0.45,
            }}
            onClick={handleMagic}
          >
            {fireUnlocked ? "🔥 ファイア" : "魔法（未習得）"}
          </button>
          <button style={styles.commandButton}>アイテム</button>
          <Link href="/home" style={{ textDecoration: "none", width: "100%", display: "block" }}>
            <button style={styles.commandButton}>逃げる</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ーーー スタイル定義 ーーー
const styles = {
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    maxWidth: "420px",
    height: "100vh",
    margin: "0 auto",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    zIndex: 0,
  },
  // 共通のRPGウィンドウスタイル（紺色背景＋太い白枠＋黒い縁取り風）
  rpgWindow: {
    backgroundColor: "rgba(20, 20, 70, 0.95)", // 濃いブルー
    border: "4px solid #fff",
    borderRadius: "4px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 2px #000", // 黒い内枠と影
  },
  topHud: {
    position: "relative" as const,
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    paddingTop: "24px",
  },
  floorWindow: {
    backgroundColor: "rgba(20, 20, 70, 0.95)",
    border: "4px solid #fff",
    borderRadius: "4px",
    padding: "8px 24px",
    fontSize: "22px",
    fontWeight: "bold",
    letterSpacing: "2px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
  },
  battleArea: {
    position: "relative" as const,
    zIndex: 10,
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end", // 下揃えにしてゲージの高さを合わせる
    padding: "0 20px 20px",
  },
  characterWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "45%",
  },
  characterImage: {
    width: "200%",
    maxWidth: "250px",
    height: "auto",
    imageRendering: "pixelated" as const,
    transition: "all 0.2s ease-in-out",
    marginBottom: "12px", // 画像とゲージの隙間
  },
  // ゲージ周りのスタイル
  gaugeContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  gaugeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  gaugeLabel: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#fff",
    textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // 黒フチドリ
    width: "28px",
  },
  gaugeBg: {
    flex: 1,
    height: "10px",
    backgroundColor: "#111",
    border: "2px solid #fff",
    borderRadius: "2px",
    boxShadow: "0 0 0 1px #000", // 黒い外枠
  },
  gaugeFill: {
    height: "100%",
    transition: "width 0.3s",
  },
  bottomUi: {
    position: "relative" as const,
    zIndex: 10,
    padding: "16px",
    paddingBottom: "32px",
  },
  battleMessage: {
    marginBottom: "8px",
    padding: "8px 12px",
    textAlign: "center" as const,
    color: "#fff",
    backgroundColor: "rgba(20, 20, 70, 0.9)",
    border: "2px solid #fff",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  commandWindow: {
    backgroundColor: "rgba(20, 20, 70, 0.95)",
    border: "4px solid #fff",
    borderRadius: "4px",
    padding: "24px 16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 2px #000",
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 2列のグリッド
    gap: "24px 16px", // 縦の隙間を広めに
  },
  commandButton: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    fontSize: "24px", // 文字を大きく
    fontWeight: "bold",
    textAlign: "center" as const, // 中央揃え
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    letterSpacing: "2px",
    textShadow: "1px 1px 2px #000",
  },
};
