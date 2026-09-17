import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's type-stripping runner requires the explicit extension.
import { calculateDamage, drawItem, FLOORS } from "./game.ts";
// @ts-expect-error Node's type-stripping runner requires the explicit extension.
import { applyQuestReward, DEFAULT_PLAYER } from "./player.ts";

const demoLevels = [
  ...Array(7).fill("lv1"),
  ...Array(14).fill("lv2"),
  ...Array(5).fill("lv3"),
  ...Array(2).fill("lv4"),
] as const;

test("the demo cleanup raises the player from level 1 to 13", () => {
  const reward = applyQuestReward(DEFAULT_PLAYER, [...demoLevels], "potion");

  assert.equal(reward.earnedExp, 1775);
  assert.equal(reward.levelsGained, 12);
  assert.deepEqual(reward.unlockedSkills, ["fire"]);
  assert.deepEqual(reward.player, {
    level: 13,
    exp: 83,
    expToNext: 219,
    maxHp: 88,
    maxMp: 44,
    attack: 41,
    defense: 26,
    unlockedSkills: ["fire"],
    inventory: { herb: 0, potion: 1, shield: 0 },
    highestFloor: 1,
  });
});

function winsWithoutItems(
  player: typeof DEFAULT_PLAYER,
  enemy: (typeof FLOORS)[number],
): boolean {
  const turnsToWin = Math.ceil(
    enemy.maxHp / calculateDamage(player.attack, enemy.defense),
  );
  const hitsToLose = Math.ceil(
    player.maxHp / calculateDamage(enemy.attack, player.defense),
  );
  return turnsToWin <= hitsToLose;
}

test("cleaning changes the reachable dungeon floor", () => {
  const leveled = applyQuestReward(DEFAULT_PLAYER, [...demoLevels]).player;

  assert.equal(winsWithoutItems(DEFAULT_PLAYER, FLOORS[0]), false);
  assert.equal(winsWithoutItems(leveled, FLOORS[0]), true);
  assert.equal(winsWithoutItems(leveled, FLOORS[1]), true);
  assert.equal(winsWithoutItems(leveled, FLOORS[2]), false);
});

test("item draw covers all three rewards", () => {
  assert.equal(drawItem(() => 0), "herb");
  assert.equal(drawItem(() => 0.5), "potion");
  assert.equal(drawItem(() => 0.999), "shield");
});
