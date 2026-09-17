import type { ItemId } from "./game";

export type DetectionLevel = "lv1" | "lv2" | "lv3" | "lv4";

export type PlayerState = {
  level: number;
  exp: number;
  expToNext: number;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  unlockedSkills: string[];
  inventory: Record<ItemId, number>;
  highestFloor: number;
  gold: number;
};

export type QuestReward = {
  player: PlayerState;
  earnedExp: number;
  levelsGained: number;
  unlockedSkills: string[];
  earnedItem: ItemId | null;
};

const STORAGE_KEY = "player_state_v2";
let cachedValue: string | null | undefined;
let cachedPlayer: PlayerState;
const listeners = new Set<() => void>();

export const DEFAULT_PLAYER: PlayerState = {
  level: 1,
  exp: 0,
  expToNext: 75,
  maxHp: 40,
  maxMp: 20,
  attack: 5,
  defense: 2,
  unlockedSkills: [],
  inventory: { herb: 0, potion: 0, shield: 0 },
  highestFloor: 1,
  gold: 1661,
};

export const EXP_BY_LEVEL: Record<DetectionLevel, number> = {
  lv1: 25,
  lv2: 50,
  lv3: 100,
  lv4: 200,
};

const LEVEL_UP_GROWTH = {
  maxHp: 4,
  maxMp: 2,
  attack: 3,
  defense: 2,
};

const SKILL_UNLOCK_LEVEL: Record<string, number> = {
  fire: 13,
};

export function calculateQuestExp(levels: DetectionLevel[]): number {
  return levels.reduce((total, level) => total + EXP_BY_LEVEL[level], 0);
}

export function applyQuestReward(
  current: PlayerState,
  levels: DetectionLevel[],
  earnedItem: ItemId | null = null,
): QuestReward {
  const earnedExp = calculateQuestExp(levels);
  const player: PlayerState = {
    ...current,
    exp: current.exp + earnedExp,
    unlockedSkills: [...current.unlockedSkills],
    inventory: { ...current.inventory },
  };
  const unlockedSkills: string[] = [];
  let levelsGained = 0;

  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level += 1;
    player.maxHp += LEVEL_UP_GROWTH.maxHp;
    player.maxMp += LEVEL_UP_GROWTH.maxMp;
    player.attack += LEVEL_UP_GROWTH.attack;
    player.defense += LEVEL_UP_GROWTH.defense;
    player.expToNext += 12;
    levelsGained += 1;

    for (const [skill, unlockLevel] of Object.entries(SKILL_UNLOCK_LEVEL)) {
      if (
        player.level >= unlockLevel &&
        !player.unlockedSkills.includes(skill)
      ) {
        player.unlockedSkills.push(skill);
        unlockedSkills.push(skill);
      }
    }
  }

  if (earnedItem) player.inventory[earnedItem] += 1;

  return { player, earnedExp, levelsGained, unlockedSkills, earnedItem };
}

export function buyItem(
  current: PlayerState,
  itemId: ItemId,
  price: number,
): PlayerState | null {
  if (current.gold < price) return null;

  return {
    ...current,
    gold: current.gold - price,
    inventory: {
      ...current.inventory,
      [itemId]: current.inventory[itemId] + 1,
    },
  };
}

function freshPlayer(): PlayerState {
  return {
    ...DEFAULT_PLAYER,
    unlockedSkills: [],
    inventory: { ...DEFAULT_PLAYER.inventory },
  };
}

export function loadPlayer(): PlayerState {
  if (typeof window === "undefined") return freshPlayer();

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === cachedValue && cachedPlayer) return cachedPlayer;

  cachedValue = saved;
  if (!saved) {
    cachedPlayer = freshPlayer();
    return cachedPlayer;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<PlayerState>;
    cachedPlayer = {
      ...freshPlayer(),
      ...parsed,
      unlockedSkills: parsed.unlockedSkills ?? [],
      inventory: { ...DEFAULT_PLAYER.inventory, ...parsed.inventory },
    };
  } catch {
    cachedPlayer = freshPlayer();
  }
  return cachedPlayer;
}

export function savePlayer(player: PlayerState): void {
  const value = JSON.stringify(player);
  cachedValue = value;
  cachedPlayer = player;
  window.localStorage.setItem(STORAGE_KEY, value);
  listeners.forEach((listener) => listener());
}

export function resetPlayer(): void {
  savePlayer(freshPlayer());
}

export function subscribePlayer(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedValue = undefined;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}
