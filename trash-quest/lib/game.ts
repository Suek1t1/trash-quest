// ゲームのデータと基本の計算。中身は lib/data/ に分けてあり、ここでまとめて公開する。
export * from "./data/elements.ts";
export * from "./data/enemies.ts";
export * from "./data/items.ts";
export * from "./data/skills.ts";
export * from "./data/statuses.ts";

export function calculateDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense);
}
