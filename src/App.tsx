import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import LoadingScreen from './components/screens/LoadingScreen';
import MenuScreen from './components/screens/MenuScreen';
import ChickenCatchScreen from './components/screens/ChickenCatchScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import SoundToggle from './components/hud/SoundToggle';
import { stopAmbient, stopBgm } from './hooks/useSound';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const startLoading = useGameStore((s) => s.startLoading);

  // 应用启动时确保从 loading 入口开始（即便 hot-reload 后保留状态也回到加载页）。
  useEffect(() => {
    startLoading();
  }, [startLoading]);

  // 强制兜底:页面挂载时立刻把所有可能残留的音频源停掉(短 BGM + 循环环境 BGM)。
  // 应对场景:
  //   1) 旧版本在 App 启动时会自动开循环 BGM,叠加场景短 BGM 让人头大
  //   2) HMR / 多标签 / 后台标签 等情况下 AudioContext 残留还在播
  // （SoundManager 构造时已经挂了 visibilitychange 钩子,tab 切到后台会自动 suspend）
  useEffect(() => {
    stopAmbient();
    stopBgm();
  }, []);

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
