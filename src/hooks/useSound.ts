import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'joson-poker-muted';

function tryPlay(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Sound file missing or playback blocked — silent degrade
  }
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const mutedRef = useRef(isMuted);
  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  const play = useCallback((file: string) => {
    if (mutedRef.current) return;
    tryPlay(`/sounds/${file}`);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // storage unavailable
      }
      return next;
    });
  }, []);

  return {
    playDeal: useCallback(() => play('deal.mp3'), [play]),
    playFlip: useCallback(() => play('flip.mp3'), [play]),
    playSelect: useCallback(() => play('select.mp3'), [play]),
    playConfirm: useCallback(() => play('confirm.mp3'), [play]),
    playWin: useCallback(() => play('win.mp3'), [play]),
    playLose: useCallback(() => play('lose.mp3'), [play]),
    playRound: useCallback(() => play('round.mp3'), [play]),
    playClick: useCallback(() => play('click.mp3'), [play]),
    toggleMute,
    isMuted,
  };
}
