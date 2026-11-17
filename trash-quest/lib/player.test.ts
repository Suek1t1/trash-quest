import assert from "node:assert/strict";
import test from "node:test";

import { calculateDamage, drawItem, FLOORS, ITEM_IDS } from "./game.ts";
import { applyQuestReward, buyItem, DEFAULT_PLAYER } from "./player.ts";

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
  assert.deepEqual(reward.unlockedSkills, ["boa"]);
  assert.deepEqual(reward.player, {
    level: 13,
    exp: 83,
    expToNext: 219,
    maxHp: 88,
    maxMp: 44,
    attack: 41,
    defense: 26,
    unlockedSkills: ["boa"],
    inventory: { ...DEFAULT_PLAYER.inventory, potion: 1 },
    highestFloor: 1,
    gold: 1661,
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

test("item draw covers every item from the first to the last", () => {
  assert.equal(drawItem(() => 0), "herb");
  assert.equal(drawItem(() => 0.999), ITEM_IDS[ITEM_IDS.length - 1]);
  assert.equal(new Set(ITEM_IDS.map((_, i) => drawItem(() => (i + 0.5) / ITEM_IDS.length))).size, ITEM_IDS.length);
});

test("buying an item spends gold and adds it to the inventory", () => {
  const purchased = buyItem(DEFAULT_PLAYER, "potion", 250);

  assert.ok(purchased);
  assert.equal(purchased.gold, 1411);
  assert.deepEqual(purchased.inventory, {
    ...DEFAULT_PLAYER.inventory,
    potion: 1,
  });
});

test("an item cannot be bought without enough gold", () => {
  const player = { ...DEFAULT_PLAYER, gold: 99 };

  assert.equal(buyItem(player, "herb", 100), null);
  assert.equal(player.gold, 99);
  assert.equal(player.inventory.herb, 0);
});
