import { useEffect, useRef, useState } from "react";

import { SKILLS, type SkillId } from "@/lib/game";

type Props = {
  skillIds: SkillId[]; // 習得済みの魔法
  mp: number;
  busy: boolean;
  onCast: (skillId: SkillId) => void;
  onBack: () => void;
};

// 習得した魔法のスクロール一覧(カーソルで選ぶ)
export default function MagicMenu({ skillIds, mp, busy, onCast, onBack }: Props) {
  const [cursor, setCursor] = useState(0);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const updateScroll = () => {
    const list = listRef.current;
    if (!list) return;
    setCanScrollMore(list.scrollTop + list.clientHeight < list.scrollHeight - 2);
  };

  useEffect(() => {
    updateScroll();
    listRef.current?.focus({ preventScroll: true });
  }, [skillIds.length]);

  return (
    <div style={styles.magicWindow}>
      <div
        ref={listRef}
        style={styles.magicList}
        tabIndex={0}
        role="listbox"
        aria-label="魔法一覧"
        onScroll={updateScroll}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const delta = event.key === "ArrowDown" ? 1 : -1;
            setCursor((current) =>
              Math.min(skillIds.length - 1, Math.max(0, current + delta)),
            );
          } else if (event.key === "Enter") {
            const id = skillIds[cursor];
            if (id) onCast(id);
          }
        }}
      >
        {skillIds.map((id, index) => {
          const selected = index === cursor;
          const skill = SKILLS[id];
          return (
            <button
              key={id}
              ref={(node) => {
                if (selected && node) node.scrollIntoView({ block: "nearest" });
              }}
              role="option"
              aria-selected={selected}
              disabled={busy}
              style={{
                ...styles.magicRow,
                color: selected ? "#ffe066" : "#fff",
                opacity: mp >= skill.mpCost ? 1 : 0.5,
              }}
              onMouseEnter={() => setCursor(index)}
              onClick={() => {
                setCursor(index);
                onCast(id);
              }}
            >
              <span style={styles.magicCursor}>{selected ? "👉" : ""}</span>
              <span style={styles.magicIcon}>{skill.icon}</span>
              <span style={styles.magicName}>
                {skill.name}
                <small style={styles.magicDescription}>{skill.description}</small>
              </span>
              <span style={styles.magicCost}>MP {skill.mpCost}</span>
            </button>
          );
        })}
      </div>
      <div style={styles.magicFooter}>
        <span style={{ opacity: canScrollMore ? 1 : 0 }}>▼</span>
        <button style={styles.magicBack} onClick={onBack}>
          戻る
        </button>
      </div>
    </div>
  );
}

const styles = {
  magicWindow: {
    padding: "8px 10px",
    border: "4px solid #fff",
    borderRadius: "5px",
    background: "linear-gradient(180deg, #1a2a9a 0%, #0a0f4a 100%)",
  },
  magicList: {
    maxHeight: "176px",
    overflowY: "auto" as const,
    outline: "none",
    scrollbarWidth: "thin" as const,
  },
  magicRow: {
    display: "grid",
    gridTemplateColumns: "26px 30px 1fr auto",
    alignItems: "center",
    gap: "4px",
    width: "100%",
    minHeight: "44px",
    padding: "2px 6px",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    textAlign: "left" as const,
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "bold",
    textShadow: "1px 1px 0 #000",
  },
  magicCursor: { fontSize: "18px" },
  magicIcon: { fontSize: "20px", textAlign: "center" as const },
  magicName: { display: "flex", flexDirection: "column" as const },
  magicDescription: {
    fontSize: "10px",
    fontWeight: "normal",
    opacity: 0.8,
  },
  magicCost: { fontSize: "14px", fontVariantNumeric: "tabular-nums" },
  magicFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
    color: "#fff",
  },
  magicBack: {
    padding: "4px 14px",
    border: "1px solid #fff",
    borderRadius: "5px",
    color: "#fff",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
