// 敵(階層ごと)の定義
export type EnemyDefinition = {
  name: string;
  image: string;
  maxHp: number;
  attack: number;
  defense: number;
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
    name: "闇の勇者",
    image: "/img/enemy/dark_hero.png",
    maxHp: 260,
    attack: 62,
    defense: 28,
  },
];
