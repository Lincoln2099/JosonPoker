import { useGameStore } from './store/useGameStore';
import MenuScreen from './components/screens/MenuScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  return (
    <div className="min-h-dvh text-white">
      {screen === 'menu' && <MenuScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'gameover' && <GameOverScreen />}
    </div>
  );
}
