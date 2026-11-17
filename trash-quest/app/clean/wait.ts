// 演出用の待ち時間(ミリ秒)
export const resultWait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));
