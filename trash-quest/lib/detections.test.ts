import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MAX_DETECTIONS, parseDetections } from "./detections.ts";
import { applyQuestReward, DEFAULT_PLAYER } from "./player.ts";

const valid = { name: " 本 ", level: "lv2", box_2d: [0, 10, 900, 1000] };

test("validated API detections feed the existing reward calculation", () => {
  const detections = parseDetections([valid, { ...valid, name: "紙", level: "lv1" }]);
  assert.equal(detections[0].name, "本");
  const reward = applyQuestReward(DEFAULT_PLAYER, detections.map((d) => d.level), "potion");
  assert.equal(reward.earnedExp, 75);
  assert.equal(reward.levelsGained, 1);
  assert.equal(reward.player.inventory.potion, DEFAULT_PLAYER.inventory.potion + 1);
});

test("zero detections and the existing demo fixture are valid", () => {
  assert.deepEqual(parseDetections([]), []);
  const fixture = JSON.parse(readFileSync(new URL("../api/detections.json", import.meta.url), "utf8"));
  assert.equal(parseDetections(fixture).length, fixture.length);
});

for (const [label, value] of Object.entries({
  object: {}, missing: [null], unknownLevel: [{ ...valid, level: "lv5" }],
  blankName: [{ ...valid, name: " " }], longName: [{ ...valid, name: "a".repeat(81) }],
  missingBox: [{ name: "本", level: "lv2" }],
  shortBox: [{ ...valid, box_2d: [1, 2, 3] }],
  negative: [{ ...valid, box_2d: [-1, 0, 5, 5] }],
  overflow: [{ ...valid, box_2d: [0, 0, 1001, 5] }],
  infinity: [{ ...valid, box_2d: [0, 0, Infinity, 5] }],
  nan: [{ ...valid, box_2d: [0, 0, NaN, 5] }],
  strings: [{ ...valid, box_2d: [0, 0, "5", 5] }],
  reversed: [{ ...valid, box_2d: [10, 0, 1, 5] }],
  zeroWidth: [{ ...valid, box_2d: [0, 5, 10, 5] }],
  excessive: Array(MAX_DETECTIONS + 1).fill(valid),
  partlyInvalid: [valid, { ...valid, level: "invalid" }],
})) {
  test(`rejects ${label} instead of passing partial rewards`, () => {
    assert.throws(() => parseDetections(value));
  });
}
