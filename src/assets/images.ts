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
export const CHICKEN_POSE = '/assets/chicken-pose.png';
/** 抓鸡场景背景：樱花林金色晨光 */
export const BG_CATCH_SCENE = '/assets/bg-catch-scene.png';
/** 从背景图底部裁出的草地+雏菊+花瓣条带,贴在抓鸡屏鸡群脚下 */
export const GRASS_STRIP = '/assets/grass-strip.png';

/** 抓鸡场景：编号 2~8 各自一张独特的 3D Pixar 风格鸡 PNG */
export function getChickenSrc(num: number): string {
  const clamped = Math.max(2, Math.min(8, num));
  return `/assets/chickens/chicken-${clamped}.png`;
}

/** 抓鸡动画：Pixar 3D 风格的张开手和握拳（带绿色袖子 + 金色袖口） */
export const HAND_OPEN = '/assets/hand-open.png';
export const HAND_FIST = '/assets/hand-fist.png';

/** 收集所有需要预加载的关键图片。 */
export function collectPreloadList(): string[] {
  const list: string[] = [
    TABLE_PORTRAIT,
    TABLE_LANDSCAPE,
    LOADING_PORTRAIT,
    LOADING_LANDSCAPE,
    CHICKEN_POSE,
    BG_CATCH_SCENE,
    GRASS_STRIP,
  ];
  for (let n = 2; n <= 8; n++) {
    list.push(getChickenSrc(n));
  }
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
