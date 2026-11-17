export type Detection = {
  name: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] を 0-1000 に正規化した値
  level?: string;
};

// 片付けにくさ(level)ごとに表示する魔物画像
const MONSTER_IMAGES: Record<string, string> = {
  lv1: "/img/tresure-closed.png",
  lv2: "/img/tresure-closed.png",
  lv3: "/img/tresure-closed.png",
  lv4: "/img/tresure-closed.png",
};
const DEFAULT_MONSTER_IMAGE = "/img/tresure-closed.png";

type Props = {
  src: string;
  detections: Detection[];
  alt?: string;
};

// 画像の上に、ゴミの座標(box_2d)へ魔物画像を重ねて表示する
export default function MonsterOverlay({ src, detections, alt = "解析結果" }: Props) {
  return (
    <div style={styles.wrapper}>
      <img src={src} alt={alt} style={styles.image} />
      {detections.map((d, i) => {
        if (!d.box_2d || d.box_2d.length !== 4) return null;
        const [ymin, xmin, ymax, xmax] = d.box_2d;

        // 枠の中心に、枠の短辺に合わせた正方形の魔物を置く
        const cx = (xmin + xmax) / 2 / 10;
        const cy = (ymin + ymax) / 2 / 10;
        const w = (xmax - xmin) / 10;
        const h = (ymax - ymin) / 10;

        return (
          <img
            key={i}
            src={MONSTER_IMAGES[d.level ?? ""] ?? DEFAULT_MONSTER_IMAGE}
            alt={d.name}
            title={d.name}
            style={{
              ...styles.monster,
              left: `${cx}%`,
              top: `${cy}%`,
              // 親(wrapper)の幅基準で正方形にするため、縦横比の違う画像でも width のみ指定
              width: `${Math.min(w, h * 1.0)}%`,
              minWidth: "16px",
            }}
          />
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative" as const,
    width: "100%",
    marginBottom: "20px",
    border: "2px solid #fff",
    borderRadius: "8px",
    overflow: "hidden",
    lineHeight: 0,
  },
  image: { width: "100%", height: "auto", display: "block" },
  monster: {
    position: "absolute" as const,
    transform: "translate(-50%, -50%)",
    height: "auto",
    pointerEvents: "none" as const,
    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))",
  },
};
