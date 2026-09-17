"use client";

import { useState } from "react";
import Link from "next/link";
// ※ Next.jsで画面遷移させるためのルーターをインポート
import { useRouter } from "next/navigation";

const DEMO_IMAGES = {
  before: { src: "/img/demo-before.png", monsterCount: 28 },
  after: { src: "/img/demo-after.png", monsterCount: 0 },
};

export default function CleanPage() {
  const router = useRouter();
  
  // 状態管理
  const [step, setStep] = useState<"before" | "analyzing" | "cleaning" | "after_analyzing" | "result_confirm">("before");
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // スコア（魔物の数）の記録用
  const [beforeCount, setBeforeCount] = useState<number>(0);
  const [afterCount, setAfterCount] = useState<number>(0);

  // APIキーなしで画面遷移を確認するための開発用データ
  const handleDemoImage = (isAfter: boolean = false) => {
    const demo = isAfter ? DEMO_IMAGES.after : DEMO_IMAGES.before;

    setErrorMsg(null);
    setProcessedImage(demo.src);

    if (isAfter) {
      setAfterCount(demo.monsterCount);
      setStep("result_confirm");
    } else {
      setBeforeCount(demo.monsterCount);
      setStep("cleaning");
    }
  };

  // カメラ撮影（画像送信）の共通処理
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, isAfter: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // BeforeかAfterかでステータス（ローディング画面）を切り替え
    setStep(isAfter ? "after_analyzing" : "analyzing");
    setErrorMsg(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;

      try {
        const response = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await response.json();

        if (data.status === "success") {
          setProcessedImage(data.processed_image);
          
          if (!isAfter) {
            // 1回目（Before）の処理
            setBeforeCount(data.monster_count);
            setStep("cleaning");
          } else {
            // 2回目（After）の処理
            setAfterCount(data.monster_count);
            setStep("result_confirm");
          }
        } else {
          setErrorMsg(data.message || "解析に失敗しました");
          setStep(isAfter ? "cleaning" : "before"); // エラー時は前の画面に戻す
        }
      } catch {
        setErrorMsg("サーバーとの通信に失敗しました。");
        setStep(isAfter ? "cleaning" : "before");
      }
    };
  };

  // 討伐数を計算（もしAfterの方がゴミが増えてたら0にする）
  const defeatedCount = Math.max(0, beforeCount - afterCount);

  // リザルト画面へ遷移（討伐数をURLパラメータで渡す）
  const goToResult = () => {
    router.push(`/clean-result?defeated=${defeatedCount}&before=${beforeCount}&after=${afterCount}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/home" style={styles.backButton}>◀ ホーム</Link>
        <div style={styles.title}>討伐クエスト</div>
      </div>

      <div style={styles.content}>
        {/* ステップ1: 撮影前 */}
        {step === "before" && (
          <div style={styles.card}>
            <p style={styles.text}>部屋の中の「魔物（ゴミ）」を<br/>カメラで索敵しよう！</p>
            {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
            <button type="button" onClick={() => handleDemoImage()} style={styles.demoButton}>
              🧪 サンプル画像で試す（APIキー不要）
            </button>
            <p style={styles.orText}>または</p>
            <label style={styles.cameraButton}>
              📷 カメラを起動する
              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, false)} style={{ display: "none" }} />
            </label>
          </div>
        )}

        {/* ローディング（1回目＆2回目） */}
        {(step === "analyzing" || step === "after_analyzing") && (
          <div style={styles.card}>
            <div style={styles.loadingSpinner}>🔮</div>
            <p style={styles.text}>
              {step === "analyzing" ? "魔物をスキャン中..." : "討伐結果を判定中..."}
            </p>
          </div>
        )}

        {/* ステップ3: 掃除タイム（Before結果表示） */}
        {step === "cleaning" && processedImage && (
          <div style={styles.card}>
            <p style={styles.textWarning}>【 {beforeCount} 体 】の魔物を発見！<br/>現実で掃除して討伐せよ！</p>
            <img src={processedImage} alt="解析結果" style={styles.resultImage} />
            <div style={styles.actionButtons}>
              <button type="button" onClick={() => handleDemoImage(true)} style={styles.demoButton}>
                🧪 片付け後のサンプルで再判定
              </button>
              <label style={styles.retryButton}>
                🧹 掃除完了！(再判定へ)
                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, true)} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        )}

        {/* ステップ4: 最終確認（After結果表示） */}
        {step === "result_confirm" && processedImage && (
          <div style={styles.card}>
            <p style={styles.textSuccess}>再スキャン完了！</p>
            <p style={styles.text}>残った魔物: {afterCount} 体</p>
            <img src={processedImage} alt="最終結果" style={styles.resultImage} />
            
            <div style={styles.scoreBox}>
              <p>討伐成功: <strong>{defeatedCount} 体</strong></p>
            </div>

            <button onClick={goToResult} style={styles.finishButton}>
              ✨ リザルト画面へ！
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ーーー ここから下はさっきと同じ styles なので省略（そのまま残してください！）ーーー
const styles = {
  container: { position: "relative" as const, display: "flex", flexDirection: "column" as const, width: "100%", maxWidth: "420px", height: "100vh", margin: "0 auto", backgroundColor: "#1a1a2e", color: "#fff", fontFamily: "sans-serif", boxShadow: "0 0 40px rgba(0,0,0,0.8)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#16213e", borderBottom: "2px solid #e94560" },
  backButton: { color: "#fff", textDecoration: "none", fontSize: "14px", backgroundColor: "#333", padding: "4px 8px", borderRadius: "4px" },
  title: { fontSize: "18px", fontWeight: "bold", color: "#e94560" },
  content: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "20px" },
  card: { backgroundColor: "#0f3460", padding: "24px", borderRadius: "12px", textAlign: "center" as const, width: "100%", border: "2px solid #533483", boxShadow: "0 4px 8px rgba(0,0,0,0.5)" },
  text: { fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" },
  textWarning: { fontSize: "18px", fontWeight: "bold", color: "#ffcc00", marginBottom: "16px" },
  textSuccess: { fontSize: "18px", fontWeight: "bold", color: "#4caf50", marginBottom: "8px" },
  errorText: { color: "#ff4b2b", fontSize: "14px", marginBottom: "16px" },
  demoButton: { width: "100%", backgroundColor: "#e6b800", color: "#111", padding: "12px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", border: "2px solid #fff" },
  orText: { margin: "12px 0", fontSize: "13px", color: "#ccc" },
  cameraButton: { display: "inline-block", backgroundColor: "#e94560", color: "#fff", padding: "16px 24px", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 0 #b02a42" },
  loadingSpinner: { fontSize: "48px", animation: "spin 2s linear infinite", marginBottom: "16px" },
  resultImage: { width: "100%", maxHeight: "300px", objectFit: "contain" as const, borderRadius: "8px", border: "2px solid #fff", marginBottom: "20px" },
  actionButtons: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  retryButton: { display: "inline-block", backgroundColor: "#4a6fa5", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", border: "2px solid #fff" },
  finishButton: { width: "100%", display: "inline-block", backgroundColor: "#e6b800", color: "#111", padding: "12px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", border: "2px solid #fff" },
  scoreBox: { backgroundColor: "#111", padding: "12px", borderRadius: "8px", border: "1px dashed #e6b800", marginBottom: "16px", fontSize: "20px" }
};
