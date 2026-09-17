"use client";

import Link from "next/link";
import { useState } from "react";

import detectionsJson from "@/api/detections.json";
import QuestResult, { type Detection } from "./quest-result";

const detections = detectionsJson as Detection[];

export default function CleanPage() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const readImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (image: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setErrorMessage(null);
      setImage(reader.result as string);
    };
    reader.onerror = () => setErrorMessage("画像を読み込めませんでした。");
    reader.readAsDataURL(file);
  };

  if (beforeImage && afterImage) {
    return (
      <QuestResult
        beforeImage={beforeImage}
        afterImage={afterImage}
        detections={detections}
      />
    );
  }

  const isAfterCapture = beforeImage !== null;

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <Link href="/home" style={styles.backButton}>
          ◀ ホーム
        </Link>
        <div style={styles.title}>トラッシュクエスト</div>
        <span style={styles.demoBadge}>DEMO</span>
      </header>

      <section style={styles.content}>
        <div style={styles.card}>
          {isAfterCapture ? (
            <>
              <div style={styles.previewFrame}>
                <img
                  src={beforeImage}
                  alt="片付け前の部屋"
                  style={styles.previewImage}
                />
                <span style={styles.beforeLabel}>BEFORE</span>
              </div>
              <p style={styles.warningText}>
                魔物を {detections.length} 体発見！
                <br />
                片付けが終わったら、同じ場所からもう一度撮影しよう。
              </p>
              <CaptureButton
                label={
                  <>
                    <img src="/img/broom.png" alt="" style={styles.broomIcon} />
                    片付け後の写真を撮る
                  </>
                }
                onChange={(event) => readImage(event, setAfterImage)}
              />
            </>
          ) : (
            <>
              <div style={styles.questIcon}>📷</div>
              <h1 style={styles.heading}>部屋の魔物を索敵</h1>
              <p style={styles.text}>
                片付ける前の部屋を撮影してください。
                <br />
                デモでは保存済みの検出結果を使用します。
              </p>
              <CaptureButton
                label="撮影前の写真を撮る"
                onChange={(event) => readImage(event, setBeforeImage)}
              />
            </>
          )}

          {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
        </div>
      </section>
    </main>
  );
}

function CaptureButton({
  label,
  onChange,
}: {
  label: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label style={styles.cameraButton}>
      {label}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        style={{ display: "none" }}
      />
    </label>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    maxWidth: "420px",
    minHeight: "100vh",
    margin: "0 auto",
    background: "linear-gradient(180deg, #15152b 0%, #0b0b16 100%)",
    color: "#fff",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#16213e",
    borderBottom: "2px solid #e94560",
  },
  backButton: {
    justifySelf: "start",
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    backgroundColor: "#333",
    padding: "6px 9px",
    borderRadius: "5px",
  },
  title: { fontSize: "18px", fontWeight: "bold", color: "#e94560" },
  demoBadge: {
    justifySelf: "end",
    color: "#111",
    backgroundColor: "#ffe066",
    borderRadius: "999px",
    padding: "3px 7px",
    fontSize: "10px",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    padding: "24px 20px",
  },
  card: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "24px 20px",
    textAlign: "center" as const,
    backgroundColor: "#0f3460",
    border: "2px solid #533483",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },
  questIcon: { fontSize: "54px", marginBottom: "12px" },
  heading: { margin: "0 0 12px", fontSize: "22px" },
  text: { margin: "0 0 24px", color: "#dce7ff", lineHeight: 1.7 },
  warningText: {
    margin: "18px 0 22px",
    color: "#ffe066",
    fontWeight: "bold",
    lineHeight: 1.65,
  },
  previewFrame: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    border: "2px solid #fff",
    borderRadius: "10px",
    backgroundColor: "#05050b",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  beforeLabel: {
    position: "absolute" as const,
    top: "10px",
    left: "10px",
    padding: "4px 9px",
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.12em",
  },
  cameraButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "15px 18px",
    color: "#fff",
    backgroundColor: "#e94560",
    borderRadius: "9px",
    boxShadow: "0 4px 0 #b02a42",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  broomIcon: { width: "26px", height: "26px", objectFit: "contain" as const },
  errorText: { margin: "18px 0 0", color: "#ff8b7d", fontSize: "14px" },
};
