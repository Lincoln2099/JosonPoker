/**
 * 静态资源路径与预加载工具。
 * 所有图片都存放在 `public/assets`，运行时通过绝对路径访问。
 */

export type AvatarMood = 'neutral' | 'think' | 'win' | 'lose';

export const TOTAL_CHARACTERS = 8;

/** 角色 1..8 在每种情绪下的头像图片路径。 */
export function getAvatarSrc(charIdx: number, mood: AvatarMood = 'neutral'): string {
  const idx = ((charIdx - 1) % TOTAL_CHARACTERS + TOTAL_CHARACTERS) % TOTAL_CHARACTERS + 1;
  return `/assets/avatars/char-${idx}-${mood}.png`;
}

export const TABLE_PORTRAIT = '/assets/table-portrait.png';
export const TABLE_LANDSCAPE = '/assets/table-landscape.png';
export const LOADING_PORTRAIT = '/assets/loading-portrait.jpg';
export const LOADING_LANDSCAPE = '/assets/loading-landscape.png';

/** 收集所有需要预加载的关键图片。 */
export function collectPreloadList(): string[] {
  const list: string[] = [
    TABLE_PORTRAIT,
    TABLE_LANDSCAPE,
    LOADING_PORTRAIT,
    LOADING_LANDSCAPE,
  ];
  const moods: AvatarMood[] = ['neutral', 'think', 'win', 'lose'];
  for (let i = 1; i <= TOTAL_CHARACTERS; i++) {
    for (const m of moods) {
      list.push(getAvatarSrc(i, m));
    }
  }
  return list;
}

/** 异步并发预加载图片，progress 回调返回 0~1 的进度。 */
export function preloadImages(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const total = urls.length;
  let loaded = 0;
  return new Promise((resolve) => {
    if (total === 0) {
      resolve();
      return;
    }
    const done = () => {
      loaded++;
      onProgress?.(loaded, total);
      if (loaded >= total) resolve();
    };
    for (const url of urls) {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }
  });
}
