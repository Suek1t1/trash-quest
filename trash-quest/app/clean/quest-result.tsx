"use client";

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { drawItem, ITEMS } from "@/lib/game";
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
type ExpStage = "leveling" | "stats" | "skill" | "done";
type LevelResult = QuestReward & { previousPlayer: PlayerState };
type FlightPath = {
  index: number;
  level: DetectionLevel;
  left: number;
  top: number;
  x: number;
  y: number;
  scatterX: number;
  scatterY: number;
  delay: number;
  backgroundSize: string;
  backgroundPosition: string;
};

const BOX_SCALE = 1000;
const RANKS: DetectionLevel[] = ["lv4", "lv3", "lv2", "lv1"];
const STAR_BY_LEVEL: Record<DetectionLevel, string> = {
  lv1: "★",
  lv2: "★★",
  lv3: "★★★",
  lv4: "★★★★",
};
const LEVEL_COLORS: Record<DetectionLevel, string> = {
  lv1: "#74e36f",
  lv2: "#ffd447",
  lv3: "#ff914d",
  lv4: "#ff4f87",
};
const CLEANER_DURATION = 1800;
const FLIGHT_DURATION = 720;

function cleanerDelay([, xmin, , xmax]: Detection["box_2d"]): number {
  const centerX = (xmin + xmax) / 2 / BOX_SCALE;
  return ((centerX + 0.45) / 1.65) * CLEANER_DURATION;
}

