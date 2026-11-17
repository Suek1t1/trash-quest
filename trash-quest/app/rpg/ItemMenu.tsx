import { ITEMS, type ItemId } from "@/lib/game";

type Props = {
  itemIds: ItemId[]; // 持っているアイテムだけ
  inventory: Record<ItemId, number>;
  busy: boolean;
  onUse: (itemId: ItemId) => void;
  onBack: () => void;
};

// 戦闘中に使うアイテムの一覧
export default function ItemMenu({ itemIds, inventory, busy, onUse, onBack }: Props) {
  return (
    <div style={styles.itemWindow}>
      {itemIds.length === 0 && (
        <div style={styles.emptyItems}>持っているアイテムがない</div>
      )}
      {itemIds.map((itemId) => {
        const item = ITEMS[itemId];
        return (
          <button
            key={itemId}
            style={styles.itemButton}
            disabled={busy}
            onClick={() => onUse(itemId)}
          >
            <img src={item.image} alt="" style={styles.itemIcon} />
            <span>{item.name}</span>
            <strong>×{inventory[itemId]}</strong>
          </button>
        );
      })}
      <button style={styles.backButton} onClick={onBack}>
        戻る
      </button>
    </div>
  );
}

const styles = {
  itemWindow: {
    maxHeight: "240px",
    overflowY: "auto" as const,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "10px",
    border: "4px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.96)",
  },
  itemButton: {
    display: "grid",
    gridTemplateColumns: "42px 1fr auto",
    alignItems: "center",
    gap: "4px",
    minHeight: "52px",
    padding: "4px 7px",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "6px",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
    cursor: "pointer",
    fontSize: "11px",
  },
  itemIcon: { width: "42px", height: "42px", objectFit: "contain" as const },
  emptyItems: {
    gridColumn: "1 / -1",
    padding: "10px",
    color: "#fff",
    textAlign: "center" as const,
    fontSize: "13px",
  },
  backButton: {
    gridColumn: "1 / -1",
    minHeight: "38px",
    border: "1px solid #fff",
    borderRadius: "5px",
    color: "#fff",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
