import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import LoadingScreen from './components/screens/LoadingScreen';
import MenuScreen from './components/screens/MenuScreen';
import ChickenCatchScreen from './components/screens/ChickenCatchScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import SoundToggle from './components/hud/SoundToggle';
import { startAmbient } from './hooks/useSound';

const AMBIENT_BGM_URL = '/assets/bgm/sunlight-through-blossoms.mp3';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const startLoading = useGameStore((s) => s.startLoading);

  // 应用启动时确保从 loading 入口开始（即便 hot-reload 后保留状态也回到加载页）。
  useEffect(() => {
    startLoading();
  }, [startLoading]);

  // 加载页结束后启动环境背景音乐。立刻试一次（若 AudioContext 已解锁即可发声），
  // 并挂一次性用户手势监听作为移动端自动播放策略的兜底。
  useEffect(() => {
    if (screen === 'loading') return;
    const kick = () => startAmbient(AMBIENT_BGM_URL);
    kick();
    const events: Array<keyof DocumentEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    const once = () => {
      kick();
      events.forEach((e) => document.removeEventListener(e, once));
    };
    events.forEach((e) =>
      document.addEventListener(e, once, { once: true, passive: true }),
    );
    return () => {
      events.forEach((e) => document.removeEventListener(e, once));
    };
  }, [screen]);

  return (
    <div className="min-h-dvh text-white">
      <AnimatePresence mode="wait">
        {screen === 'loading' && <LoadingScreen key="loading" />}
        {screen === 'menu' && <MenuScreen key="menu" />}
        {screen === 'chicken' && <ChickenCatchScreen key="chicken" />}
        {screen === 'game' && <GameScreen key="game" />}
        {screen === 'gameover' && <GameOverScreen key="gameover" />}
      </AnimatePresence>
      {/* 全局音效开关，加载页除外（避免遮挡启动图） */}
      {screen !== 'loading' && <SoundToggle />}
    </div>
  );
}
