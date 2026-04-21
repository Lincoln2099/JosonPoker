import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import LoadingScreen from './components/screens/LoadingScreen';
import MenuScreen from './components/screens/MenuScreen';
import ChickenCatchScreen from './components/screens/ChickenCatchScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import SoundToggle from './components/hud/SoundToggle';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const startLoading = useGameStore((s) => s.startLoading);

  // 应用启动时确保从 loading 入口开始（即便 hot-reload 后保留状态也回到加载页）。
  useEffect(() => {
    startLoading();
  }, [startLoading]);

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
