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
} from "@/lib/player";
import LevelUpResult, { type LevelResult } from "./level-up-result";
import type { Detection } from "@/lib/detections";

type ImagePhase = "before" | "transition" | "after";
type ResultScreen = "collection" | "level-up";
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
export const MONSTER_IMAGES: Record<DetectionLevel, string> = {
  lv1: "/img/tresure-closed.png",
  lv2: "/img/tresure-closed.png",
  lv3: "/img/tresure-closed.png",
  lv4: "/img/tresure-closed.png",
};
const CLEANER_DURATION = 1800;
const FLIGHT_DURATION = 720;

function cleanerDelay([, xmin, , xmax]: Detection["box_2d"]): number {
  const centerX = (xmin + xmax) / 2 / BOX_SCALE;
  return ((centerX + 0.45) / 1.65) * CLEANER_DURATION;
}

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
                  animation:
                    imagePhase === "transition"
                      ? `trash-disperse 520ms ease-out ${cleanerDelay(detection.box_2d)}ms forwards`
                      : "none",
                }}
              >
                <img
                  src={MONSTER_IMAGES[detection.level] ?? MONSTER_IMAGES.lv2}
                  alt={detection.name}
                  style={styles.monsterImage}
                />
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
    pointerEvents: "none" as const,
  },
  monsterImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))",
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
};
