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
};

export type QuestReward = {
  player: PlayerState;
  earnedExp: number;
  levelsGained: number;
  unlockedSkills: string[];
};

const STORAGE_KEY = "player_state";

export const DEFAULT_PLAYER: PlayerState = {
  level: 12,
  exp: 1240,
  expToNext: 2000,
  maxHp: 180,
  maxMp: 50,
  attack: 32,
  defense: 24,
  unlockedSkills: [],
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
): QuestReward {
  const earnedExp = calculateQuestExp(levels);
  const player: PlayerState = {
    ...current,
    exp: current.exp + earnedExp,
    unlockedSkills: [...current.unlockedSkills],
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

  return { player, earnedExp, levelsGained, unlockedSkills };
}

export function loadPlayer(): PlayerState {
  if (typeof window === "undefined") return { ...DEFAULT_PLAYER };

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...DEFAULT_PLAYER };

  try {
    return { ...DEFAULT_PLAYER, ...JSON.parse(saved) } as PlayerState;
  } catch {
    return { ...DEFAULT_PLAYER };
  }
}

export function savePlayer(player: PlayerState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}
