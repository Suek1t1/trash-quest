import assert from "node:assert/strict";
import test from "node:test";

import {
  applyStatus,
  canAct,
  emptyStatuses,
  healedAmount,
  heroAttackPower,
  hpAfterDamage,
  magicDamage,
  physicalDamage,
  poisonDamage,
  statusAdjustedAttack,
  tickStatuses,
} from "./battle.ts";

test("ムキキは攻撃力を1.1倍(小数切り捨て)にする", () => {
  assert.equal(heroAttackPower(41, false), 41);
  assert.equal(heroAttackPower(41, true), 45);
});

test("通常攻撃は 攻撃力 - 防御、最低1", () => {
  assert.equal(physicalDamage(41, 14), 27);
  assert.equal(physicalDamage(5, 99), 1);
});

test("魔法は 攻撃力+20 で計算し、瓶は1.2倍の威力", () => {
  assert.equal(magicDamage(41, 14), 47);
  assert.equal(magicDamage(41, 14, 1.2), 73 - 14);
});

test("HPは0未満にならず、回復は最大HPを超えない", () => {
  assert.equal(hpAfterDamage(10, 30), 0);
  assert.equal(healedAmount(80, 88, 60), 8);
  assert.equal(healedAmount(10, 88, 25), 25);
});

test("状態異常は付けると基本ターン数になり、重ねがけは長い方を採用", () => {
  const poisoned = applyStatus(emptyStatuses(), "poison");
  assert.equal(poisoned.poison, 3);
  assert.equal(applyStatus(poisoned, "poison", 1).poison, 3);
  assert.equal(applyStatus(poisoned, "poison", 5).poison, 5);
});

test("ターン終了で残りターンが減り、0になったら治ったと返す", () => {
  const start = applyStatus(applyStatus(emptyStatuses(), "sleep"), "poison");
  const first = tickStatuses(start);
  assert.deepEqual(first.next, { poison: 2, sleep: 1, weaken: 0 });
  assert.deepEqual(first.cured, []);
  const second = tickStatuses(first.next);
  assert.deepEqual(second.cured, ["sleep"]);
  assert.equal(second.next.sleep, 0);
});

test("眠りは行動不能、攻撃ダウンは攻撃力0.7倍、毒は最大HPの1/10", () => {
  assert.equal(canAct(emptyStatuses()), true);
  assert.equal(canAct(applyStatus(emptyStatuses(), "sleep")), false);
  assert.equal(statusAdjustedAttack(40, emptyStatuses()), 40);
  assert.equal(statusAdjustedAttack(40, applyStatus(emptyStatuses(), "weaken")), 28);
  assert.equal(poisonDamage(120), 12);
  assert.equal(poisonDamage(5), 1);
});
