"use client";

import Link from "next/link";
import { useState } from "react";

import {
  applyStatus,
  canAct,
  emptyStatuses,
  healedAmount,
  heroAttackPower,
  hpAfterDamage,
  magicDamage,
  physicalDamage,
  poisonDamage,
  statusAdjustedAttack,
  tickStatuses,
  type StatusEffects,
} from "@/lib/battle";
import {
  calculateDamage,
  ELEMENTS,
  FLOORS,
  ITEM_IDS,
  ITEMS,
  pickElement,
  SKILLS,
  SKILL_IDS,
  STATUSES,
  STATUS_IDS,
  type ItemId,
  type SkillId,
  type StatusId,
} from "@/lib/game";
import { savePlayer } from "@/lib/player";
import { usePlayer } from "@/lib/use-player";
import ItemMenu from "./ItemMenu";
import MagicMenu from "./MagicMenu";
import StatusGauge from "./StatusGauge";

type BattlePhase =
  | "ready"
  | "player-attack"
  | "enemy-hit"
  | "player-item"
  | "player-cast"
  | "enemy-idle"
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
  const [magicMenuOpen, setMagicMenuOpen] = useState(false);
  const [effectIcon, setEffectIcon] = useState("🔥");
  const [attackBoosted, setAttackBoosted] = useState(false);
  const [enemyStatus, setEnemyStatus] = useState<StatusEffects>(emptyStatuses);

  const learnedSkills = SKILL_IDS.filter((id) =>
    player.unlockedSkills.includes(id),
  );
  const ownedItemIds = ITEM_IDS.filter((id) => inventory[id] > 0);
  const heroAttack = heroAttackPower(player.attack, attackBoosted);
  const busy = phase !== "ready";

  // 敵の番。眠りなら行動せず、ターンの最後に毒ダメージと状態異常のターン経過を処理する
  const enemyTurn = async ({
    heroHp: currentHeroHp,
    enemyHp: currentEnemyHp,
    statuses,
    blockAttack = false,
  }: {
    heroHp: number;
    enemyHp: number;
    statuses: StatusEffects;
    blockAttack?: boolean;
  }) => {
    if (!canAct(statuses)) {
      setPhase("enemy-idle");
      setBattleMessage(`${STATUSES.sleep.icon} ${enemy.name}は眠っていて動けない！`);
      await wait(700);
    } else {
      setPhase("enemy-attack");
      setBattleMessage(`${enemy.name}の攻撃！`);
      await wait(380);

      const damage = blockAttack
        ? 0
        : calculateDamage(
            statusAdjustedAttack(enemy.attack, statuses),
            player.defense,
          );
      const nextHeroHp = hpAfterDamage(currentHeroHp, damage);
      setLastDamage(damage);
      setHeroHp(nextHeroHp);
      setPhase("player-hit");
      setBattleMessage(
        blockAttack
          ? "守護の盾が攻撃を防いだ！"
          : `${damage}ダメージを受けた！`,
      );
      await wait(480);

      if (nextHeroHp === 0) {
        setPhase("defeat");
        setBattleMessage("力尽きてしまった… 掃除して強くなろう！");
        return;
      }
    }

    if (statuses.poison > 0) {
      const damage = poisonDamage(enemy.maxHp);
      const nextEnemyHp = hpAfterDamage(currentEnemyHp, damage);
      setLastDamage(damage);
      setEnemyHp(nextEnemyHp);
      setPhase("enemy-hit");
      setBattleMessage(`${STATUSES.poison.icon} 毒で${enemy.name}に${damage}ダメージ！`);
      await wait(560);

      if (nextEnemyHp === 0) {
        setPhase("victory");
        setBattleMessage(`${enemy.name}を倒した！`);
        return;
      }
    }

    const { next, cured } = tickStatuses(statuses);
    setEnemyStatus(next);
    setPhase("ready");
    setBattleMessage(
      cured.length > 0
        ? `${enemy.name}の${cured.map((id) => STATUSES[id].name).join("・")}が治った！`
        : "コマンドを選んでください",
    );
  };

  // 敵に状態異常を付ける(魔法・アイテム共通)
  const inflictStatus = async (status: StatusId, label: string) => {
    const nextStatuses = applyStatus(enemyStatus, status);
    setEnemyStatus(nextStatuses);
    setLastAction("item");
    setPhase("player-cast");
    setBattleMessage(
      `${label} ${enemy.name}は${STATUSES[status].name}になった！`,
    );
    await wait(600);
    await enemyTurn({ heroHp, enemyHp, statuses: nextStatuses });
  };

  const castBuff = async (skillId: SkillId) => {
    const skill = SKILLS[skillId];
    if (heroMp < skill.mpCost) {
      setBattleMessage("MPが足りない");
      return;
    }
    if (attackBoosted) {
      setBattleMessage("すでに攻撃力が上がっている");
      return;
    }

    setMagicMenuOpen(false);
    setItemMenuOpen(false);
    setLastAction("item");
    setPhase("player-cast");
    setHeroMp((current) => current - skill.mpCost);
    setAttackBoosted(true);
    setBattleMessage(`${skill.icon} ${skill.name}！ 攻撃力が1.1倍になった！`);
    await wait(520);
    await enemyTurn({ heroHp, enemyHp, statuses: enemyStatus });
  };

  const castStatusSpell = async (skillId: SkillId) => {
    const skill = SKILLS[skillId];
    if (!skill.status) return;
    if (heroMp < skill.mpCost) {
      setBattleMessage("MPが足りない");
      return;
    }

    setMagicMenuOpen(false);
    setItemMenuOpen(false);
    setHeroMp((current) => current - skill.mpCost);
    await inflictStatus(skill.status, `${skill.icon} ${skill.name}！`);
  };

  const playerAttack = async (skillId: SkillId | null = null) => {
    if (busy || enemyHp === 0) return;
    const skill = skillId ? SKILLS[skillId] : null;
    if (skillId && skill) {
      if (!player.unlockedSkills.includes(skillId)) {
        setBattleMessage("まだ魔法を習得していない");
        return;
      }
      if (skill.kind === "buff") {
        await castBuff(skillId);
        return;
      }
      if (skill.kind === "status") {
        await castStatusSpell(skillId);
        return;
      }
      if (heroMp < skill.mpCost) {
        setBattleMessage("MPが足りない");
        return;
      }
    }
    const magic = skill !== null;

    setItemMenuOpen(false);
    setMagicMenuOpen(false);
    setLastAction(magic ? "magic" : "attack");
    if (skill) setEffectIcon(skill.icon);
    setPhase("player-attack");
    setBattleMessage(skill ? `${skill.icon} ${skill.name}！` : "勇者の攻撃！");
    if (skill) setHeroMp((current) => current - skill.mpCost);
    await wait(380);

    const damage = magic
      ? magicDamage(heroAttack, enemy.defense)
      : physicalDamage(heroAttack, enemy.defense);
    const nextHp = hpAfterDamage(enemyHp, damage);
    setLastDamage(damage);
    setEnemyHp(nextHp);
    setPhase("enemy-hit");
    setBattleMessage(`${enemy.name}に${damage}ダメージ！`);
    await wait(460);

    if (nextHp === 0) {
      setPhase("victory");
      setBattleMessage(`${enemy.name}を倒した！`);
    } else {
      await enemyTurn({ heroHp, enemyHp: nextHp, statuses: enemyStatus });
    }
  };

  const handleItem = async (itemId: ItemId) => {
    if (busy || inventory[itemId] === 0 || enemyHp === 0) return;
    const item = ITEMS[itemId];
    const effect = item.effect;
    if (effect.type === "heal" && heroHp === player.maxHp) {
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

    if (effect.type === "damage") {
      const element =
        effect.element === "random"
          ? pickElement()
          : effect.element;
      const { name: elementName, icon } = ELEMENTS[element];
      setLastAction("magic");
      setEffectIcon(icon);
      setPhase("player-attack");
      setBattleMessage(`${icon} ${item.name}を使った！ ${elementName}属性！`);
      await wait(380);

      const damage = magicDamage(heroAttack, enemy.defense, effect.multiplier);
      const nextHp = hpAfterDamage(enemyHp, damage);
      setLastDamage(damage);
      setEnemyHp(nextHp);
      setPhase("enemy-hit");
      setBattleMessage(`${enemy.name}に${damage}ダメージ！`);
      await wait(460);

      if (nextHp === 0) {
        setPhase("victory");
        setBattleMessage(`${enemy.name}を倒した！`);
      } else {
        await enemyTurn({ heroHp, enemyHp: nextHp, statuses: enemyStatus });
      }
      return;
    }

    if (effect.type === "status") {
      await inflictStatus(effect.status, `${item.name}を使った！`);
      return;
    }

    setLastAction("item");
    setPhase("player-item");

    if (effect.type === "guard") {
      setLastDamage(0);
      setBattleMessage("守護の盾を構えた！");
      await wait(520);
      await enemyTurn({
        heroHp,
        enemyHp,
        statuses: enemyStatus,
        blockAttack: true,
      });
      return;
    }

    const healed = healedAmount(heroHp, player.maxHp, effect.amount);
    const recoveredHp = heroHp + healed;
    setLastDamage(healed);
    setHeroHp(recoveredHp);
    setBattleMessage(`${ITEMS[itemId].name}でHPを${healed}回復！`);
    await wait(620);
    await enemyTurn({
      heroHp: recoveredHp,
      enemyHp,
      statuses: enemyStatus,
    });
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
    setEnemyStatus(emptyStatuses());
    setPhase("ready");
    setBattleMessage(
      `${FLOORS[nextFloor].name}が現れた！ コマンドを選んでください`,
    );
  };

  const enemyClass = [
    "battle-character",
    "enemy-character",
    floorIndex > 0 ? "flipped-character" : "",
    phase === "enemy-attack" ? "enemy-attacking" : "",
    phase === "enemy-hit" ? "enemy-hit" : "",
    phase === "victory" ? "enemy-defeated" : "",
  ].join(" ");
  const heroClass = [
    "battle-character",
    "hero-character",
    "flipped-character",
    phase === "player-attack" ? "hero-attacking" : "",
    phase === "player-item" || phase === "player-cast" ? "hero-using-item" : "",
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
            <img
              src={enemy.image}
              alt={enemy.name}
              className={enemyClass}
              style={enemyStatus.sleep > 0 ? { filter: "brightness(0.6)" } : undefined}
            />
            {phase === "enemy-hit" && (
              <span className="damage-popup enemy-damage">-{lastDamage}</span>
            )}
            {phase === "player-attack" && lastAction === "magic" && (
              <span className="fire-effect" aria-hidden="true">
                {effectIcon}
              </span>
            )}
          </div>
          <strong style={styles.characterName}>{enemy.name}</strong>
          <StatusGauge
            label="HP"
            value={enemyHp}
            max={enemy.maxHp}
            color="#ef5350"
          />
          <div style={styles.statusRow}>
            {STATUS_IDS.filter((id) => enemyStatus[id] > 0).map((id) => (
              <span key={id} style={styles.statusBadge}>
                {STATUSES[id].icon}
                {enemyStatus[id]}
              </span>
            ))}
          </div>
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
              <img src="/img/broom.png" alt="" style={styles.broomIcon} />
              掃除して強くなる
            </Link>
            <Link href="/home" style={styles.secondaryLink}>ホームへ戻る</Link>
          </div>
        ) : magicMenuOpen ? (
          <MagicMenu
            skillIds={learnedSkills}
            mp={heroMp}
            busy={busy}
            onCast={playerAttack}
            onBack={() => setMagicMenuOpen(false)}
          />
        ) : itemMenuOpen ? (
          <ItemMenu
            itemIds={ownedItemIds}
            inventory={inventory}
            busy={busy}
            onUse={handleItem}
            onBack={() => setItemMenuOpen(false)}
          />
        ) : (
          <div style={styles.commandWindow}>
            <button
              style={styles.commandButton}
              disabled={busy}
              onClick={() => playerAttack()}
            >
              ⚔️ 攻撃
            </button>
            <button
              style={{
                ...styles.commandButton,
                opacity: learnedSkills.length > 0 ? 1 : 0.42,
              }}
              disabled={busy}
              onClick={() => {
                if (learnedSkills.length === 0) {
                  setBattleMessage("まだ魔法を習得していない");
                  return;
                }
                setMagicMenuOpen(true);
              }}
            >
              {learnedSkills.length > 0 ? "✨ 魔法" : "🔒 魔法"}
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
  statusRow: {
    display: "flex",
    gap: "5px",
    minHeight: "20px",
    marginTop: "2px",
  },
  statusBadge: {
    padding: "1px 6px",
    border: "1px solid #fff",
    borderRadius: "10px",
    backgroundColor: "rgba(0,0,0,0.65)",
    fontSize: "11px",
    fontWeight: "bold",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "13px",
    borderRadius: "7px",
    color: "#18100b",
    backgroundColor: "#ffe066",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "17px",
    fontWeight: 900,
  },
  broomIcon: { width: "25px", height: "25px", objectFit: "contain" as const },
  secondaryLink: {
    color: "#fff",
    textAlign: "center" as const,
    textDecoration: "underline",
    fontSize: "13px",
  },
};
