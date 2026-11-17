// アイテムの定義。新しいアイテムはここに足す
import type { Element } from "./elements.ts";
import type { StatusId } from "./statuses.ts";

export type ItemId =
  | "herb"
  | "potion"
  | "shield"
  | "match"
  | "snowBottle"
  | "waterBottle"
  | "thunderBottle"
  | "earthBottle"
  | "poisonBottle"
  | "dirtyBottle";

export type ItemEffect =
  | { type: "heal"; amount: number }
  | { type: "guard" }
  | { type: "status"; status: StatusId }
  // multiplier は属性魔法の威力 (攻撃力 + MAGIC_POWER) に対する倍率
  | { type: "damage"; element: Element | "random"; multiplier: number };

export type ItemDefinition = {
  name: string;
  description: string;
  image: string;
  price: number;
  effect: ItemEffect;
};

export const ITEM_IDS: ItemId[] = [
  "herb",
  "potion",
  "shield",
  "match",
  "snowBottle",
  "waterBottle",
  "thunderBottle",
  "earthBottle",
  "poisonBottle",
  "dirtyBottle",
];

// 属性の瓶は対応する属性魔法の約1.2倍の威力
export const BOTTLE_MULTIPLIER = 1.2;

export const ITEMS: Record<ItemId, ItemDefinition> = {
  herb: {
    name: "薬草",
    description: "HPを25回復",
    image: "/img/items/herbs.png",
    price: 100,
    effect: { type: "heal", amount: 25 },
  },
  potion: {
    name: "ポーション",
    description: "HPを60回復",
    image: "/img/items/potion.png",
    price: 250,
    effect: { type: "heal", amount: 60 },
  },
  shield: {
    name: "守護の盾",
    description: "次の攻撃を無効化",
    image: "/img/items/shield.png",
    price: 500,
    effect: { type: "guard" },
  },
  match: {
    name: "マジカルマッチ",
    description: "相手に炎属性のダメージを与える",
    image: "/img/items/MagicalMatch.png",
    price: 300,
    effect: { type: "damage", element: "fire", multiplier: BOTTLE_MULTIPLIER },
  },
  snowBottle: {
    name: "冷気の入った瓶",
    description: "相手に氷属性のダメージ",
    image: "/img/items/SnowBottle.png",
    price: 300,
    effect: { type: "damage", element: "ice", multiplier: BOTTLE_MULTIPLIER },
  },
  waterBottle: {
    name: "池の入った瓶",
    description: "相手に水属性のダメージ",
    image: "/img/items/WaterBottle.png",
    price: 300,
    effect: { type: "damage", element: "water", multiplier: BOTTLE_MULTIPLIER },
  },
  thunderBottle: {
    name: "雷雲の入った瓶",
    description: "相手に雷属性のダメージ",
    image: "/img/items/LightingBottle.png",
    price: 300,
    effect: { type: "damage", element: "thunder", multiplier: BOTTLE_MULTIPLIER },
  },
  earthBottle: {
    name: "地震の入った瓶",
    description: "相手に地面属性のダメージ",
    image: "/img/items/EarthquakeBottle.png",
    price: 300,
    effect: { type: "damage", element: "earth", multiplier: BOTTLE_MULTIPLIER },
  },
  poisonBottle: {
    name: "毒の入った瓶",
    description: "相手を毒にする(毎ターンダメージ)",
    image: "/img/items/PoisonBottle.png",
    price: 250,
    effect: { type: "status", status: "poison" },
  },
  dirtyBottle: {
    name: "表面が汚い瓶",
    description: "相手にランダムな属性のダメージ",
    image: "/img/items/DirtyBottle.png",
    price: 200,
    effect: { type: "damage", element: "random", multiplier: 1 },
  },
};

export function drawItem(random = Math.random): ItemId {
  return ITEM_IDS[Math.min(ITEM_IDS.length - 1, Math.floor(random() * ITEM_IDS.length))];
}
