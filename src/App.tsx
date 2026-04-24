import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import LoadingScreen from './components/screens/LoadingScreen';
import MenuScreen from './components/screens/MenuScreen';
import ChickenCatchScreen from './components/screens/ChickenCatchScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import SoundToggle from './components/hud/SoundToggle';
import { startAmbient, stopBgm } from './hooks/useSound';

/** 全程循环播放的环境 BGM —— 从加载页一直放到回菜单,只有静音按钮能停 */
const APP_AMBIENT_BGM = '/assets/bgm/sunlight-through-blossoms.mp3';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const startLoading = useGameStore((s) => s.startLoading);

  // 应用启动时确保从 loading 入口开始（即便 hot-reload 后保留状态也回到加载页）。
  useEffect(() => {
    startLoading();
  }, [startLoading]);

  // 兜底清掉上一局可能残留的短 BGM(各场景的 splash / fanfare 等),
  // 然后把全程循环的环境 BGM 标记为"激活":
  //   - 第一次调 startAmbient 会同时尝试"立刻开播"
  //   - 如果浏览器 autoplay 还没解锁(没有用户手势),就只是预加载 mp3,
  //     等用户首次点击/触摸/按键时再真正出声(下面的 once 监听器负责)
  useEffect(() => {
    stopBgm();
    startAmbient(APP_AMBIENT_BGM);
    const kick = () => startAmbient(APP_AMBIENT_BGM);
    const events: Array<keyof DocumentEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
    ];
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
