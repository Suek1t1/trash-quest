"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type Detection = {
  name: string;
  box_2d: [number, number, number, number];
  level: "lv1" | "lv2" | "lv3" | "lv4";
};

export default function GamePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
    setFileName(file.name);
    setDetections([]);
    setErrorMessage(null);
  }

  async function inspectImage() {
    if (!imageFile) return;

    setIsInspecting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await fetch("/api/inspect", { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "画像を検査できませんでした。");
      setDetections(result.detections ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "画像を検査できませんでした。");
    } finally {
      setIsInspecting(false);
    }
  }

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl || detections.length === 0) return;

    const image = new Image();
    image.onload = () => {
      const canvas = resultCanvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);

      detections.forEach((detection) => {
        const [yMin, xMin, yMax, xMax] = detection.box_2d;
        const x = (xMin / 1000) * canvas.width;
        const y = (yMin / 1000) * canvas.height;
        const width = ((xMax - xMin) / 1000) * canvas.width;
        const height = ((yMax - yMin) / 1000) * canvas.height;
        const color = levelColors[detection.level];

        context.strokeStyle = color;
        context.lineWidth = Math.max(3, canvas.width / 300);
        context.strokeRect(x, y, width, height);
        context.font = `700 ${Math.max(14, canvas.width / 45)}px sans-serif`;
        const labelWidth = context.measureText(detection.name).width + 16;
        const labelHeight = Math.max(24, canvas.width / 25);
        context.fillStyle = color;
        context.fillRect(x, Math.max(0, y - labelHeight), labelWidth, labelHeight);
        context.fillStyle = "#ffffff";
        context.fillText(detection.name, x + 8, Math.max(labelHeight - 7, y - 7));
      });
    };
    image.src = imageUrl;
  }, [imageUrl, detections]);

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>掃除スタート！</h1>
        <p style={styles.description}>写真を選んでゴミをチェックしましょう。</p>

        <label htmlFor="image-upload" style={styles.uploadButton}>
          写真をアップロード
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={styles.fileInput}
        />

        {imageUrl && (
          <div style={styles.previewArea}>
            <img src={imageUrl} alt="選択した写真" style={styles.preview} />
            <p style={styles.fileName}>{fileName}</p>
            <button type="button" onClick={inspectImage} disabled={isInspecting} style={styles.inspectButton}>
              {isInspecting ? "Geminiが検査中..." : "Geminiで部屋の散らかりを検査"}
            </button>
            {errorMessage && <p style={styles.error}>{errorMessage}</p>}
            {!isInspecting && !errorMessage && detections.length > 0 && (
              <>
                <div style={styles.generatedImageArea}>
                  <h2 style={styles.resultsTitle}>検査結果画像</h2>
                  <canvas ref={resultCanvasRef} style={styles.generatedImage} />
                </div>
                <div style={styles.results}>
                  <h2 style={styles.resultsTitle}>検出された片付けポイント: {detections.length}件</h2>
                  <ul style={styles.resultList}>
                    {detections.map((detection, index) => (
                      <li key={`${detection.name}-${index}`} style={styles.resultItem}>
                        <span>{detection.name}</span>
                        <strong style={{ ...styles[detection.level], ...styles.levelBadge }}>
                          {detection.level}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {!isInspecting && !errorMessage && detections.length === 0 && (
              <p style={styles.hint}>写真を送信すると、Geminiが片付けるものを探します。</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "48px 24px",
    display: "flex",
    justifyContent: "center",
    background: "#eef4ef",
  },
  panel: {
    width: "min(720px, 100%)",
    minHeight: "360px",
    padding: "48px 32px",
    textAlign: "center" as const,
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 12px 30px rgba(25, 55, 35, 0.12)",
  },
  title: { margin: "0 0 12px", color: "#173b2b" },
  description: { margin: "0 0 28px", color: "#52635a" },
  uploadButton: {
    display: "inline-block",
    padding: "14px 24px",
    borderRadius: "8px",
    background: "#217346",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },
  fileInput: { display: "none" },
  previewArea: { marginTop: "32px" },
  preview: {
    display: "block",
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain" as const,
    borderRadius: "8px",
    background: "#f4f6f4",
  },
  fileName: { margin: "12px 0 0", color: "#52635a" },
  inspectButton: {
    marginTop: "20px",
    padding: "13px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#d86b32",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: { margin: "18px 0 0", color: "#b42318" },
  hint: { margin: "18px 0 0", color: "#52635a" },
  generatedImageArea: { marginTop: "28px", textAlign: "left" as const },
  generatedImage: {
    display: "block",
    width: "100%",
    height: "auto",
    borderRadius: "8px",
    background: "#f4f6f4",
  },
  results: {
    marginTop: "28px",
    padding: "20px",
    textAlign: "left" as const,
    borderRadius: "8px",
    background: "#f4f6f4",
  },
  resultsTitle: { margin: "0 0 14px", color: "#173b2b", fontSize: "1.1rem" },
  resultList: { display: "grid", gap: "8px", margin: 0, padding: 0, listStyle: "none" },
  resultItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "10px 12px",
    background: "#ffffff",
    borderRadius: "6px",
    color: "#26382d",
  },
  lv1: { color: "#216e39", background: "#d9f2df" },
  lv2: { color: "#8a5a00", background: "#fff1c7" },
  lv3: { color: "#a04400", background: "#ffe0c2" },
  lv4: { color: "#a51d2d", background: "#ffd9df" },
  levelBadge: { padding: "4px 8px", borderRadius: "999px", fontSize: "0.8rem" },
};

const levelColors = {
  lv1: "#2f9e44",
  lv2: "#d08a00",
  lv3: "#d95f02",
  lv4: "#c92a2a",
};