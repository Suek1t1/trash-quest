"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  applyQuestReward,
  loadPlayer,
  savePlayer,
  type DetectionLevel,
  type PlayerState,
  type QuestReward,
} from "@/lib/player";

export type Detection = {
  name: string;
  box_2d: [number, number, number, number];
  level: DetectionLevel;
};

type ImagePhase = "before" | "transition" | "after";
type ResultScreen = "collection" | "level-up";
type ExpStage = "start" | "gain" | "level-up" | "stats" | "skill" | "done";
type LevelResult = QuestReward & { previousPlayer: PlayerState };

const BOX_SCALE = 1000;
const RANKS: DetectionLevel[] = ["lv4", "lv3", "lv2", "lv1"];
const STAR_BY_LEVEL: Record<DetectionLevel, string> = {
  lv1: "★",
  lv2: "★★",
  lv3: "★★★",
  lv4: "★★★★",
};

export default function QuestResult({
  beforeImage,
  afterImage,
  detections,
}: {
  beforeImage: string;
  afterImage: string;
  detections: Detection[];
}) {
  const router = useRouter();
  const [imagePhase, setImagePhase] = useState<ImagePhase>("before");
  const [resultScreen, setResultScreen] = useState<ResultScreen>("collection");
  const [revealedRanks, setRevealedRanks] = useState(0);
  const [collectionComplete, setCollectionComplete] = useState(false);
  const [expStage, setExpStage] = useState<ExpStage>("start");
  const [levelResult, setLevelResult] = useState<LevelResult | null>(null);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        RANKS.map((level) => [
          level,
          detections.filter((detection) => detection.level === level).length,
        ]),
      ) as Record<DetectionLevel, number>,
    [detections],
  );

  useEffect(() => {
    const transitionTimer = window.setTimeout(
      () => setImagePhase("transition"),
      1100,
    );
    return () => window.clearTimeout(transitionTimer);
  }, []);

  useEffect(() => {
    if (imagePhase !== "after") return;

    const timers = RANKS.map((_, index) =>
      window.setTimeout(() => setRevealedRanks(index + 1), 350 * (index + 1)),
    );
    timers.push(
      window.setTimeout(
        () => setCollectionComplete(true),
        350 * RANKS.length + 450,
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [imagePhase]);

  useEffect(() => {
    if (resultScreen !== "level-up") return;

    const stages: [ExpStage, number][] = [
      ["gain", 120],
      ["level-up", 1450],
      ["stats", 2250],
      ["skill", 3200],
      ["done", 4000],
    ];
    const timers = stages.map(([stage, delay]) =>
      window.setTimeout(() => setExpStage(stage), delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [resultScreen]);

  const showLevelResult = () => {
    if (!collectionComplete) return;

    const previousPlayer = loadPlayer();
    const reward = applyQuestReward(
      previousPlayer,
      detections.map((detection) => detection.level),
    );
    savePlayer(reward.player);
    setLevelResult({ ...reward, previousPlayer });
    setResultScreen("level-up");
  };

  if (resultScreen === "level-up" && levelResult) {
    return (
      <LevelUpResult
        result={levelResult}
        stage={expStage}
        onComplete={() => expStage === "done" && router.push("/home")}
      />
    );
  }

  const activeImage = imagePhase === "after" ? afterImage : beforeImage;

  return (
    <main
      style={{ ...styles.page, cursor: collectionComplete ? "pointer" : "default" }}
      onClick={showLevelResult}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") showLevelResult();
      }}
      role={collectionComplete ? "button" : undefined}
      tabIndex={collectionComplete ? 0 : -1}
    >
      <div style={styles.resultHeader}>
        <span style={styles.resultKicker}>QUEST CLEAR</span>
        <strong>魔物回収リザルト</strong>
      </div>

      <div style={styles.imageFrame}>
        <img
          src={activeImage}
          alt={imagePhase === "after" ? "片付け後の部屋" : "片付け前の部屋"}
          style={{
            ...styles.resultImage,
            animation:
              imagePhase === "after" ? "result-image-in 0.7s ease-out" : undefined,
          }}
        />
        <span style={styles.imageLabel}>
          {imagePhase === "after" ? "AFTER" : "BEFORE"}
        </span>

        {imagePhase !== "after" &&
          detections.map((detection, index) => {
            const [ymin, xmin, ymax, xmax] = detection.box_2d;
            return (
              <div
                key={`${detection.name}-${index}`}
                style={{
                  ...styles.sparkleBox,
                  top: `${(ymin / BOX_SCALE) * 100}%`,
                  left: `${(xmin / BOX_SCALE) * 100}%`,
                  width: `${((xmax - xmin) / BOX_SCALE) * 100}%`,
                  height: `${((ymax - ymin) / BOX_SCALE) * 100}%`,
                  animationDelay: `${(index % 5) * 0.18}s`,
                }}
              >
                ✨
              </div>
            );
          })}

        {imagePhase === "transition" && (
          <img
            src="/img/cleaner.png"
            alt="お掃除係"
            style={styles.runningCleaner}
            onAnimationEnd={() => setImagePhase("after")}
          />
        )}
      </div>

      <section style={styles.collectionPanel} aria-live="polite">
        {RANKS.map((level, index) => (
          <div
            key={level}
            style={{
              ...styles.collectionRow,
              opacity: revealedRanks > index ? 1 : 0,
              transform:
                revealedRanks > index ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <span style={styles.stars}>{STAR_BY_LEVEL[level]}</span>
            <span style={styles.count}>× {counts[level]}</span>
          </div>
        ))}
        <div
          style={{
            ...styles.total,
            opacity: collectionComplete ? 1 : 0,
          }}
        >
          合計 {detections.length} 個回収！
        </div>
      </section>

      <div style={styles.tapHint}>
        {collectionComplete ? "画面をタップ" : "回収結果を集計中…"}
      </div>
    </main>
  );
}

function LevelUpResult({
  result,
  stage,
  onComplete,
}: {
  result: LevelResult;
  stage: ExpStage;
  onComplete: () => void;
}) {
  const { previousPlayer, player, earnedExp, unlockedSkills } = result;
  const stageOrder: ExpStage[] = [
    "start",
    "gain",
    "level-up",
    "stats",
    "skill",
    "done",
  ];
  const atLeast = (target: ExpStage) =>
    stageOrder.indexOf(stage) >= stageOrder.indexOf(target);
  const gaugeWidth =
    stage === "start"
      ? (previousPlayer.exp / previousPlayer.expToNext) * 100
      : stage === "gain"
        ? 100
        : (player.exp / player.expToNext) * 100;
  const statRows = [
    ["HP", previousPlayer.maxHp, player.maxHp - previousPlayer.maxHp],
    ["MP", previousPlayer.maxMp, player.maxMp - previousPlayer.maxMp],
    ["攻撃力", previousPlayer.attack, player.attack - previousPlayer.attack],
    ["防御力", previousPlayer.defense, player.defense - previousPlayer.defense],
  ] as const;

  return (
    <main
      style={{ ...styles.page, cursor: stage === "done" ? "pointer" : "default" }}
      onClick={onComplete}
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
      <div style={styles.levelLabel}>
        LV {atLeast("level-up") ? player.level : previousPlayer.level}
      </div>
      <div style={styles.earnedExp}>獲得EXP +{earnedExp}</div>

      <div style={styles.expTrack}>
        <div
          style={{
            ...styles.expFill,
            width: `${gaugeWidth}%`,
            transition:
              stage === "level-up" ? "none" : "width 1.15s ease-in-out",
          }}
        />
      </div>
      <div style={styles.expValue}>
        {atLeast("level-up") ? player.exp : previousPlayer.exp} / {player.expToNext}
      </div>

      {stage === "level-up" && <div style={styles.levelUpBanner}>LEVEL UP!</div>}

      <section
        style={{
          ...styles.statPanel,
          opacity: atLeast("stats") ? 1 : 0,
          transform: atLeast("stats") ? "translateY(0)" : "translateY(16px)",
        }}
      >
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

      {atLeast("skill") && unlockedSkills.includes("fire") && (
        <section style={styles.skillCard}>
          <div style={styles.newMagic}>NEW MAGIC!</div>
          <div style={styles.fireIcon}>🔥</div>
          <strong style={styles.skillName}>ファイア</strong>
          <span style={styles.skillDescription}>敵1体に炎属性ダメージ</span>
        </section>
      )}

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
  resultHeader: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "3px",
    marginBottom: "14px",
    color: "#ffe28a",
    fontSize: "22px",
    letterSpacing: "0.08em",
    textShadow: "0 0 12px rgba(255,215,0,0.45)",
  },
  resultKicker: { fontSize: "11px", letterSpacing: "0.25em", color: "#fff" },
  imageFrame: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    border: "2px solid rgba(255,226,138,0.8)",
    borderRadius: "14px",
    backgroundColor: "#000",
    boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
  },
  resultImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover" as const,
  },
  imageLabel: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    padding: "4px 9px",
    borderRadius: "4px",
    backgroundColor: "rgba(0,0,0,0.72)",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.14em",
  },
  sparkleBox: {
    position: "absolute" as const,
    display: "grid",
    placeItems: "center",
    minWidth: "14px",
    minHeight: "14px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,180,0.7), rgba(255,215,0,0.18) 58%, transparent 76%)",
    boxShadow: "0 0 12px 4px rgba(255,235,150,0.48)",
    animation: "sparkle-glow 1.6s ease-in-out infinite",
    pointerEvents: "none" as const,
  },
  runningCleaner: {
    position: "absolute" as const,
    top: "50%",
    height: "48%",
    width: "auto",
    zIndex: 4,
    transform: "translateY(-50%)",
    animation: "cleaner-run 1.8s linear forwards",
    pointerEvents: "none" as const,
  },
  collectionPanel: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "16px",
  },
  collectionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    border: "1px solid rgba(255,226,138,0.28)",
    borderRadius: "9px",
    backgroundColor: "rgba(255,215,0,0.08)",
    transition: "opacity 0.3s, transform 0.3s",
  },
  stars: { color: "#ffe066", fontSize: "12px", letterSpacing: "-0.08em" },
  count: { fontWeight: "bold", fontSize: "17px" },
  total: {
    gridColumn: "1 / -1",
    paddingTop: "5px",
    textAlign: "center" as const,
    color: "#ffe28a",
    fontSize: "20px",
    fontWeight: "bold",
    transition: "opacity 0.4s",
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
