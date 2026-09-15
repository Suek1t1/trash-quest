import Link from "next/link"; // Next.jsのページ移動用パーツをインポート

export default function Home() {
  return (
    <Link href="/game" style={styles.container}>
      {/* 背景画像 */}
      <img src="/img/backgroung.png" alt="背景" style={styles.background} />

      {/* キャラクター */}
      <img src="/img/man.png" alt="キャラクター" style={styles.character} />

      {/* タイトルロゴ */}
      <img src="/img/title.png" alt="TRASH QUEST" style={styles.title} />

      {/* 画面をクリック等の案内テキスト */}
      <div style={styles.clickText}>画面をクリックしてスタート</div>
    </Link>
  );
}

// スタイル定義
const styles = {
  container: {
    position: "relative" as const,
    display: "block",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#000",
    textDecoration: "none",
  },
  background: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  character: {
    position: "absolute" as const,
    bottom: "5%",
    left: "50%",
    transform: "translateX(-50%)",
    height: "55%",
    objectFit: "contain" as const,
  },
  title: {
    position: "absolute" as const,
    top: "5%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "45%",
    objectFit: "contain" as const,
  },
  clickText: {
    position: "absolute" as const,
    bottom: "8%",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: "1.2rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.8)",
    zIndex: 10,
  },
};