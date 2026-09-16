"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function GamePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
  }

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

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
};