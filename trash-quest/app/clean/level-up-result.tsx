"use client";

import { useEffect, useState } from "react";

import { SKILLS, SKILL_IDS } from "@/lib/game";
import type { PlayerState, QuestReward } from "@/lib/player";
import { resultWait } from "./wait";

type ExpStage = "leveling" | "stats" | "skill" | "done";
export type LevelResult = QuestReward & { previousPlayer: PlayerState };

// レベルアップ演出(経験値ゲージ → ステータス上昇 → 新しい魔法)
export default function LevelUpResult({
  result,
  onComplete,
}: {
  result: LevelResult;
  onComplete: () => void;
}) {
  const { previousPlayer, player, earnedExp, unlockedSkills } = result;
  const [stage, setStage] = useState<ExpStage>("leveling");
  const [displayLevel, setDisplayLevel] = useState(previousPlayer.level);
  const [displayExp, setDisplayExp] = useState(previousPlayer.exp);
  const [displayExpToNext, setDisplayExpToNext] = useState(
    previousPlayer.expToNext,
  );
  const [gaugeWidth, setGaugeWidth] = useState(
    (previousPlayer.exp / previousPlayer.expToNext) * 100,
  );
  const [gaugeTransition, setGaugeTransition] = useState("none");
  const [levelBanner, setLevelBanner] = useState<number | null>(null);
  const stageOrder: ExpStage[] = ["leveling", "stats", "skill", "done"];
  const atLeast = (target: ExpStage) =>
    stageOrder.indexOf(stage) >= stageOrder.indexOf(target);

  useEffect(() => {
    let cancelled = false;

    const animateExp = async () => {
      const fast = result.levelsGained > 3;
      const fillDuration = fast ? 190 : 800;
      const resetDuration = fast ? 55 : 180;
      let level = previousPlayer.level;
      let expToNext = previousPlayer.expToNext;

      await resultWait(180);
      for (let index = 0; index < result.levelsGained; index += 1) {
        if (cancelled) return;
        setGaugeTransition(`width ${fillDuration}ms linear`);
        setDisplayExp(expToNext);
        setGaugeWidth(100);
        await resultWait(fillDuration);
        if (cancelled) return;

        level += 1;
        expToNext += 12;
        setDisplayLevel(level);
        setDisplayExp(0);
        setDisplayExpToNext(expToNext);
        setGaugeTransition("none");
        setGaugeWidth(0);
        setLevelBanner(index + 1);
        await resultWait(resetDuration);
      }

      if (cancelled) return;
      const finalFillDuration = fast ? 320 : 650;
      setLevelBanner(null);
      setGaugeTransition(`width ${finalFillDuration}ms ease-out`);
      await resultWait(20);
      setDisplayExp(player.exp);
      setDisplayExpToNext(player.expToNext);
      setGaugeWidth((player.exp / player.expToNext) * 100);
      await resultWait(finalFillDuration + 180);
      if (cancelled) return;

      setStage("stats");
      await resultWait(850);
      if (cancelled) return;
      if (unlockedSkills.length > 0) {
        setStage("skill");
        await resultWait(950);
        if (cancelled) return;
      }
      setStage("done");
    };

    void animateExp();
    return () => {
      cancelled = true;
    };
  }, [
    player.exp,
    player.expToNext,
    previousPlayer.expToNext,
    previousPlayer.level,
    result.levelsGained,
    unlockedSkills,
  ]);

  const statRows = [
    ["HP", previousPlayer.maxHp, player.maxHp - previousPlayer.maxHp],
    ["MP", previousPlayer.maxMp, player.maxMp - previousPlayer.maxMp],
    ["攻撃力", previousPlayer.attack, player.attack - previousPlayer.attack],
    ["防御力", previousPlayer.defense, player.defense - previousPlayer.defense],
  ] as const;

  return (
    <main
      style={{ ...styles.page, cursor: stage === "done" ? "pointer" : "default" }}
      onClick={() => stage === "done" && onComplete()}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && stage === "done") {
          onComplete();
        }
      }}
      role={stage === "done" ? "button" : undefined}
      tabIndex={stage === "done" ? 0 : -1}
    >
      <div style={styles.expTitle}>EXP RESULT</div>
      <img src="/img/hero.png" alt="勇者" style={styles.resultHero} />
      <div style={styles.levelLabel}>LV {displayLevel}</div>
      <div style={styles.earnedExp}>獲得EXP +{earnedExp}</div>

      <div style={styles.expTrack}>
        <div
          style={{
            ...styles.expFill,
            width: `${gaugeWidth}%`,
            transition: gaugeTransition,
          }}
        />
      </div>
      <div style={styles.expValue}>
        {displayExp} / {displayExpToNext}
      </div>

      {levelBanner !== null && (
        <div
          key={levelBanner}
          style={{
            ...styles.levelUpBanner,
            animationDuration: result.levelsGained > 3 ? "0.24s" : "0.8s",
          }}
        >
          LEVEL UP!
        </div>
      )}

      {atLeast("stats") && (
        <section style={styles.statPanel}>
          {statRows.map(([label, before, increase], index) => (
            <div
              key={label}
              style={{ ...styles.statRow, animationDelay: `${index * 0.12}s` }}
            >
              <span>{label}</span>
              <span>
                {before} <strong style={styles.increase}>+{increase}</strong>
              </span>
            </div>
          ))}
        </section>
      )}

      {atLeast("skill") &&
        SKILL_IDS.filter((id) => unlockedSkills.includes(id)).map((id) => (
          <section key={id} style={styles.skillCard}>
            <div style={styles.newMagic}>NEW MAGIC!</div>
            <div style={styles.fireIcon}>{SKILLS[id].icon}</div>
            <strong style={styles.skillName}>{SKILLS[id].name}</strong>
            <span style={styles.skillDescription}>{SKILLS[id].description}</span>
          </section>
        ))}

      <div style={styles.tapHint}>
        {stage === "done" ? "画面をタップしてホームへ" : "報酬を確認中…"}
      </div>
    </main>
  );
}

