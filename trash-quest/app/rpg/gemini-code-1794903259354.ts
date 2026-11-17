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

export type PartyMember = {
  id: string;
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  unlockedSkills: SkillId[];
  attackBoosted: boolean;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function RpgPage() {
  const player = usePlayer();
  const [floorIndex, setFloorIndex] = useState(0);
  const enemy = FLOORS[floorIndex];

  const [party, setParty] = useState<PartyMember[]>(() => [
    {
      id: "hero-a",
      name: "勇者A",
      image: "/img/hero.png",
      hp: player.maxHp,
      maxHp: player.maxHp,
      mp: player.maxMp,
      maxMp: player.maxMp,
      attack: player.attack,
      defense: player.defense,
      unlockedSkills: [...player.unlockedSkills] as SkillId[],
      attackBoosted: false,
    },
    {
      id: "hero-b",
      name: "勇者B",
      image: "/img/hero.png",
      hp: player.maxHp,
      maxHp: player.maxHp,
      mp: player.maxMp,
      maxMp: player.maxMp,
      attack: player.attack,
      defense: player.defense,
      unlockedSkills: [...player.unlockedSkills] as SkillId[],
      attackBoosted: false,
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);

  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [inventory, setInventory] = useState({ ...player.inventory });
  const [phase, setPhase] = useState<BattlePhase>("ready");
  const [battleMessage, setBattleMessage] = useState(
    `${enemy.name}が現れた！ ${party[0].name}のターン：コマンドを選んでください`,
  );
  const [lastAction, setLastAction] = useState<"attack" | "magic" | "item">(
    "attack",
  );
  const [lastDamage, setLastDamage] = useState(0);
  const [itemMenuOpen, setItemMenuOpen] = useState(false);
  const [magicMenuOpen, setMagicMenuOpen] = useState(false);
  const [effectIcon, setEffectIcon] = useState("🔥");
  const [enemyStatus, setEnemyStatus] = useState<StatusEffects>(emptyStatuses);

  const activeMember = party[activeIndex] ?? party[0];
  const learnedSkills = SKILL_IDS.filter((id) =>
    activeMember.unlockedSkills.includes(id),
  );
  const ownedItemIds = ITEM_IDS.filter((id) => inventory[id] > 0);
  const currentAttack = heroAttackPower(
    activeMember.attack,
    activeMember.attackBoosted,
  );
  const busy = phase !== "ready";

  const advanceTurn = async ({
    updatedParty,
    currentEnemyHp,
    statuses,
    blockAttack = false,
  }: {
    updatedParty: PartyMember[];
    currentEnemyHp: number;
    statuses: StatusEffects;
    blockAttack?: boolean;
  }) => {
    if (!blockAttack) {
      const nextAliveIndex = updatedParty.findIndex(
        (member, idx) => idx > activeIndex && member.hp > 0,
      );
      if (nextAliveIndex !== -1) {
        setActiveIndex(nextAliveIndex);
        setPhase("ready");
        setBattleMessage(
          `${updatedParty[nextAliveIndex].name}のターン：コマンドを選んでください`,
        );
        return;
      }
    }

    await enemyTurn({
      currentParty: updatedParty,
      currentEnemyHp,
      statuses,
      blockAttack,
    });
  };

  const enemyTurn = async ({
    currentParty,
    currentEnemyHp,
    statuses,
    blockAttack = false,
  }: {
    currentParty: PartyMember[];
    currentEnemyHp: number;
    statuses: StatusEffects;
    blockAttack?: boolean;
  }) => {
    let nextParty = [...currentParty];

    if (!canAct(statuses)) {
      setPhase("enemy-idle");
      setBattleMessage(
        `${STATUSES.sleep.icon} ${enemy.name}は眠っていて動けない！`,
      );
      await wait(700);
    } else {
      const aliveIndices = nextParty
        .map((m, idx) => (m.hp > 0 ? idx : -1))
        .filter((idx) => idx !== -1);
      const pickedIndex =
        aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
      const targetMember = nextParty[pickedIndex];

      setTargetIndex(pickedIndex);
      setPhase("enemy-attack");
      setBattleMessage(`${enemy.name}の攻撃！`);
      await wait(380);

      const damage = blockAttack
        ? 0
        : calculateDamage(
            statusAdjustedAttack(enemy.attack, statuses),
            targetMember.defense,
          );
      const nextHp = hpAfterDamage(targetMember.hp, damage);

      nextParty = nextParty.map((m, idx) =>
        idx === pickedIndex ? { ...m, hp: nextHp } : m,
      );

      setLastDamage(damage);
      setParty(nextParty);
      setPhase("player-hit");
      setBattleMessage(
        blockAttack
          ? "守護の盾が攻撃を防いだ！"
          : `${targetMember.name}に${damage}ダメージ！`,
      );
      await wait(480);

      if (nextParty.every((m) => m.hp === 0)) {
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
      setBattleMessage(
        `${STATUSES.poison.icon} 毒で${enemy.name}に${damage}ダメージ！`,
      );
      await wait(560);

      if (nextEnemyHp === 0) {
        setPhase("victory");
        setBattleMessage(`${enemy.name}を倒した！`);
        return;
      }
    }

    const { next, cured } = tickStatuses(statuses);
    setEnemyStatus(next);

    const firstAliveIndex = nextParty.findIndex((m) => m.hp > 0);
    setActiveIndex(firstAliveIndex);
    setPhase("ready");
    setBattleMessage(
      cured.length > 0
        ? `${enemy.name}の${cured.map((id) => STATUSES[id].name).join("・")}が治った！`
        : `${nextParty[firstAliveIndex].name}のターン：コマンドを選んでください`,
    );
  };

  const inflictStatus = async (
    status: StatusId,
    label: string,
    updatedParty: PartyMember[],
  ) => {
    const nextStatuses = applyStatus(enemyStatus, status);
    setEnemyStatus(nextStatuses);
    setLastAction("item");
    setPhase("player-cast");
    setBattleMessage(
      `${label} ${enemy.name}は${STATUSES[status].name}になった！`,
    );
    await wait(600);
    await advanceTurn({
      updatedParty,
      currentEnemyHp: enemyHp,
      statuses: nextStatuses,
    });
  };

  const castBuff = async (skillId: SkillId) => {
    const skill = SKILLS[skillId];
    if (activeMember.mp < skill.mpCost) {
      setBattleMessage("MPが足りない");
      return;
    }
    if (activeMember.attackBoosted) {
      setBattleMessage("すでに攻撃力が上がっている");
      return;
    }

    const updatedParty = party.map((m, idx) =>
      idx === activeIndex
        ? { ...m, mp: m.mp - skill.mpCost, attackBoosted: true }
        : m,
    );

    setMagicMenuOpen(false);
    setItemMenuOpen(false);
    setLastAction("item");
    setPhase("player-cast");
    setParty(updatedParty);
    setBattleMessage(
      `${skill.icon} ${activeMember.name}の${skill.name}！ 攻撃力が1.1倍になった！`,
    );
    await wait(520);
    await advanceTurn({
      updatedParty,
      currentEnemyHp: enemyHp,
      statuses: enemyStatus,
    });
  };

  const castStatusSpell = async (skillId: SkillId) => {
    const skill = SKILLS[skillId];
    if (!skill.status) return;
    if (activeMember.mp < skill.mpCost) {
      setBattleMessage("MPが足りない");
      return;
    }

    const updatedParty = party.map((m, idx) =>
      idx === activeIndex ? { ...m, mp: m.mp - skill.mpCost } : m,
    );

    setMagicMenuOpen(false);
    setItemMenuOpen(false);
    setParty(updatedParty);
    await inflictStatus(
      skill.status,
      `${skill.icon} ${activeMember.name}の${skill.name}！`,
      updatedParty,
    );
  };

  const playerAttack = async (skillId: SkillId | null = null) => {
    if (busy || enemyHp === 0) return;
    const skill = skillId ? SKILLS[skillId] : null;
    if (skillId && skill) {
      if (!activeMember.unlockedSkills.includes(skillId)) {
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
      if (activeMember.mp < skill.mpCost) {
        setBattleMessage("MPが足りない");
        return;
      }
    }
    const magic = skill !== null;

    const updatedParty = skill
      ? party.map((m, idx) =>
          idx === activeIndex ? { ...m, mp: m.mp - skill.mpCost } : m,
        )
      : party;

    setItemMenuOpen(false);
    setMagicMenuOpen(false);
    setLastAction(magic ? "magic" : "attack");
    if (skill) setEffectIcon(skill.icon);
    setPhase("player-attack");
    setBattleMessage(
      skill
        ? `${skill.icon} ${activeMember.name}の${skill.name}！`
        : `${activeMember.name}の攻撃！`,
    );
    if (skill) setParty(updatedParty);
    await wait(380);

    const damage = magic
      ? magicDamage(currentAttack, enemy.defense)
      : physicalDamage(currentAttack, enemy.defense);
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
      await advanceTurn({
        updatedParty,
        currentEnemyHp: nextHp,
        statuses: enemyStatus,
      });
    }
  };

  const handleItem = async (itemId: ItemId) => {
    if (busy || inventory[itemId] === 0 || enemyHp === 0) return;
    const item = ITEMS[itemId];
    const effect = item.effect;
    if (effect.type === "heal" && activeMember.hp === activeMember.maxHp) {
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
        effect.element === "random" ? pickElement() : effect.element;
      const { name: elementName, icon } = ELEMENTS[element];
      setLastAction("magic");
      setEffectIcon(icon);
      setPhase("player-attack");
      setBattleMessage(
        `${icon} ${activeMember.name}は${item.name}を使った！ ${elementName}属性！`,
      );
      await wait(380);

      const damage = magicDamage(
        currentAttack,
        enemy.defense,
        effect.multiplier,
      );
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
        await advanceTurn({
          updatedParty: party,
          currentEnemyHp: nextHp,
          statuses: enemyStatus,
        });
      }
      return;
    }

    if (effect.type === "status") {
      await inflictStatus(
        effect.status,
        `${activeMember.name}は${item.name}を使った！`,
        party,
      );
      return;
    }

    setLastAction("item");
    setTargetIndex(activeIndex);
    setPhase("player-item");

    if (effect.type === "guard") {
      setLastDamage(0);
      setBattleMessage(`${activeMember.name}は守護の盾を構えた！`);
      await wait(520);
      await enemyTurn({
        currentParty: party,
        currentEnemyHp: enemyHp,
        statuses: enemyStatus,
        blockAttack: true,
      });
      return;
    }

    const healed = healedAmount(
      activeMember.hp,
      activeMember.maxHp,
      effect.amount,
    );
    const recoveredHp = activeMember.hp + healed;
    const updatedParty = party.map((m, idx) =>
      idx === activeIndex ? { ...m, hp: recoveredHp } : m,
    );

    setLastDamage(healed);
    setParty(updatedParty);
    setBattleMessage(`${ITEMS[itemId].name}でHPを${healed}回復！`);
    await wait(620);
    await advanceTurn({
      updatedParty,
      currentEnemyHp: enemyHp,
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

    const firstAliveIndex = party.findIndex((m) => m.hp > 0);
    setActiveIndex(firstAliveIndex);
    setPhase("ready");
    setBattleMessage(
      `${FLOORS[nextFloor].name}が現れた！ ${party[firstAliveIndex].name}のターン：コマンドを選んでください`,
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

  const getMemberClass = (index: number, hp: number) => {
    const isActing = activeIndex === index;
    const isTargeted = targetIndex === index;
    return [
      "battle-character",
      "hero-character",
      "flipped-character",
      isActing && phase === "player-attack" ? "hero-attacking" : "",
      isActing && (phase === "player-item" || phase === "player-cast")
        ? "hero-using-item"
        : "",
      isTargeted && phase === "player-hit" ? "hero-hit" : "",
      hp === 0 || phase === "defeat" ? "hero-defeated" : "",
    ].join(" ");
  };

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
        <div style={styles.partyColumn}>
          {party.map((member, index) => {
            const isActiveTurn = phase === "ready" && activeIndex === index;
            return (
              <div
                key={member.id}
                style={{
                  ...styles.memberCard,
                  ...(isActiveTurn ? styles.activeMemberCard : {}),
                  opacity: member.hp === 0 ? 0.5 : 1,
                }}
              >
                <div style={styles.memberSpriteBox}>
                  <img
                    src={member.image}
                    alt={member.name}
                    className={getMemberClass(index, member.hp)}
                    style={styles.memberSprite}
                  />
                  {targetIndex === index &&
                    (phase === "player-hit" || phase === "player-item") && (
                      <span
                        className={`damage-popup ${phase === "player-item" ? "heal-popup" : ""}`}
                      >
                        {phase === "player-item"
                          ? `+${lastDamage}`
                          : lastDamage || "BLOCK"}
                      </span>
                    )}
                </div>

                <div style={styles.memberInfo}>
                  <div style={styles.memberHeader}>
                    <strong style={styles.memberName}>
                      {isActiveTurn ? "▶ " : ""}
                      {member.name}
                    </strong>
                  </div>
                  <StatusGauge
                    label="HP"
                    value={member.hp}
                    max={member.maxHp}
                    color="#4caf50"
                  />
                  <StatusGauge
                    label="MP"
                    value={member.mp}
                    max={member.maxMp}
                    color="#2196f3"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.characterWrapper}>
          <div style={styles.characterStage}>
            <img
              src={enemy.image}
              alt={enemy.name}
              className={enemyClass}
              style={
                enemyStatus.sleep > 0 ? { filter: "brightness(0.6)" } : undefined
              }
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
              掃除して強くなろう
            </Link>
            <Link href="/home" style={styles.secondaryLink}>
              ホームへ戻る
            </Link>
          </div>
        ) : magicMenuOpen ? (
          <MagicMenu
            skillIds={learnedSkills}
            mp={activeMember.mp}
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
          <div>
            <div style={styles.turnIndicator}>
              {activeMember.name} のターン
            </div>
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
              <Link href="/home" style={styles.commandLink}>
                逃げる
              </Link>
            </div>
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
    paddingTop: "16px",
  },
  floorWindow: {
    padding: "6px 20px",
    border: "3px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.94)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    fontSize: "18px",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  levelBadge: {
    padding: "5px 9px",
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
    gap: "8px",
    padding: "8px 12px 14px",
  },
  partyColumn: {
    display: "flex",
    flexDirection: "column" as const,
    width: "52%",
    gap: "6px",
    maxHeight: "100%",
    justifyContent: "flex-end",
  },
  memberCard: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 7px",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: "6px",
    backgroundColor: "rgba(15, 18, 55, 0.72)",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  },
  activeMemberCard: {
    transform: "translateX(8px)",
    border: "2px solid #ffe066",
    boxShadow: "0 0 10px rgba(255, 224, 102, 0.75)",
    backgroundColor: "rgba(30, 36, 95, 0.9)",
  },
  memberSpriteBox: {
    position: "relative" as const,
    width: "54px",
    height: "58px",
    display: "grid",
    placeItems: "end center",
    flexShrink: 0,
  },
  memberSprite: {
    maxWidth: "54px",
    maxHeight: "58px",
    objectFit: "contain" as const,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberHeader: {
    marginBottom: "2px",
  },
  memberName: {
    fontSize: "12px",
    textShadow: "0 1px 2px #000",
  },
  characterWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    width: "44%",
    alignItems: "center",
  },
  characterStage: {
    position: "relative" as const,
    display: "grid",
    width: "100%",
    height: "190px",
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
    padding: "0 14px 20px",
  },
  battleMessage: {
    minHeight: "36px",
    display: "grid",
    placeItems: "center",
    marginBottom: "6px",
    padding: "5px 10px",
    border: "2px solid #fff",
    borderRadius: "5px",
    backgroundColor: "rgba(20,20,70,0.94)",
    textAlign: "center" as const,
    fontSize: "12px",
    fontWeight: "bold",
  },
  turnIndicator: {
    display: "inline-block",
    marginBottom: "4px",
    padding: "2px 10px",
    border: "2px solid #ffe066",
    borderRadius: "4px",
    backgroundColor: "rgba(20,20,70,0.96)",
    color: "#ffe066",
    fontSize: "12px",
    fontWeight: "bold",
  },
  commandWindow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 8px",
    padding: "12px",
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