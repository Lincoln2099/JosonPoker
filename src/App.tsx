import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import MenuScreen from './components/screens/MenuScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function App() {
  const screen = useGameStore((s) => s.screen);
  return (
    <div className="min-h-dvh text-white">
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div key="menu" {...pageVariants} transition={{ duration: 0.3 }}>
            <MenuScreen />
          </motion.div>
        )}
        {screen === 'game' && (
          <motion.div key="game" {...pageVariants} transition={{ duration: 0.3 }}>
            <GameScreen />
          </motion.div>
        )}
        {screen === 'gameover' && (
          <motion.div key="gameover" {...pageVariants} transition={{ duration: 0.3 }}>
            <GameOverScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
