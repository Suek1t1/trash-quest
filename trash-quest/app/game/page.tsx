export default function GamePage() {
  return (
    <main style={styles.container}>
      <img src="/img/image.png" alt="ゲーム画面" style={styles.image} />
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
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain" as const,
  },
};
