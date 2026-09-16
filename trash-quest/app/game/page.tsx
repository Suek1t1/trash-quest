"use client";

import { useState } from "react";
import detections from "../detections.json";

// Gemini Vision APIのbox_2dは [ymin, xmin, ymax, xmax] を0〜1000で正規化した値
const BOX_SCALE = 1000;

type Detection = {
  name: string;
  box_2d: [number, number, number, number];
};

type Phase = "sparkle" | "running" | "after";

export default function GamePage() {
  const [phase, setPhase] = useState<Phase>("sparkle");

  if (phase === "after") {
    return (
      <main style={styles.container}>
        <div style={styles.frame}>
          <img src="/img/after.jpg" alt="お片付け後の部屋" style={styles.image} />
          <img src="/img/gauge_full.png" alt="ゲージ(満タン)" style={styles.gauge} />
        </div>
      </main>
    );
  }

  return (
    <main
      style={styles.container}
      onClick={() => {
        if (phase === "sparkle") setPhase("running");
      }}
    >
      <div style={styles.frame}>
        <img src="/img/image.png" alt="ゲーム画面" style={styles.image} />
        <img src="/img/gauge_enp.png" alt="ゲージ" style={styles.gauge} />

        {phase === "running" && (
          <img
            src="/img/cleaner.png"
            alt="お掃除係"
            style={styles.cleaner}
            onAnimationEnd={() => setPhase("after")}
          />
        )}

        {(detections as Detection[]).map((detection, index) => {
          const [ymin, xmin, ymax, xmax] = detection.box_2d;
          const left = (xmin / BOX_SCALE) * 100;
          const top = (ymin / BOX_SCALE) * 100;
          const width = ((xmax - xmin) / BOX_SCALE) * 100;
          const height = ((ymax - ymin) / BOX_SCALE) * 100;
          const delay = (index % 5) * 0.2;

          return (
            <div
              key={index}
              style={{
                ...styles.sparkleBox,
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                animationDelay: `${delay}s`,
              }}
            >
              <span
                style={{
                  ...styles.sparkleStar,
                  top: "-10%",
                  left: "-10%",
                  animationDelay: `${delay}s`,
                }}
              >
                ✨
              </span>
              <span
                style={{
                  ...styles.sparkleStar,
                  top: "-10%",
                  right: "-10%",
                  animationDelay: `${delay + 0.3}s`,
                }}
              >
                ✨
              </span>
              <span
                style={{
                  ...styles.sparkleStar,
                  bottom: "-15%",
                  left: "45%",
                  animationDelay: `${delay + 0.6}s`,
                }}
              >
                ✨
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
  },
  frame: {
    position: "relative" as const,
    // 画像(1280x960)のアスペクト比を保ったまま画面いっぱいに収める
    width: "min(100vw, 133.33vh)",
    height: "min(100vh, 75vw)",
  },
  image: {
    width: "100%",
    height: "100%",
    display: "block",
  },
  sparkleBox: {
    position: "absolute" as const,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,180,0.55) 0%, rgba(255,215,0,0.25) 55%, rgba(255,215,0,0) 75%)",
    boxShadow: "0 0 12px 4px rgba(255,235,150,0.5)",
    animation: "sparkle-glow 1.6s ease-in-out infinite",
    pointerEvents: "none" as const,
  },
  sparkleStar: {
    position: "absolute" as const,
    fontSize: "1.1rem",
    color: "#fff59d",
    textShadow: "0 0 6px rgba(255,255,255,0.9)",
    animation: "sparkle-twinkle 1.2s ease-in-out infinite",
    pointerEvents: "none" as const,
  },
  cleaner: {
    position: "absolute" as const,
    top: "50%",
    height: "35%",
    width: "auto",
    transform: "translateY(-50%)",
    animation: "cleaner-run 2.0s linear forwards",
    pointerEvents: "none" as const,
  },
  gauge: {
    position: "absolute" as const,
    top: "3%",
    left: "3%",
    // 画面(フレーム)を5分割した時の一つ分の幅
    width: "20%",
    height: "auto",
    pointerEvents: "none" as const,
  },
};
