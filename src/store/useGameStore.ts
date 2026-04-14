import { create } from 'zustand';

import {
  createGame,
  dealNewCards,
  executeRound,
  type GamePhase,
  type GameState,
  type Screen,
} from '../game/GameEngine';

interface GameStore {
  screen: Screen;
  game: GameState | null;

  startGame: (np: number, ante: number, loserRank: number) => void;

  toggleCardSelection: (index: number) => void;
  confirmPlay: () => void;
  nextRound: () => void;
  goToGameOver: () => void;
  setPhase: (phase: GamePhase) => void;

  goToMenu: () => void;
  quickRestart: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'menu',
  game: null,

  startGame: (np, ante, loserRank) => {
    set({ screen: 'game', game: createGame(np, ante, loserRank) });
  },

  toggleCardSelection: (index) => {
    const game = get().game;
    if (!game || game.round === 4) return;

    const selected = [...game.selectedIndices];
    const pos = selected.indexOf(index);
    if (pos >= 0) {
      selected.splice(pos, 1);
    } else if (selected.length < 2) {
      selected.push(index);
    }
    set({ game: { ...game, selectedIndices: selected } });
  },

  confirmPlay: () => {
    const game = get().game;
    if (!game) return;
    if (game.round < 4 && game.selectedIndices.length !== 2) return;

    set({ game: { ...game, phase: 'thinking' } });

    const g = get().game!;
    const { state: nextState } = executeRound(g);

    set({
      game: {
        ...nextState,
        phase: 'result',
      },
    });
  },

  nextRound: () => {
    const game = get().game;
    if (!game) return;

    const dealt = dealNewCards(game);
    const round = dealt.round + 1;

    if (round > 4) {
      set({ screen: 'gameover', game: { ...dealt, round } });
      return;
    }

    set({
      game: {
        ...dealt,
        round,
        phase: 'round-splash',
        selectedIndices: [],
      },
    });
  },

  goToGameOver: () => {
    set({ screen: 'gameover' });
  },

  setPhase: (phase) => {
    const g = get().game;
    if (!g) return;
    set({ game: { ...g, phase } });
  },

  goToMenu: () => {
    set({ screen: 'menu', game: null });
  },

  quickRestart: () => {
    const g = get().game;
    if (!g) return;
    set({ screen: 'game', game: createGame(g.np, g.ante, g.loserRank) });
  },
}));
