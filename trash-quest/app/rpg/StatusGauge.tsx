// HP・MPなどのゲージ1本分
type Props = {
  label: string;
  value: number;
  max: number;
  color: string;
};

export default function StatusGauge({ label, value, max, color }: Props) {
  return (
    <div style={styles.gaugeRow}>
      <span style={styles.gaugeLabel}>{label}</span>
      <div style={styles.gaugeBg}>
        <div
          style={{
            ...styles.gaugeFill,
            width: `${Math.max(0, (value / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span style={styles.gaugeValue}>{value}</span>
    </div>
  );
}

const styles = {
  gaugeRow: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "4px",
    marginBottom: "4px",
  },
  gaugeLabel: {
    width: "24px",
    fontSize: "11px",
    fontWeight: 900,
    textShadow: "1px 1px 0 #000",
  },
  gaugeBg: {
    flex: 1,
    height: "9px",
    overflow: "hidden",
    border: "2px solid #fff",
    borderRadius: "3px",
    backgroundColor: "#111",
    boxShadow: "0 0 0 1px #000",
  },
  gaugeFill: { height: "100%", transition: "width 0.32s ease-out" },
  gaugeValue: {
    width: "27px",
    textAlign: "right" as const,
    fontSize: "10px",
    fontWeight: "bold",
    textShadow: "1px 1px 0 #000",
  },
};
