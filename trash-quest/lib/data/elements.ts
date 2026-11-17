// 属性(炎・氷・水・雷・地面)の定義
export type Element = "fire" | "ice" | "water" | "thunder" | "earth";

export const ELEMENTS: Record<Element, { name: string; icon: string }> = {
  fire: { name: "炎", icon: "🔥" },
  ice: { name: "氷", icon: "❄️" },
  water: { name: "水", icon: "🌊" },
  thunder: { name: "雷", icon: "⚡" },
  earth: { name: "地面", icon: "🪨" },
};

export const ELEMENT_IDS = Object.keys(ELEMENTS) as Element[];

export function pickElement(random = Math.random): Element {
  return ELEMENT_IDS[Math.min(ELEMENT_IDS.length - 1, Math.floor(random() * ELEMENT_IDS.length))];
}
