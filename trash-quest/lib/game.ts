export type ItemId = "herb" | "potion" | "shield";

export type ItemDefinition = {
  name: string;
  description: string;
  image: string;
};

export type EnemyDefinition = {
  name: string;
  image: string;
  maxHp: number;
  attack: number;
  defense: number;
};

export const ITEM_IDS: ItemId[] = ["herb", "potion", "shield"];

export const ITEMS: Record<ItemId, ItemDefinition> = {
  herb: {
    name: "薬草",
    description: "HPを25回復",
    image: "/img/items/herbs.png",
  },
  potion: {
    name: "ポーション",
    description: "HPを60回復",
    image: "/img/items/potion.png",
  },
  shield: {
    name: "守護の盾",
    description: "次の攻撃を無効化",
    image: "/img/items/shield.png",
  },
};

export const FLOORS: EnemyDefinition[] = [
  {
    name: "スライム",
    image: "/img/slime.png",
    maxHp: 50,
    attack: 14,
    defense: 2,
  },
  {
    name: "ゴブリン",
    image: "/img/enemy/goblin.png",
    maxHp: 120,
    attack: 40,
    defense: 14,
  },
  {
    name: "グリーンドラゴン",
    image: "/img/enemy/dragon.png",
    maxHp: 260,
    attack: 62,
    defense: 28,
  },
];

export function calculateDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense);
}

export function drawItem(random = Math.random): ItemId {
  return ITEM_IDS[Math.min(ITEM_IDS.length - 1, Math.floor(random() * ITEM_IDS.length))];
}
