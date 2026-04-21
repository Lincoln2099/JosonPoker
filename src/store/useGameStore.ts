import { create } from 'zustand';

import {
  createGame,
  dealNewCards,
  executeRound,
  type GamePhase,
  type GameState,
  type Screen,
} from '../game/GameEngine';

interface PendingSetup {
  np: number;
  ante: number;
}

interface GameStore {
  screen: Screen;
  game: GameState | null;
  /** 暂存玩家在菜单选好的人数与底注，等抓鸡场景选完输家名次后启动。 */
  pending: PendingSetup | null;
  /** 控制每手结算弹窗的显示。 */
  showRoundModal: boolean;

  startLoading: () => void;
  finishLoading: () => void;
  goToChickenScene: (np: number, ante: number) => void;
  startGameWithLoser: (loserRank: number) => void;

  toggleCardSelection: (index: number) => void;
  confirmPlay: () => void;
  /** 第四轮翻暗牌完毕后，继续结算（thinking → result）。 */
  resolveAfterFlip: () => void;
  closeRoundModal: () => void;
  nextRound: () => void;
  goToGameOver: () => void;
  setPhase: (phase: GamePhase) => void;

  goToMenu: () => void;
  quickRestart: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'loading',
  game: null,
  pending: null,
  showRoundModal: false,

  startLoading: () => {
    set({ screen: 'loading' });
  },

  finishLoading: () => {
    set({ screen: 'menu' });
  },

  goToChickenScene: (np, ante) => {
    set({ screen: 'chicken', pending: { np, ante } });
  },

  startGameWithLoser: (loserRank) => {
    const pending = get().pending;
    if (!pending) return;
    set({
      screen: 'game',
      game: createGame(pending.np, pending.ante, loserRank),
      showRoundModal: false,
    });
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

    // 第四轮（round===3）：玩家先选牌，再翻暗牌——此时进入翻牌过场，
    // 翻完后由 FlipReveal 回调调用 resolveAfterFlip 继续结算。
    if (game.round === 3) {
      set({ game: { ...game, phase: 'flip-reveal' } });
      return;
    }

    set({ game: { ...game, phase: 'thinking' } });

    setTimeout(() => {
      const g = get().game!;
      const { state: nextState } = executeRound(g);

      set({
        game: {
          ...nextState,
          phase: 'result',
        },
      });

      // 给胜负特效一些展示时间，再弹结算窗。
      setTimeout(() => {
        set({ showRoundModal: true });
      }, 1100);
    }, 600);
  },

  resolveAfterFlip: () => {
    const game = get().game;
    if (!game) return;

    set({ game: { ...game, phase: 'thinking' } });

    setTimeout(() => {
      const g = get().game!;
      const { state: nextState } = executeRound(g);

      set({
        game: {
          ...nextState,
          phase: 'result',
        },
      });

      setTimeout(() => {
        set({ showRoundModal: true });
      }, 1100);
    }, 400);
  },

  closeRoundModal: () => {
    set({ showRoundModal: false });
  },

  nextRound: () => {
    const game = get().game;
    if (!game) return;

    set({ showRoundModal: false });

    // 关键：一次性完成「补牌 + 进入下一轮 splash」，不再额外加 dealing 阶段，
    // 避免 CardHand 在 splash 前后各播一次发牌动画。
    // 第三轮结束后不再翻暗牌——暗牌改由第四轮确认出牌后再翻。
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
    set({ screen: 'gameover', showRoundModal: false });
  },

  setPhase: (phase) => {
    const g = get().game;
    if (!g) return;
    set({ game: { ...g, phase } });
  },

  goToMenu: () => {
    set({ screen: 'menu', game: null, pending: null, showRoundModal: false });
  },

  quickRestart: () => {
    const g = get().game;
    if (!g) return;
    set({
      screen: 'game',
      game: createGame(g.np, g.ante, g.loserRank),
      showRoundModal: false,
    });
  },
}));
