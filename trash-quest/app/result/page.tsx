const STAR_STATS = [
  { rank: 4, count: 3 },
  { rank: 3, count: 3 },
  { rank: 2, count: 3 },
  { rank: 1, count: 3 },
];

export default function ResultPage() {
  return (
    <main style={styles.page}>
      <h1 style={styles.title}>RESULT</h1>

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.speechBubble}>
            <p style={styles.speechText}>よくやったね。</p>
            <div style={styles.speechTail} />
          </div>
          <img
            src="/img/waiting_cleaner.png"
            alt="お掃除係"
            style={styles.cleanerImage}
          />
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.imagePanel}>
            <img
              src="/img/after.jpg"
              alt="お片付け後の部屋"
              style={styles.afterImage}
            />
          </div>

          <div style={styles.statsPanel}>
            {STAR_STATS.map((stat) => (
              <div key={stat.rank} style={styles.statRow}>
                <span style={styles.statLabel}>
                  ⭐️{stat.rank}
                </span>
                <span style={styles.statCount}>× {stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0b0b12",
    backgroundImage:
      "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.08) 0%, rgba(11,11,18,0) 60%)",
    padding: "3vh 3vw",
    boxSizing: "border-box" as const,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  title: {
    margin: "0 0 2.5vh 0",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: 900,
    letterSpacing: "0.15em",
    color: "#ffe28a",
    textShadow: "0 0 16px rgba(255, 215, 0, 0.6), 0 2px 4px rgba(0,0,0,0.8)",
  },
  content: {
    display: "flex",
    gap: "2.5vw",
    width: "100%",
    maxWidth: "1200px",
    height: "80vh",
  },
  leftPanel: {
    flex: 1,
    position: "relative" as const,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: "3%",
    overflow: "hidden",
  },
  cleanerImage: {
    height: "60%",
    width: "auto",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.6))",
  },
  speechBubble: {
    position: "absolute" as const,
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#ffffff",
    color: "#2a2a2a",
    borderRadius: "20px",
    padding: "14px 22px",
    maxWidth: "75%",
    boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
    zIndex: 2,
  },
  speechText: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 700,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
  },
  speechTail: {
    position: "absolute" as const,
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "10px solid transparent",
    borderRight: "10px solid transparent",
    borderTop: "12px solid #ffffff",
  },
  rightColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2.5vh",
  },
  imagePanel: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "2px solid rgba(255,215,0,0.4)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  afterImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  statsPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    gap: "1.2vh",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "2px solid rgba(255,215,0,0.4)",
    borderRadius: "16px",
    padding: "2vh 2vw",
    boxSizing: "border-box" as const,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.08)",
    borderRadius: "10px",
    padding: "0.8vh 1.2vw",
  },
  statLabel: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#fff59d",
    textShadow: "0 0 6px rgba(255,255,255,0.5)",
  },
  statCount: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#ffffff",
  },
};