const styles = {
  page: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "100%",
    maxWidth: "420px",
    minHeight: "100vh",
    margin: "0 auto",
    padding: "20px 18px 24px",
    boxSizing: "border-box" as const,
    overflow: "hidden",
    color: "#fff",
    background:
      "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.16), transparent 38%), #0b0b16",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  tapHint: {
    minHeight: "20px",
    marginTop: "auto",
    paddingTop: "16px",
    color: "#d2d2df",
    fontSize: "13px",
    animation: "tap-pulse 1.6s ease-in-out infinite",
  },
  expTitle: {
    color: "#ffe28a",
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "0.15em",
    textShadow: "0 0 14px rgba(255,215,0,0.55)",
  },
  resultHero: {
    height: "150px",
    marginTop: "10px",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.55))",
  },
  levelLabel: { marginTop: "-4px", fontSize: "24px", fontWeight: "bold" },
  earnedExp: {
    margin: "10px 0",
    color: "#7cf6a3",
    fontSize: "18px",
    fontWeight: "bold",
  },
  expTrack: {
    width: "100%",
    height: "18px",
    overflow: "hidden",
    border: "2px solid #fff",
    borderRadius: "10px",
    backgroundColor: "#242438",
    boxShadow: "0 0 10px rgba(255,255,255,0.18)",
  },
  expFill: {
    height: "100%",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #58d68d, #d4ff72)",
    boxShadow: "0 0 12px rgba(124,246,163,0.8)",
  },
  expValue: { marginTop: "5px", color: "#d9d9e7", fontSize: "12px" },
  levelUpBanner: {
    position: "absolute" as const,
    top: "34%",
    zIndex: 10,
    padding: "15px 26px",
    color: "#fff9c4",
    background:
      "linear-gradient(90deg, transparent, rgba(255,174,0,0.9), transparent)",
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textShadow: "0 0 18px #fff, 0 0 28px #ffb300",
    animation: "level-up-pop 0.8s ease-out",
  },
  statPanel: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "16px",
    transition: "opacity 0.45s, transform 0.45s",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.08)",
    fontWeight: "bold",
    animation: "stat-flash 0.8s ease-out both",
  },
  increase: { color: "#7cf6a3", marginLeft: "5px" },
  skillCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "78%",
    marginTop: "16px",
    padding: "12px 16px",
    border: "2px solid #ffbe55",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, rgba(102,30,25,0.95), rgba(35,18,35,0.98))",
    boxShadow: "0 0 20px rgba(255,116,66,0.35)",
    animation: "skill-card-in 0.65s ease-out",
  },
  newMagic: {
    color: "#ffe28a",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.2em",
  },
  fireIcon: { fontSize: "34px", lineHeight: 1.2 },
  skillName: { fontSize: "21px" },
  skillDescription: { marginTop: "3px", color: "#f1c9bd", fontSize: "12px" },
};
