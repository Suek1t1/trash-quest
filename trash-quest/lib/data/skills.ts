// 魔法の定義。新しい魔法はここに足す
import type { StatusId } from "./statuses.ts";

export type SkillId =
  | "boa"
  | "frizz"
  | "zabaan"
  | "biririn"
  | "dodoodo"
  | "mukiki"
  | "gussurin"
  | "guttarin"
  | "darudaru";

export type SkillDefinition = {
  name: string;
  description: string;
  icon: string;
  mpCost: number;
  unlockLevel: number;
  kind: "attack" | "buff" | "status";
  status?: StatusId; // kind が "status" のとき、敵に付ける状態異常
};

// 属性魔法の威力は元のファイアと同じ (攻撃力 + 20)
export const MAGIC_POWER = 20;
export const MUKIKI_MULTIPLIER = 1.1;

export const SKILLS: Record<SkillId, SkillDefinition> = {
  boa: {
    name: "ボワ",
    description: "炎属性の魔法",
    icon: "🔥",
    mpCost: 10,
    unlockLevel: 13,
    kind: "attack",
  },
  mukiki: {
    name: "ムキキ",
    description: "勇者の攻撃力を1.1倍",
    icon: "💪",
    mpCost: 10,
    unlockLevel: 14,
    kind: "buff",
  },
  frizz: {
    name: "フリッズ",
    description: "氷属性の魔法",
    icon: "❄️",
    mpCost: 10,
    unlockLevel: 15,
    kind: "attack",
  },
  zabaan: {
    name: "ザバーン",
    description: "水属性の魔法",
    icon: "🌊",
    mpCost: 10,
    unlockLevel: 16,
    kind: "attack",
  },
  biririn: {
    name: "ビリリン",
    description: "雷属性の魔法",
    icon: "⚡",
    mpCost: 10,
    unlockLevel: 17,
    kind: "attack",
  },
  dodoodo: {
    name: "ドドード",
    description: "土属性の魔法",
    icon: "🪨",
    mpCost: 10,
    unlockLevel: 18,
    kind: "attack",
  },
  gussurin: {
    name: "グッスリン",
    description: "相手を眠らせる(2ターン行動不能)",
    icon: "💤",
    mpCost: 10,
    unlockLevel: 19,
    kind: "status",
    status: "sleep",
  },
  guttarin: {
    name: "グッタリン",
    description: "相手を毒にする(毎ターンダメージ)",
    icon: "☠️",
    mpCost: 10,
    unlockLevel: 20,
    kind: "status",
    status: "poison",
  },
  darudaru: {
    name: "ダルダル",
    description: "相手の攻撃力を下げる",
    icon: "⬇️",
    mpCost: 10,
    unlockLevel: 21,
    kind: "status",
    status: "weaken",
  },
};

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];
