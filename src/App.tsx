import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import MenuScreen from './components/screens/MenuScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.04, filter: 'blur(6px)' },
};

export default function App() {
  const screen = useGameStore((s) => s.screen);
  return (
    <div className="min-h-dvh overflow-hidden text-white">
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div key="menu" {...pageVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <MenuScreen />
          </motion.div>
        )}
        {screen === 'game' && (
          <motion.div key="game" {...pageVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <GameScreen />
          </motion.div>
        )}
        {screen === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <GameOverScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
