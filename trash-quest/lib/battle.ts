// 戦闘のルール(計算だけ)を置くファイル。画面(React)には依存しない。
import {
  calculateDamage,
  MAGIC_POWER,
  MUKIKI_MULTIPLIER,
  POISON_RATIO,
  STATUS_IDS,
  STATUSES,
  WEAKEN_MULTIPLIER,
  type StatusId,
} from "./game.ts";

// ムキキがかかっていれば攻撃力を1.1倍にする
export function heroAttackPower(attack: number, boosted: boolean): number {
  return boosted ? Math.floor(attack * MUKIKI_MULTIPLIER) : attack;
}

// 通常攻撃のダメージ
export function physicalDamage(attackPower: number, defense: number): number {
  return calculateDamage(attackPower, defense);
}

// 魔法・属性アイテムのダメージ。multiplier は瓶などの威力倍率(魔法は1)
export function magicDamage(
  attackPower: number,
  defense: number,
  multiplier = 1,
): number {
  return calculateDamage(
    Math.floor((attackPower + MAGIC_POWER) * multiplier),
    defense,
  );
}

// ダメージを受けた後のHP(0未満にはならない)
export function hpAfterDamage(hp: number, damage: number): number {
  return Math.max(0, hp - damage);
}

// 回復で実際に増えるHP(最大HPを超えない)
export function healedAmount(hp: number, maxHp: number, recovery: number): number {
  return Math.min(maxHp, hp + recovery) - hp;
}

// ---- 状態異常 ----
// 種類ごとの「残りターン数」。0ならかかっていない。
export type StatusEffects = Record<StatusId, number>;

export function emptyStatuses(): StatusEffects {
  return { poison: 0, sleep: 0, weaken: 0 };
}

// 状態異常を付ける(すでにかかっていれば、ターン数を長い方に更新)
export function applyStatus(
  effects: StatusEffects,
  status: StatusId,
  turns = STATUSES[status].turns,
): StatusEffects {
  return { ...effects, [status]: Math.max(effects[status], turns) };
}

// ターン終了時に残りターンを1減らす。治った状態異常も返す
export function tickStatuses(effects: StatusEffects): {
  next: StatusEffects;
  cured: StatusId[];
} {
  const next = emptyStatuses();
  const cured: StatusId[] = [];
  for (const id of STATUS_IDS) {
    if (effects[id] <= 0) continue;
    next[id] = effects[id] - 1;
    if (next[id] === 0) cured.push(id);
  }
  return { next, cured };
}

// 眠っていると行動できない
export function canAct(effects: StatusEffects): boolean {
  return effects.sleep === 0;
}

// 毒のダメージ(最大HPの割合、最低1)
export function poisonDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp * POISON_RATIO));
}

// 攻撃ダウン中は攻撃力が下がる
export function statusAdjustedAttack(attack: number, effects: StatusEffects): number {
  return effects.weaken > 0 ? Math.floor(attack * WEAKEN_MULTIPLIER) : attack;
}
