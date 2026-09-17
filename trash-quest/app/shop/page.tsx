"use client";

import Link from "next/link";
import { useState } from "react";

import { ITEMS, type ItemId } from "@/lib/game";
import { buyItem, savePlayer } from "@/lib/player";
import { usePlayer } from "@/lib/use-player";

export default function ShopPage() {
  const player = usePlayer();
  const [notice, setNotice] = useState("旅商人がアイテムを販売している。");

  const purchase = (itemId: ItemId) => {
    const nextPlayer = buyItem(player, itemId, ITEMS[itemId].price);
    if (!nextPlayer) return;

    savePlayer(nextPlayer);
    setNotice(`${ITEMS[itemId].name}を購入した！`);
  };

  return (
    <main style={styles.container}>
      <img src="/img/background-home.png" alt="" style={styles.background} />

      <header style={styles.header}>
        <Link href="/home" style={styles.backButton}>◀ ホーム</Link>
        <strong style={styles.title}>旅商人の店</strong>
        <div style={styles.goldContainer} aria-label={`所持ゴールド ${player.gold}`}>
          <img src="/img/gold.png" alt="" style={styles.goldIcon} />
          <span>{player.gold}</span>
        </div>
      </header>

      <section style={styles.shopPanel}>
        <div style={styles.shopHeading}>
          <span style={styles.shopEmoji} aria-hidden="true">🏪</span>
          <div>
            <h1 style={styles.heading}>アイテムショップ</h1>
            <p style={styles.lead}>冒険に役立つ道具を買おう</p>
          </div>
        </div>

        <div style={styles.itemList}>
          {Object.entries(ITEMS).map(([id, item]) => {
            const itemId = id as ItemId;
            const canBuy = player.gold >= item.price;

            return (
              <article key={itemId} style={styles.itemCard}>
                <img src={item.image} alt="" style={styles.itemImage} />
                <div style={styles.itemDetails}>
                  <div style={styles.itemNameRow}>
                    <strong>{item.name}</strong>
                    <span style={styles.owned}>所持 ×{player.inventory[itemId]}</span>
                  </div>
                  <p style={styles.description}>{item.description}</p>
                  <button
                    type="button"
                    style={{
                      ...styles.buyButton,
                      opacity: canBuy ? 1 : 0.46,
                    }}
                    disabled={!canBuy}
                    onClick={() => purchase(itemId)}
                    aria-label={`${item.name}を${item.price}ゴールドで購入`}
                  >
                    {canBuy ? `購入　${item.price}G` : "ゴールド不足"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p style={styles.notice} aria-live="polite">{notice}</p>
      </section>
    </main>
  );
}

const styles = {
  container: {
    position: "relative" as const,
    width: "100%",
    maxWidth: "420px",
    minHeight: "100vh",
    margin: "0 auto",
    overflow: "hidden",
    color: "#fff",
    backgroundColor: "#101827",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
    fontFamily: "sans-serif",
  },
  background: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    filter: "brightness(0.28) blur(2px)",
    transform: "scale(1.03)",
  },
  header: {
    position: "relative" as const,
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "8px",
    padding: "15px 14px",
    borderBottom: "1px solid rgba(255,231,160,0.35)",
    backgroundColor: "rgba(7,12,22,0.82)",
  },
  backButton: {
    justifySelf: "start",
    color: "#fff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "bold",
  },
  title: {
    color: "#ffe294",
    fontSize: "16px",
    whiteSpace: "nowrap" as const,
  },
  goldContainer: {
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 8px",
    border: "1px solid #d4af37",
    borderRadius: "999px",
    backgroundColor: "rgba(0,0,0,0.58)",
    fontSize: "12px",
    fontWeight: "bold",
  },
  goldIcon: {
    width: "20px",
    height: "20px",
    objectFit: "contain" as const,
  },
  shopPanel: {
    position: "relative" as const,
    zIndex: 1,
    padding: "22px 16px 28px",
  },
  shopHeading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "17px",
    padding: "12px 14px",
    border: "1px solid rgba(255,231,160,0.35)",
    borderRadius: "12px",
    background: "linear-gradient(135deg, rgba(127,73,31,0.88), rgba(52,31,28,0.9))",
    boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
  },
  shopEmoji: { fontSize: "38px" },
  heading: { margin: 0, color: "#fff4c2", fontSize: "20px" },
  lead: { margin: "3px 0 0", color: "#e8dcc8", fontSize: "12px" },
  itemList: { display: "grid", gap: "11px" },
  itemCard: {
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "12px",
    background: "linear-gradient(135deg, rgba(35,49,72,0.94), rgba(19,27,43,0.96))",
    boxShadow: "0 7px 18px rgba(0,0,0,0.34)",
  },
  itemImage: {
    width: "88px",
    height: "88px",
    objectFit: "contain" as const,
    filter: "drop-shadow(0 4px 7px rgba(0,0,0,0.55))",
  },
  itemDetails: { minWidth: 0 },
  itemNameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    color: "#fff3bd",
    fontSize: "15px",
  },
  owned: { color: "#cbd5e1", fontSize: "11px", whiteSpace: "nowrap" as const },
  description: { margin: "4px 0 9px", color: "#d2d8e2", fontSize: "11px" },
  buyButton: {
    width: "100%",
    minHeight: "38px",
    border: "1px solid #ffe07a",
    borderRadius: "8px",
    color: "#2b1c0a",
    background: "linear-gradient(#ffe37e, #d99b29)",
    cursor: "pointer",
    fontWeight: "bold",
  },
  notice: {
    minHeight: "20px",
    margin: "16px 0 0",
    color: "#fff1aa",
    textAlign: "center" as const,
    fontSize: "12px",
    fontWeight: "bold",
    textShadow: "0 1px 3px #000",
  },
};
