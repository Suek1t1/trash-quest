// 状態異常の定義。新しい状態異常はここに足す
export type StatusId = "poison" | "sleep" | "weaken";

export type StatusDefinition = {
  name: string;
  icon: string;
  turns: number; // かかる基本ターン数
};

export const STATUSES: Record<StatusId, StatusDefinition> = {
  poison: { name: "毒", icon: "☠️", turns: 3 },
  sleep: { name: "眠り", icon: "💤", turns: 2 },
  weaken: { name: "攻撃ダウン", icon: "⬇️", turns: 3 },
};

export const STATUS_IDS = Object.keys(STATUSES) as StatusId[];

// 毒は毎ターン、最大HPのこの割合のダメージ(最低1)
export const POISON_RATIO = 0.1;
// 攻撃ダウン中の攻撃力の倍率
export const WEAKEN_MULTIPLIER = 0.7;
