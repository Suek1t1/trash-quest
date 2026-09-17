"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_PLAYER, loadPlayer, subscribePlayer } from "./player";

export function usePlayer() {
  return useSyncExternalStore(subscribePlayer, loadPlayer, () => DEFAULT_PLAYER);
}
