import { useCallback, useEffect, useState } from 'react';
import { sound, type SfxName } from '../utils/sound';

/**
 * React 包装：订阅静音状态、暴露 play / toggleMute / isMuted。
 */
export function useSound() {
  const [isMuted, setIsMuted] = useState(() => sound.isMuted());

  useEffect(() => sound.subscribe(setIsMuted), []);

  const play = useCallback((name: SfxName) => sound.play(name), []);
  const toggleMute = useCallback(() => sound.toggleMute(), []);

  return { play, toggleMute, isMuted };
}

/** 不需要订阅状态、只想触发音效时用这个，避免重渲染。 */
export function playSound(name: SfxName) {
  sound.play(name);
}

/** 触发短促 BGM（一次性）。 */
export function playBgm(name: 'anticipation' | 'decisive' | 'fanfareWin' | 'fanfareLose') {
  sound.playBgm(name);
}

/** 立刻停掉 BGM（淡出 ~120ms）。 */
export function stopBgm() {
  sound.stopBgm();
}

/** 启动/切换循环环境 BGM（需已在用户手势上下文内调用才能真正出声）。 */
export function startAmbient(url: string) {
  sound.startAmbient(url);
}

/** 关闭循环环境 BGM。 */
export function stopAmbient() {
  sound.stopAmbient();
}

/** 播放外部音频文件作为一次性 SFX（按 URL 缓存）。 */
export function playFileSfx(url: string, opts?: { volume?: number }) {
  sound.playFileSfx(url, opts);
}

/** 预加载一个文件 SFX，避免首次播放时的解码抖动。 */
export function preloadFileSfx(url: string) {
  sound.preloadFileSfx(url);
}