const resultWait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

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
  const pageRef = useRef<HTMLElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const rankRefs = useRef<Partial<Record<DetectionLevel, HTMLDivElement | null>>>({});
  const [imagePhase, setImagePhase] = useState<ImagePhase>("before");
  const [resultScreen, setResultScreen] = useState<ResultScreen>("collection");
  const [flightPaths, setFlightPaths] = useState<FlightPath[]>([]);
  const [collectedCounts, setCollectedCounts] = useState<Record<DetectionLevel, number>>({
    lv1: 0,
    lv2: 0,
    lv3: 0,
    lv4: 0,
  });
  const [collectionComplete, setCollectionComplete] = useState(false);
  const [rewardItem] = useState(drawItem);
  const [levelResult, setLevelResult] = useState<LevelResult | null>(null);

  useEffect(() => {
    const transitionTimer = window.setTimeout(
      () => setImagePhase("transition"),
      1100,
    );
    return () => window.clearTimeout(transitionTimer);
  }, []);

  useLayoutEffect(() => {
    if (imagePhase !== "transition") return;
    const page = pageRef.current?.getBoundingClientRect();
    const frame = imageFrameRef.current?.getBoundingClientRect();
    if (!page || !frame) return;

    setFlightPaths(
      detections.flatMap((detection, index) => {
        const target = rankRefs.current[detection.level]?.getBoundingClientRect();
        if (!target) return [];

        const [ymin, xmin, ymax, xmax] = detection.box_2d;
        const centerX = (xmin + xmax) / 2 / BOX_SCALE;
        const centerY = (ymin + ymax) / 2 / BOX_SCALE;
        const startX = frame.left - page.left + frame.width * centerX;
        const startY = frame.top - page.top + frame.height * centerY;
        const targetX = target.left - page.left + 44 + (index % 4) * 4;
        const targetY = target.top - page.top + target.height / 2 + ((index % 3) - 1) * 4;
        const boxWidth = Math.max(1, xmax - xmin);
        const boxHeight = Math.max(1, ymax - ymin);

        return [{
          index,
          level: detection.level,
          left: startX - 17,
          top: startY - 17,
          x: targetX - startX,
          y: targetY - startY,
          scatterX: (index % 2 === 0 ? -1 : 1) * (18 + (index % 4) * 6),
          scatterY: -20 - (index % 3) * 8,
          delay: cleanerDelay(detection.box_2d),
          backgroundSize: `${(BOX_SCALE / boxWidth) * 100}% ${(BOX_SCALE / boxHeight) * 100}%`,
          backgroundPosition: `${(xmin / Math.max(1, BOX_SCALE - boxWidth)) * 100}% ${(ymin / Math.max(1, BOX_SCALE - boxHeight)) * 100}%`,
        }];
      }),
    );
  }, [detections, imagePhase]);

  useEffect(() => {
    if (imagePhase !== "transition" || flightPaths.length !== detections.length) {
      return;
    }

    const timers = flightPaths.map((path) =>
      window.setTimeout(
        () =>
          setCollectedCounts((current) => ({
            ...current,
            [path.level]: current[path.level] + 1,
          })),
        path.delay + FLIGHT_DURATION - 90,
      ),
    );
    const finalDelay = Math.max(...flightPaths.map(({ delay }) => delay), CLEANER_DURATION);
    timers.push(
      window.setTimeout(() => {
        setImagePhase("after");
        setCollectionComplete(true);
      }, finalDelay + FLIGHT_DURATION + 180),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [detections.length, flightPaths, imagePhase]);

  const showLevelResult = () => {
    if (!collectionComplete || levelResult) return;

    const previousPlayer = loadPlayer();
    const reward = applyQuestReward(
      previousPlayer,
      detections.map((detection) => detection.level),
      rewardItem,
    );
    savePlayer(reward.player);
    setLevelResult({ ...reward, previousPlayer });
    setResultScreen("level-up");
  };

  if (resultScreen === "level-up" && levelResult) {
    return (
      <LevelUpResult
        result={levelResult}
        onComplete={() => router.push("/home")}
      />
    );
  }

  const collectedTotal = Object.values(collectedCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const chestOpen = collectionComplete;
  const item = ITEMS[rewardItem];

  return (
    <main
      ref={pageRef}
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

      <div ref={imageFrameRef} style={styles.imageFrame}>
        <img
          src={imagePhase === "after" ? afterImage : beforeImage}
          alt={imagePhase === "after" ? "片付け後の部屋" : "片付け前の部屋"}
          style={styles.resultImage}
        />
        {imagePhase === "transition" && (
          <img
            src={afterImage}
            alt=""
            aria-hidden="true"
            style={styles.afterWipe}
          />
        )}
        <span style={styles.imageLabel}>
          {imagePhase === "after"
            ? "AFTER"
            : imagePhase === "transition"
              ? "CLEANING"
              : "BEFORE"}
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
                  color: LEVEL_COLORS[detection.level],
                  animation:
                    imagePhase === "transition"
                      ? `trash-disperse 520ms ease-out ${cleanerDelay(detection.box_2d)}ms forwards`
                      : "sparkle-glow 1.6s ease-in-out infinite",
                  animationDelay:
                    imagePhase === "transition" ? undefined : `${(index % 5) * 0.18}s`,
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
          />
        )}
      </div>

      {imagePhase === "transition" &&
        flightPaths.map((path) => (
          <span
            key={path.index}
            className="trash-flight"
            aria-hidden="true"
            style={{
              left: path.left,
              top: path.top,
              backgroundImage: `url(${beforeImage})`,
              backgroundSize: path.backgroundSize,
              backgroundPosition: path.backgroundPosition,
              borderColor: LEVEL_COLORS[path.level],
              boxShadow: `0 0 8px #fff, 0 0 16px ${LEVEL_COLORS[path.level]}`,
              animationDelay: `${path.delay}ms`,
              "--flight-x": `${path.x}px`,
              "--flight-y": `${path.y}px`,
              "--scatter-x": `${path.scatterX}px`,
              "--scatter-y": `${path.scatterY}px`,
            } as CSSProperties}
          >
            ✦
          </span>
        ))}

      <section style={styles.collectionPanel} aria-live="polite">
        {RANKS.map((level) => (
          <div
            key={level}
            ref={(node) => {
              rankRefs.current[level] = node;
            }}
            style={{
              ...styles.collectionRow,
              color: LEVEL_COLORS[level],
              opacity: collectedCounts[level] > 0 ? 1 : 0.42,
              transform: collectedCounts[level] > 0 ? "scale(1)" : "scale(0.98)",
            }}
          >
            <span style={styles.stars}>{STAR_BY_LEVEL[level]}</span>
            <span style={styles.count}>× {collectedCounts[level]}</span>
          </div>
        ))}
        <div className={`treasure ${chestOpen ? "treasure-open" : ""}`}>
          <span className="treasure-rays" aria-hidden="true" />
          <span className="treasure-particle treasure-particle-1" aria-hidden="true">✦</span>
          <span className="treasure-particle treasure-particle-2" aria-hidden="true">✧</span>
          <span className="treasure-particle treasure-particle-3" aria-hidden="true">✦</span>
          <img
            src={chestOpen ? "/img/tresure-opened.png" : "/img/tresure-closed.png"}
            alt={chestOpen ? "開いた宝箱" : "閉じた宝箱"}
            style={styles.treasureImage}
          />
          {collectionComplete && (
            <button
              type="button"
              className="loot-reveal"
              data-tooltip={`${item.name}：${item.description}`}
              title={`${item.name}：${item.description}`}
              aria-label={`${item.name}。${item.description}`}
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={item.image}
                alt=""
                className="loot-item-image"
                style={styles.lootImage}
              />
            </button>
          )}
        </div>
        <div
          style={{
            ...styles.total,
            opacity: collectionComplete ? 1 : 0,
          }}
        >
          合計 {collectedTotal} 個回収！
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
      if (unlockedSkills.includes("fire")) {
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
  afterWipe: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover" as const,
    clipPath: "inset(0 100% 0 0)",
    animation: `after-wipe ${CLEANER_DURATION}ms linear forwards`,
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
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    marginTop: "8px",
  },
  treasureImage: {
    position: "relative" as const,
    zIndex: 2,
    width: "205px",
    height: "88px",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 7px 7px rgba(0,0,0,0.65))",
  },
  lootImage: {
    width: "160px",
    height: "160px",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 0 9px rgba(255,241,145,0.9))",
  },
  collectionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "34px",
    padding: "4px 44px",
    borderBottom: "1px solid rgba(255,255,255,0.09)",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.045), transparent)",
    transition: "opacity 0.25s, transform 0.25s, filter 0.25s",
  },
  stars: {
    minWidth: "92px",
    fontSize: "18px",
    letterSpacing: "-0.06em",
    textShadow: "0 0 9px currentColor",
  },
  count: { fontWeight: "bold", fontSize: "20px" },
  total: {
    paddingTop: "7px",
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
