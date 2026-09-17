import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's type-stripping runner requires the explicit extension.
import { applyQuestReward, DEFAULT_PLAYER } from "./player.ts";

test("the demo detections grant one level and unlock fire", () => {
  const levels = [
    ...Array(7).fill("lv1"),
    ...Array(14).fill("lv2"),
    ...Array(5).fill("lv3"),
    ...Array(2).fill("lv4"),
  ] as const;

  const reward = applyQuestReward(DEFAULT_PLAYER, [...levels]);

  assert.equal(reward.earnedExp, 1775);
  assert.equal(reward.levelsGained, 1);
  assert.deepEqual(reward.unlockedSkills, ["fire"]);
  assert.deepEqual(reward.player, {
    level: 13,
    exp: 1015,
    expToNext: 2000,
    maxHp: 184,
    maxMp: 52,
    attack: 35,
    defense: 26,
    unlockedSkills: ["fire"],
  });
});
