"use client";

import Link from "next/link";
import { useState } from "react";

import { calculateDamage, FLOORS, ITEMS, type ItemId } from "@/lib/game";
import { savePlayer } from "@/lib/player";
import { usePlayer } from "@/lib/use-player";

type BattlePhase =
  | "ready"
  | "player-attack"
  | "enemy-hit"
  | "player-item"
  | "enemy-attack"
  | "player-hit"
  | "victory"
  | "defeat"
  | "floor-transition";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function RpgPage() {
  const player = usePlayer();
  const [floorIndex, setFloorIndex] = useState(0);
  const enemy = FLOORS[floorIndex];
  const [heroHp, setHeroHp] = useState(player.maxHp);
  const [heroMp, setHeroMp] = useState(player.maxMp);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [inventory, setInventory] = useState({ ...player.inventory });
  const [phase, setPhase] = useState<BattlePhase>("ready");
  const [battleMessage, setBattleMessage] = useState(
    `${enemy.name}が現れた！ コマンドを選んでください`,
  );
  const [lastAction, setLastAction] = useState<"attack" | "magic" | "item">(
    "attack",
  );
  const [lastDamage, setLastDamage] = useState(0);
  const [itemMenuOpen, setItemMenuOpen] = useState(false);

  const fireUnlocked = player.unlockedSkills.includes("fire");
  const busy = phase !== "ready";

  const enemyTurn = async (blockAttack = false, currentHeroHp = heroHp) => {
    setPhase("enemy-attack");
    setBattleMessage(`${enemy.name}の攻撃！`);
    await wait(380);

    const damage = blockAttack
      ? 0
      : calculateDamage(enemy.attack, player.defense);
    const nextHp = Math.max(0, currentHeroHp - damage);
    setLastDamage(damage);
    setHeroHp(nextHp);
    setPhase("player-hit");
    setBattleMessage(
      blockAttack
        ? "守護の盾が攻撃を防いだ！"
        : `${damage}ダメージを受けた！`,
    );
    await wait(480);

    if (nextHp === 0) {
      setPhase("defeat");
      setBattleMessage("力尽きてしまった… 掃除して強くなろう！");
    } else {
      setPhase("ready");
      setBattleMessage("コマンドを選んでください");
    }
  };

  const playerAttack = async (magic = false) => {
    if (busy || enemyHp === 0) return;
    if (magic && !fireUnlocked) {
      setBattleMessage("まだ魔法を習得していない");
      return;
    }
    if (magic && heroMp < 10) {
      setBattleMessage("MPが足りない");
      return;
    }

    setItemMenuOpen(false);
    setLastAction(magic ? "magic" : "attack");
    setPhase("player-attack");
    setBattleMessage(magic ? "🔥 ファイア！" : "勇者の攻撃！");
    if (magic) setHeroMp((current) => current - 10);
    await wait(380);

    const damage = calculateDamage(
      player.attack + (magic ? 20 : 0),
      enemy.defense,
    );
    const nextHp = Math.max(0, enemyHp - damage);
    setLastDamage(damage);
    setEnemyHp(nextHp);
    setPhase("enemy-hit");
    setBattleMessage(`${enemy.name}に${damage}ダメージ！`);
    await wait(460);

    if (nextHp === 0) {
      setPhase("victory");
      setBattleMessage(`${enemy.name}を倒した！`);
    } else {
      await enemyTurn();
    }
  };

  const handleItem = async (itemId: ItemId) => {
    if (busy || inventory[itemId] === 0) return;
    if (itemId !== "shield" && heroHp === player.maxHp) {
      setBattleMessage("HPは満タンだ");
      return;
    }

    const nextInventory = {
      ...inventory,
      [itemId]: inventory[itemId] - 1,
    };
    setInventory(nextInventory);
    savePlayer({ ...player, inventory: nextInventory });
    setItemMenuOpen(false);
    setLastAction("item");
    setPhase("player-item");

    if (itemId === "shield") {
      setLastDamage(0);
      setBattleMessage("守護の盾を構えた！");
      await wait(520);
      await enemyTurn(true);
      return;
    }

    const recovery = itemId === "herb" ? 25 : 60;
    const recoveredHp = Math.min(player.maxHp, heroHp + recovery);
    setLastDamage(recoveredHp - heroHp);
    setHeroHp(recoveredHp);
    setBattleMessage(`${ITEMS[itemId].name}でHPを${recoveredHp - heroHp}回復！`);
    await wait(620);
    await enemyTurn(false, recoveredHp);
  };

  const goToNextFloor = async () => {
    const nextFloor = floorIndex + 1;
    if (nextFloor >= FLOORS.length) return;

    const highestFloor = Math.max(player.highestFloor, nextFloor + 1);
    savePlayer({ ...player, inventory, highestFloor });
    setPhase("floor-transition");
    setBattleMessage(`第${nextFloor + 1}階層へ進む…`);
    await wait(720);
    setFloorIndex(nextFloor);
    setEnemyHp(FLOORS[nextFloor].maxHp);
    setPhase("ready");
    setBattleMessage(
      `${FLOORS[nextFloor].name}が現れた！ コマンドを選んでください`,
    );
  };

  const enemyClass = [
    "battle-character",
    "enemy-character",
    floorIndex > 0 ? "flipped-character" : "",
    floorIndex === FLOORS.length - 1 ? "boss-character" : "",
    phase === "enemy-attack" ? "enemy-attacking" : "",
    phase === "enemy-hit" ? "enemy-hit" : "",
    phase === "victory" ? "enemy-defeated" : "",
  ].join(" ");
  const heroClass = [
    "battle-character",
    "hero-character",
    "flipped-character",
    phase === "player-attack" ? "hero-attacking" : "",
    phase === "player-item" ? "hero-using-item" : "",
    phase === "player-hit" ? "hero-hit" : "",
    phase === "defeat" ? "hero-defeated" : "",
  ].join(" ");

  return (
    <main
      style={styles.container}
      className={phase === "floor-transition" ? "floor-transition" : ""}
    >
      <img
        src={
          floorIndex === FLOORS.length - 1
            ? "/img/background-rpg-boss.jpg"
            : "/img/background-rpg.png"
        }
        alt={floorIndex === FLOORS.length - 1 ? "ボスの間" : "草原の背景"}
        style={styles.backgroundImage}
      />

      <header style={styles.topHud}>
        <div style={styles.floorWindow}>第 {floorIndex + 1} 階層</div>
        <div style={styles.levelBadge}>LV {player.level}</div>
      </header>

      <section style={styles.battleArea} className="battle-area">
        <div style={styles.characterWrapper}>
          <div style={styles.characterStage}>
            <img src="/img/hero.png" alt="勇者" className={heroClass} />
            {(phase === "player-hit" || phase === "player-item") && (
              <span
                className={`damage-popup ${phase === "player-item" ? "heal-popup" : ""}`}
              >
                {phase === "player-item" ? `+${lastDamage}` : lastDamage || "BLOCK"}
              </span>
            )}
          </div>
          <strong style={styles.characterName}>勇者ユウタ</strong>
          <StatusGauge
            label="HP"
            value={heroHp}
            max={player.maxHp}
            color="#4caf50"
          />
          <StatusGauge
            label="MP"
            value={heroMp}
            max={player.maxMp}
            color="#2196f3"
          />
        </div>

        <div style={styles.characterWrapper}>
          <div style={styles.characterStage}>
            <img src={enemy.image} alt={enemy.name} className={enemyClass} />
            {phase === "enemy-hit" && (
              <span className="damage-popup enemy-damage">-{lastDamage}</span>
            )}
            {phase === "player-attack" && lastAction === "magic" && (
              <span className="fire-effect" aria-hidden="true">🔥</span>
            )}
          </div>
          <strong style={styles.characterName}>{enemy.name}</strong>
          <StatusGauge
            label="HP"
            value={enemyHp}
            max={enemy.maxHp}
            color="#ef5350"
          />
        </div>
      </section>

      {phase === "player-hit" && <div className="battle-flash" />}

      <section style={styles.bottomUi}>
        <div style={styles.battleMessage} aria-live="polite">
          {battleMessage}
        </div>

        {phase === "victory" ? (
          <div style={styles.resultWindow}>
            {floorIndex < FLOORS.length - 1 ? (
              <button style={styles.primaryButton} onClick={goToNextFloor}>
                次の階層へ
              </button>
            ) : (
              <Link href="/home" style={styles.primaryLink}>
                ダンジョンクリア！
              </Link>
            )}
          </div>
        ) : phase === "defeat" ? (
          <div style={styles.resultWindow}>
            <Link href="/clean" style={styles.primaryLink}>
              🧹 掃除して強くなる
            </Link>
            <Link href="/home" style={styles.secondaryLink}>ホームへ戻る</Link>
          </div>
        ) : itemMenuOpen ? (
          <div style={styles.itemWindow}>
            {Object.entries(ITEMS).map(([id, item]) => {
              const itemId = id as ItemId;
              return (
                <button
                  key={itemId}
                  style={{
                    ...styles.itemButton,
                    opacity: inventory[itemId] > 0 ? 1 : 0.42,
                  }}
                  disabled={busy || inventory[itemId] === 0}
                  onClick={() => handleItem(itemId)}
                >
                  <img src={item.image} alt="" style={styles.itemIcon} />
                  <span>{item.name}</span>
                  <strong>×{inventory[itemId]}</strong>
                </button>
              );
            })}
            <button
              style={styles.backButton}
              onClick={() => setItemMenuOpen(false)}
            >
              戻る
            </button>
          </div>
        ) : (
          <div style={styles.commandWindow}>
            <button
              style={styles.commandButton}
              disabled={busy}
              onClick={() => playerAttack(false)}
            >
              ⚔️ 攻撃
            </button>
            <button
              style={{
                ...styles.commandButton,
                opacity: fireUnlocked ? 1 : 0.42,
              }}
              disabled={busy}
              onClick={() => playerAttack(true)}
            >
              {fireUnlocked ? "🔥 ファイア" : "🔒 魔法"}
            </button>
            <button
              style={styles.commandButton}
              disabled={busy}
              onClick={() => setItemMenuOpen(true)}
            >
              🎒 アイテム
            </button>
            <Link href="/home" style={styles.commandLink}>逃げる</Link>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusGauge({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
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
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    maxWidth: "420px",
    height: "100vh",
    margin: "0 auto",
    overflow: "hidden",
    color: "#fff",
    backgroundColor: "#000",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  backgroundImage: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    zIndex: 0,
  },
  topHud: {
    position: "relative" as const,
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    paddingTop: "20px",
  },
  floorWindow: {
    padding: "7px 22px",
    border: "3px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.94)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  levelBadge: {
    padding: "6px 9px",
    border: "2px solid #ffe066",
    borderRadius: "6px",
    color: "#ffe066",
    backgroundColor: "rgba(0,0,0,0.72)",
    fontWeight: "bold",
  },
  battleArea: {
    position: "relative" as const,
    zIndex: 10,
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "10px",
    padding: "8px 16px 18px",
  },
  characterWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    width: "48%",
    alignItems: "center",
  },
  characterStage: {
    position: "relative" as const,
    display: "grid",
    width: "100%",
    height: "205px",
    placeItems: "end center",
  },
  characterName: {
    margin: "5px 0 6px",
    fontSize: "13px",
    textShadow: "0 2px 3px #000",
  },
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
  bottomUi: {
    position: "relative" as const,
    zIndex: 10,
    padding: "0 14px 24px",
  },
  battleMessage: {
    minHeight: "37px",
    display: "grid",
    placeItems: "center",
    marginBottom: "7px",
    padding: "6px 10px",
    border: "2px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.94)",
    textAlign: "center" as const,
    fontSize: "13px",
    fontWeight: "bold",
  },
  commandWindow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 8px",
    padding: "14px 12px",
    border: "4px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.96)",
    boxShadow: "inset 0 0 0 2px #000",
  },
  commandButton: {
    minHeight: "34px",
    border: "none",
    color: "#fff",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    textShadow: "1px 1px 2px #000",
  },
  commandLink: {
    display: "grid",
    minHeight: "34px",
    placeItems: "center",
    color: "#fff",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "bold",
  },
  itemWindow: {
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
  backButton: {
    minHeight: "38px",
    border: "1px solid #fff",
    borderRadius: "5px",
    color: "#fff",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontWeight: "bold",
  },
  resultWindow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "9px",
    padding: "14px",
    border: "4px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.96)",
  },
  primaryButton: {
    padding: "13px",
    border: "none",
    borderRadius: "7px",
    color: "#18100b",
    backgroundColor: "#ffe066",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 900,
  },
  primaryLink: {
    padding: "13px",
    borderRadius: "7px",
    color: "#18100b",
    backgroundColor: "#ffe066",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "17px",
    fontWeight: 900,
  },
  secondaryLink: {
    color: "#fff",
    textAlign: "center" as const,
    textDecoration: "underline",
    fontSize: "13px",
  },
};
