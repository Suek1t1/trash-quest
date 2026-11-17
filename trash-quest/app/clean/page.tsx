"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import detectionsJson from "@/api/detections.json";
import { parseDetections, type Detection } from "@/lib/detections";
import { prepareImage } from "@/lib/prepare-image";
import QuestResult, { MONSTER_IMAGES } from "./quest-result";

export default function CleanPage() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function inspect(file: File) {
    if (isDemo) {
      setDetections(parseDetections(detectionsJson));
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 55_000);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch("/api/inspect", { method: "POST", body: form, signal: controller.signal });
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error(response.status === 413
          ? "画像が大きすぎます。解像度を下げて選び直してください。"
          : "画像解析に接続できませんでした。しばらく待って再試行してください。");
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "画像解析に失敗しました。");
      try {
        setDetections(parseDetections(result.detections));
      } catch {
        throw new Error("画像解析の結果が正しくありません。再試行してください。");
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error("通信に失敗しました。接続を確認して再試行してください。");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
      controllerRef.current = null;
    }
  }

  async function runImageTask(task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await task();
    } catch (error) {
      setErrorMessage(error instanceof Error && error.name === "AbortError"
        ? "画像解析がタイムアウトしました。再試行してください。"
        : error instanceof Error ? error.message : "画像を処理できませんでした。");
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  const readImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    after: boolean,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await runImageTask(async () => {
      const prepared = await prepareImage(file);
      if (after) {
        setAfterImage(prepared.preview);
      } else {
        setBeforeImage(prepared.preview);
        setBeforeFile(prepared.file);
        setAfterImage(null);
        setDetections(null);
        await inspect(prepared.file);
      }
    });
  };

  if (beforeImage && afterImage && detections && detections.length > 0) {
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
        <span style={styles.demoBadge}>{isDemo ? "DEMO" : "Gemini"}</span>
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
                {detections?.map((detection, index) => {
                  const [ymin, xmin, ymax, xmax] = detection.box_2d;
                  return (
                    <img
                      key={`${detection.name}-${index}`}
                      src={MONSTER_IMAGES[detection.level] ?? MONSTER_IMAGES.lv2}
                      alt={detection.name}
                      style={{
                        ...styles.monster,
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                      }}
                    />
                  );
                })}
                <span style={styles.beforeLabel}>BEFORE</span>
              </div>
              {detections !== null && (
                <p style={styles.warningText}>
                  {detections.length > 0 ? `魔物を ${detections.length} 体発見！` : "片付けるものは見つかりませんでした。別の写真を選べます。"}
                  {detections.length > 0 && <><br />片付けが終わったら、同じ場所からもう一度撮影しよう。<br />前後画像の自動比較は行いません。</>}
                </p>
              )}
              {!isBusy && detections === null && beforeFile && (
                <button type="button" style={styles.cameraButton} onClick={() => void runImageTask(() => inspect(beforeFile))}>
                  画像解析を再試行
                </button>
              )}
              {detections !== null && detections.length > 0 && <CaptureButton
                label={
                  <>
                    <img src="/img/broom.png" alt="" style={styles.broomIcon} />
                    片付け後の写真を撮る
                  </>
                }
                disabled={isBusy}
                onChange={(event) => void readImage(event, true)}
              />}
              <CaptureButton label="片付け前の写真を選び直す" disabled={isBusy} onChange={(event) => void readImage(event, false)} />
            </>
          ) : (
            <>
              <div style={styles.questIcon}>📷</div>
              <h1 style={styles.heading}>部屋の魔物を索敵</h1>
              <p style={styles.text}>
                片付ける前の部屋を撮影してください。
                <br />
                {isDemo ? "デモでは保存済みの検出結果を使用します。" : "写真をGeminiへ送信し、片付けるものを解析します。"}
              </p>
              <label>
                <input type="checkbox" checked={isDemo} disabled={isBusy} onChange={(event) => setIsDemo(event.target.checked)} />
                固定の検出結果でデモを試す
              </label>
              <CaptureButton
                label="片付け前の写真を撮る"
                disabled={isBusy}
                onChange={(event) => void readImage(event, false)}
              />
            </>
          )}

          {isBusy && <p role="status">{beforeImage && detections === null ? "Geminiで画像を解析中…" : "画像を準備中…"}</p>}
          {errorMessage && <p role="alert" style={styles.errorText}>{errorMessage}</p>}
        </div>
      </section>
    </main>
  );
}

function CaptureButton({
  label,
  onChange,
  disabled,
}: {
  label: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <label style={{ ...styles.cameraButton, opacity: disabled ? 0.5 : 1, marginTop: "16px" }}>
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
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
    overflow: "hidden",
    lineHeight: 0,
    border: "2px solid #fff",
    borderRadius: "10px",
    backgroundColor: "#05050b",
  },
  previewImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  monster: {
    position: "absolute" as const,
    objectFit: "contain" as const,
    pointerEvents: "none" as const,
    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))",
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
