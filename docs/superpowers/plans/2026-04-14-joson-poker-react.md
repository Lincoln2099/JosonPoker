# 分轮倍增赛 React 重构 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将单文件 HTML 扑克游戏原型重构为模块化 React 项目，春日足球场主题，丰富动画，部署到 Vercel。

**Architecture:** 纯前端 SPA。游戏逻辑层（`src/game/`）是零依赖纯 TypeScript，从现有 `poker.html` 提取。UI 层用 React + Zustand + Framer Motion。状态单一真相：GameEngine 纯函数产出快照，Store 持有快照并暴露 actions。

**Tech Stack:** Vite, React 18, TypeScript, Zustand, Framer Motion, Tailwind CSS 4, Howler.js

**Spec:** `docs/superpowers/specs/2026-04-14-joson-poker-redesign-design.md`

**Source reference:** `poker.html`（所有游戏逻辑从此文件提取迁移）

**Prerequisites:** 项目已 `git init`，设计规格和原型已提交。参考 `游戏规则.md` 验证规则对等性。

---

## Chunk 1: 脚手架 + 游戏逻辑迁移（Day 1 P0）

目标：建立项目骨架，迁移全部游戏逻辑，Store 可驱动完整游戏循环，三个 Screen 可切换，基础 UI 可玩。

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: 创建 Vite + React + TypeScript 项目**

```bash
cd /Users/study/code/JosonPoker
npm create vite@latest . -- --template react-ts
```

如果提示目录非空，选择覆盖（仅写入新文件，不会删除现有文件）。

- [ ] **Step 2: 安装依赖**

```bash
npm install zustand framer-motion howler
npm install -D @types/howler tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 Tailwind CSS 4**

修改 `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Vite 模板默认生成 `src/index.css`（且 `main.tsx` 中 import 它）。替换其内容为:
```css
@import "tailwindcss";
```

确认 `src/main.tsx` 中有 `import './index.css'`。

- [ ] **Step 4: 清理脚手架默认文件**

删除 `src/App.css`, `src/assets/` 目录。修改 `src/App.tsx` 为空壳:
```tsx
export default function App() {
  return <div className="min-h-screen bg-slate-900 text-white">分轮倍增赛</div>
}
```

- [ ] **Step 5: 验证启动**

```bash
npm run dev
```
Expected: 浏览器显示 "分轮倍增赛" 深色背景白字。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: vite + react + ts + tailwind + zustand + framer-motion scaffold"
```

---

### Task 2: 迁移 Card.ts + Deck.ts

**Files:**
- Create: `src/game/Card.ts`, `src/game/Deck.ts`

**Source reference:** `poker.html` lines 721-842

- [ ] **Step 1: 创建 src/game/Card.ts**

从 `poker.html` 提取并添加类型。包含:
- `SUITS`, `SUIT_COLORS`, `SUIT_VALUES`, `RANKS`, `RANK_VALUES` 常量
- `MULTS = [1,2,4,8,16]`, `ROUND_CN` 等游戏常量
- `AI_ROSTER` 数组（7种AI配置）
- `Card` 类（与原型一致：suit, rank, jokerType, deckIdx, id, isJoker, rankValue, suitValue, color, displayRank）
- 导出 `CardType` 接口供其他模块使用

关键：将 `Card` 类改为带完整 TypeScript 类型标注的版本，保持所有 getter 逻辑不变。

- [ ] **Step 2: 创建 src/game/Deck.ts**

从 `poker.html` 提取 `Deck` 类:
- constructor: 生成 2 副牌 108 张 + 洗牌
- `draw(n)`: 抽取 n 张牌
- `shuffleArray` 工具函数也放在这里

- [ ] **Step 3: 验证 — 在浏览器控制台测试**

临时在 `App.tsx` 中 import 并 console.log:
```typescript
import { Deck } from './game/Deck'
const d = new Deck()
console.log('deck size:', d.cards.length) // should be 108
console.log('draw 5:', d.draw(5))
```

- [ ] **Step 4: Commit**

```bash
git add src/game/Card.ts src/game/Deck.ts && git commit -m "feat: migrate Card + Deck from prototype"
```

---

### Task 3: 迁移 evaluate.ts

**Files:**
- Create: `src/game/evaluate.ts`

**Source reference:** `poker.html` lines 844-876

- [ ] **Step 1: 创建 src/game/evaluate.ts**

从 `poker.html` 提取:
- `EvalResult` 类型: `{ type: number, key: number[], suit: number, name: string, hasJoker?: boolean }`
- `evalRaw(cards: Card[])`: 评估 3 张非王牌组合
- `cmpEval(a: EvalResult, b: EvalResult)`: 比较两个评估结果
- `evalHand(cards: Card[])`: 评估含王牌的手牌（穷举最优替代）

逻辑与原型完全一致，只加类型标注。

- [ ] **Step 2: 验证**

在控制台测试:
```typescript
import { Card } from './game/Card'
import { evalHand } from './game/evaluate'
// 测试同花顺
const cards = [new Card('♠','A'), new Card('♠','K'), new Card('♠','Q')]
console.log(evalHand(cards)) // { type: 6, name: '同花顺', ... }
```

- [ ] **Step 3: Commit**

```bash
git add src/game/evaluate.ts && git commit -m "feat: migrate evalHand/evalRaw/cmpEval"
```

---

### Task 4: 迁移 payout.ts

**Files:**
- Create: `src/game/payout.ts`

**Source reference:** `poker.html` lines 747-817

- [ ] **Step 1: 创建 src/game/payout.ts**

从 `poker.html` 提取:
- `calcWeights(np: number, loserRank: number): (number | null)[]`
- `distributeEvenly(total: number, count: number): number[]`
- `calcPayouts(results, np, loserRank, mult, ante)` — 完整赔率计算

注意 `RoundResult` 类型定义:
```typescript
export interface RoundResult {
  pi: number          // player index
  ev: EvalResult      // hand evaluation
  played: Card[]      // cards played this round
  combo: Card[]       // full combo (played + community)
  rank: number        // final rank this round
  delta: number       // score change
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/payout.ts && git commit -m "feat: migrate payout calculation"
```

---

### Task 5: 迁移 ai.ts

**Files:**
- Create: `src/game/ai.ts`

**Source reference:** `poker.html` lines 878-992

- [ ] **Step 1: 创建 src/game/ai.ts**

从 `poker.html` 提取全部 AI 策略函数:
- `aiPickSteady` — 庄家（稳健）
- `aiPickAggressive` — 赌神（激进）
- `aiPickConservative` — 狐狸（保守）
- `aiPickRandom` — 疯子（随机）
- `aiPickCalculated` — 算命（计算）
- `aiPickReverse` — 老千（反向）
- `aiPickSimple` — 新手（简单）
- `aiPick(hand, cc, playerStyle, round)` — 调度函数

先迁移原有逻辑，AI 升级放在 Chunk 3。

注意：原型中 `aiPick` 依赖全局 `G` 对象访问 `round`。重构为参数传入:
```typescript
export function aiPick(
  hand: Card[],
  cc: Card | null,
  style: string,
  round: number
): [number, number]
```

- [ ] **Step 2: Commit**

```bash
git add src/game/ai.ts && git commit -m "feat: migrate 7 AI strategies"
```

---

### Task 6: 创建 GameEngine.ts

**Files:**
- Create: `src/game/GameEngine.ts`

**Source reference:** `poker.html` lines 994-1029（initGame, doRound, dealPendingCards）

- [ ] **Step 1: 定义 GameState 类型**

```typescript
export interface PlayerState {
  name: string
  isHuman: boolean
  hand: Card[]
  score: number
  roundScores: number[]  // per-round deltas
  style: string | null
  emoji: string
}

export interface GameState {
  np: number
  ante: number
  loserRank: number
  deck: Deck
  comm: Card[]           // 4 community cards
  players: PlayerState[]
  round: number          // 0-4
  phase: GamePhase
  selectedIndices: number[]
  lastResults: RoundResult[] | null
  newCards: Card[]
}

export type GamePhase =
  | 'round-splash' | 'flip-reveal' | 'select'
  | 'thinking' | 'result' | 'dealing'

export type Screen = 'menu' | 'game' | 'gameover'
```

- [ ] **Step 2: 实现 GameEngine 纯函数**

```typescript
export function createGame(np: number, ante: number, loserRank: number): GameState
export function executeRound(state: GameState): { state: GameState; results: RoundResult[] }
export function dealNewCards(state: GameState): GameState
```

`createGame` 对应原型的 `initGame`。
`executeRound` 对应原型的 `doRound`，但返回新的 state 而非修改全局 `G`。
`dealNewCards` 对应原型的 `dealPendingCards`。

所有函数都是纯函数，接收旧 state 返回新 state。

- [ ] **Step 3: Commit**

```bash
git add src/game/GameEngine.ts && git commit -m "feat: GameEngine pure functions"
```

---

### Task 7: 创建 Zustand Store

**Files:**
- Create: `src/store/useGameStore.ts`

- [ ] **Step 1: 实现 useGameStore**

```typescript
import { create } from 'zustand'

interface GameStore {
  screen: Screen
  game: GameState | null

  // Menu actions
  startGame: (np: number, ante: number, loserRank: number) => void

  // Game actions
  toggleCardSelection: (index: number) => void
  confirmPlay: () => void
  nextRound: () => void
  goToGameOver: () => void
  setPhase: (phase: GamePhase) => void

  // Navigation
  goToMenu: () => void
  quickRestart: () => void
}
```

每个 action 调用 `GameEngine` 的纯函数，更新 store 中的 `game` 快照。

`confirmPlay` 流程:
1. 设 phase = 'thinking'
2. 调用 `executeRound(game)` 获得 results
3. 设 phase = 'result', 存 results
4. 更新所有玩家 scores

`nextRound` 流程:
1. 调用 `dealNewCards(game)`
2. round++, phase = 'round-splash'

- [ ] **Step 2: Commit**

```bash
git add src/store/useGameStore.ts && git commit -m "feat: Zustand game store with all actions"
```

---

### Task 8: 基础三屏幕 + 可玩闭环

**Files:**
- Create: `src/components/screens/MenuScreen.tsx`
- Create: `src/components/screens/GameScreen.tsx`
- Create: `src/components/screens/GameOverScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建 MenuScreen.tsx**

从 `poker.html` 菜单还原功能:
- 人数选择（2-8 人按钮组）
- 输家名次选择（动态）
- Ante 输入
- 赔率预览表格
- 开始游戏按钮

用 Tailwind 类名构建，先不追求视觉完美，确保功能完整。

- [ ] **Step 2: 创建 GameScreen.tsx（基础版）**

最低限度可玩:
- 显示回合/倍率信息
- 显示 4 张公共底牌（第4张暗牌）
- 显示玩家手牌（可点击选中）
- 显示 AI 对手名字+分数
- 确认出牌按钮
- 结算后显示结果 + 下一轮按钮
- 第5轮后跳转结算

此步不需要动画、不需要环形座位、不需要春日主题。纯功能性 UI。

- [ ] **Step 3: 创建 GameOverScreen.tsx**

- 排名列表（分数排序）
- 各轮明细表格
- 同配置再来 / 返回菜单按钮

- [ ] **Step 4: 修改 App.tsx 切换屏幕**

```tsx
import { useGameStore } from './store/useGameStore'
import MenuScreen from './components/screens/MenuScreen'
import GameScreen from './components/screens/GameScreen'
import GameOverScreen from './components/screens/GameOverScreen'

export default function App() {
  const screen = useGameStore(s => s.screen)
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {screen === 'menu' && <MenuScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'gameover' && <GameOverScreen />}
    </div>
  )
}
```

- [ ] **Step 5: 端到端验证**

启动 `npm run dev`，完整走一遍:
1. 菜单选 4 人、第 2 名输、ante=1 → 开始
2. 第1轮选 2 张牌 → 确认 → 看到结算 → 下一轮
3. 重复到第5轮
4. 结算页面显示完整数据
5. 同配置再来/返回菜单都能正常工作

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: basic 3-screen playable loop (Day 1 P0 complete)"
```

---

## Chunk 2: 视觉主题 + 环形座位 + 核心组件（Day 2 P0）

目标：春日足球场主题牌桌、椭圆环形座位、精美卡牌组件、核心动画。

### Task 9: 春日主题色彩系统

**Files:**
- Create: `src/styles/theme.ts`
- Modify: `tailwind.config.ts`（如需自定义颜色）

- [ ] **Step 1: 创建 theme.ts**

按设计规格实现 `springTheme` 色彩对象，导出所有颜色常量。同时导出 CSS 变量注入函数或直接在 `index.css` 中定义 `:root` 变量。

- [ ] **Step 2: 更新全局背景**

`App.tsx` 和 `index.css` 应用深色草地背景渐变，替换纯 slate-900。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: spring football theme color system"
```

---

### Task 10: PokerTable 牌桌组件

**Files:**
- Create: `src/components/table/PokerTable.tsx`

- [ ] **Step 1: 实现春日足球场牌桌**

用 CSS 实现:
- 椭圆形牌桌（`border-radius: 50%`）
- 交替明暗草坪条纹（`repeating-linear-gradient`）
- 白色椭圆边线（`border` 或 `box-shadow`）
- 中圈标记（公共牌区域）
- 四角角旗装饰（CSS pseudo-elements 或小 div）
- 外层阴影营造立体感

- [ ] **Step 2: 添加樱花飘落粒子**

用纯 CSS `@keyframes` 实现 15-20 个飘落的粉色小元素，absolute 定位在牌桌范围内，性能开销低。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: spring football field poker table"
```

---

### Task 11: 环形座位布局

**Files:**
- Create: `src/utils/geometry.ts`
- Create: `src/components/table/SeatRing.tsx`
- Create: `src/components/table/Seat.tsx`

- [ ] **Step 1: 实现 geometry.ts**

按设计规格实现 `getSeatPositions(totalPlayers)` 函数，含 2 人局特殊处理。返回百分比坐标数组。

- [ ] **Step 2: 实现 Seat.tsx**

单个座位组件:
- 头像（emoji 圆形）
- 名字标签
- 风格标签（可选，手机端隐藏）
- 分数显示（绿色/红色）
- 手牌数量 badge
- 结算时显示：出牌、牌型、排名、得分变化

用 Framer Motion `motion.div` 包裹，后续加 `layout` 动画。

- [ ] **Step 3: 实现 SeatRing.tsx**

遍历 AI 玩家，用 `getSeatPositions` 计算位置，绝对定位到 PokerTable 上。

- [ ] **Step 4: 集成到 GameScreen**

替换 GameScreen 中的简单 AI 列表为 PokerTable + SeatRing。

- [ ] **Step 5: 验证各人数布局**

切换 2/3/4/5/6/7/8 人局，验证座位均匀分布在椭圆上方弧线。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: elliptical seat ring layout around poker table"
```

---

### Task 12: PlayingCard 组件

**Files:**
- Create: `src/components/cards/PlayingCard.tsx`

**Source reference:** `poker.html` `mkCard` 函数 (lines 1031-1044) + CSS (lines 389-451)

- [ ] **Step 1: 实现 PlayingCard.tsx**

Props:
```typescript
interface PlayingCardProps {
  card: Card
  faceDown?: boolean
  selectable?: boolean
  selected?: boolean
  disabled?: boolean
  isCommunity?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'  // 对应不同尺寸
  onClick?: () => void
  className?: string
}
```

功能:
- 牌面：左上右下角 rank+suit，中央大 suit/王标记
- 牌背：绿色+金色配色（呼应主题），菱形纹理
- 红/黑花色颜色
- 大小王特殊显示
- 3D 翻转用 CSS `transform-style: preserve-3d` + `backface-visibility: hidden`
- 选中状态：金色 `box-shadow` 脉冲 + 微放大
- 尺寸变体：xs(20x28) sm(48x68) md(60x85) lg(72x102)
  - 与规格断点对应：手机用 sm、平板用 md、桌面用 lg

用 Tailwind 类名构建，牌面纸质纹理用 `bg-gradient` 模拟。

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: PlayingCard component with spring theme card back"
```

---

### Task 13: CardHand + CommunityCards

**Files:**
- Create: `src/components/cards/CardHand.tsx`
- Create: `src/components/table/CommunityCards.tsx`

- [ ] **Step 1: 实现 CardHand.tsx**

玩家手牌区域:
- 水平排列手牌
- 可点击选中（最多 2 张）
- 选中的牌上浮 + 金色高亮
- 结算阶段显示出牌组合 + 剩余牌（灰化）
- 第 5 轮直接展示 3 张牌
- 移动端牌多时支持水平滚动容器（`overflow-x: auto` + `flex-nowrap`）

- [ ] **Step 2: 实现 CommunityCards.tsx**

公共底牌区域（牌桌中央）:
- 4 张牌水平排列
- 第 4 张暗牌（faceDown）直到第 4 轮
- 当前轮对应的底牌高亮（金色边框 + 放大）
- 已用过的底牌灰化 + 缩小
- 各底牌上方标签："底牌1", "底牌2" 等

- [ ] **Step 3: 集成到 GameScreen**

替换 GameScreen 中的简单牌面显示。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: CardHand + CommunityCards components"
```

---

### Task 14: HUD 组件

**Files:**
- Create: `src/components/hud/TopBar.tsx`
- Create: `src/components/hud/MultiplierBar.tsx`
- Create: `src/components/hud/ActionBar.tsx`
- Create: `src/components/hud/HandPreview.tsx`

- [ ] **Step 1: TopBar — 回合信息 + 帮助按钮**

显示: 当前轮次、倍率、输家名次、帮助按钮（弹出规则说明 modal）。

- [ ] **Step 2: MultiplierBar — 倍率进度条**

5 个步骤（×1 到 ×16），当前步骤高亮 + 呼吸光效，已完成步骤打勾，颜色从绿到红渐变。

- [ ] **Step 3: ActionBar — 操作按钮区**

- 玩家信息（头像+名字+分数）
- select 阶段: "确认出牌" 按钮（选够 2 张才可点）
- result 阶段: "下一轮" 或 "查看结果" 按钮
- 第 5 轮 select: "亮牌！" 按钮

- [ ] **Step 4: HandPreview — 牌型预览**

选中 2 张牌时实时预览: 牌型名称 + 参考排名。调用 `evalHand` 和 `estimateRank`（从原型迁移 `estimateRank` 函数到 `src/game/evaluate.ts`）。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: HUD components (TopBar, MultiplierBar, ActionBar, HandPreview)"
```

---

### Task 15: 完整 GameScreen 集成 + 响应式

**Files:**
- Modify: `src/components/screens/GameScreen.tsx`
- Create: `src/hooks/useResponsive.ts`

- [ ] **Step 1: 创建 useResponsive hook**

```typescript
export function useResponsive() {
  // 返回 'mobile' | 'tablet' | 'desktop'
  // 基于 window.innerWidth: <640 / 640-1024 / >1024
  // 用 ResizeObserver 或 window resize 事件
}
```

- [ ] **Step 2: 重构 GameScreen 布局**

完整布局:
```
┌─────────────── TopBar ───────────────┐
├───────────── MultiplierBar ──────────┤
│                                      │
│         PokerTable                   │
│    ┌─ SeatRing (AI seats) ─┐        │
│    │                       │        │
│    │   CommunityCards      │        │
│    │                       │        │
│    └───────────────────────┘        │
│                                      │
├───────────── CardHand ───────────────┤
├───────────── HandPreview ────────────┤
├───────────── ActionBar ──────────────┘
```

移动端: 牌桌占满宽度，底部操作区固定定位。
桌面端: 牌桌居中，最大宽度 800px。

- [ ] **Step 3: 端到端验证**

完整游戏流程 + Chrome DevTools 切换到 iPhone/iPad 视口验证。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: full GameScreen layout with responsive design"
```

---

## Chunk 3: 动画系统 + AI 升级 + 部署（Day 2 P0 + Day 3）

目标：所有核心动画、输赢特效、AI 策略增强、Vercel 部署。

### Task 16: 卡牌核心动画

**Files:**
- Modify: `src/components/cards/PlayingCard.tsx`
- Modify: `src/components/cards/CardHand.tsx`
- Modify: `src/components/table/CommunityCards.tsx`

使用 `@agents/skills/framer-motion-animator` 和 `@agents/skills/animate` 指导动画实现。

- [ ] **Step 1: 发牌飞入动画**

用 Framer Motion `motion.div` + `initial/animate`:
- initial: `{ opacity: 0, y: -100, scale: 0.5, rotate: -6 }`
- animate: `{ opacity: 1, y: 0, scale: 1, rotate: 0 }`
- transition: `{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.1 }`

CardHand 中每张牌 stagger 延迟入场。

- [ ] **Step 2: 选牌动画**

选中: `{ y: -16, scale: 1.08 }` + 金色 `boxShadow` 脉冲（CSS animation）
取消: spring 弹回原位

- [ ] **Step 3: 翻牌 3D 动画**

PlayingCard 的 `faceDown` prop 变化时:
```tsx
<motion.div
  animate={{ rotateY: faceDown ? 180 : 0 }}
  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
  style={{ transformStyle: 'preserve-3d' }}
>
```

- [ ] **Step 4: 出牌飞出 + 剩余牌收拢**

确认出牌后:
- 选中的牌 `animate` 到 `{ y: -200, scale: 0.5, opacity: 0 }`
- CardHand 使用 `AnimatePresence` + `layout` 让剩余牌平滑收拢

- [ ] **Step 5: 补牌飞入**

新牌用 `initial={{ y: -80, opacity: 0, rotate: -4 }}` 飞入，带特殊高亮闪烁。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: card animations (deal, select, flip, play, draw)"
```

---

### Task 17: 输赢特效

**Files:**
- Create: `src/components/fx/WinCelebration.tsx`
- Create: `src/components/fx/LoseEffect.tsx`
- Create: `src/components/fx/ParticleSystem.tsx`

使用 `@agents/skills/animate` 和 `@agents/skills/polish` 指导实现。

- [ ] **Step 1: ParticleSystem — 纸屑粒子**

Canvas 或纯 CSS 实现的粒子系统:
- 颜色: 绿/金/白/粉（春天配色）
- 从屏幕顶部落下
- 随机大小（4-8px）、随机旋转、随机速度
- 支持 density 参数（普通赢/大赢不同密度）
- `prefers-reduced-motion` 时不渲染

- [ ] **Step 2: WinCelebration**

赢牌时触发:
- 组合牌金色边框脉冲: CSS `@keyframes` animation `boxShadow` 呼吸
- 粒子雨: 渲染 `<ParticleSystem density={isJackpot ? 'high' : 'normal'} />`
- 分数 `+XX` 浮动文字: `motion.span` 从分数位置 `{ y: 0, opacity: 1 }` → `{ y: -30, opacity: 0 }`
- 大赢判定: `round >= 2 && rank === 1`（x4 以上且第一名）
- 大赢额外: 全屏金色 radial-gradient flash + CSS shake

- [ ] **Step 3: LoseEffect**

输牌时触发:
- 红色 vignette: 全屏 absolute div, `box-shadow: inset 0 0 100px rgba(248,113,113,0.4)`, 闪烁后淡出
- 屏幕微震: `motion.div` wrapping game area, `animate={{ x: [0,3,-3,2,-2,0] }}` duration 150ms
- 分数 `-XX` 红色浮动 + 抖动: `animate={{ x: [0,2,-2,1,-1,0] }}`

- [ ] **Step 4: 集成到 result phase**

GameScreen 的 result phase 根据玩家排名渲染对应特效。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: win celebration + lose effect + particle system"
```

---

### Task 18: 回合过渡动画

**Files:**
- Create: `src/components/fx/RoundSplash.tsx`
- Create: `src/components/fx/FlipReveal.tsx`

- [ ] **Step 1: RoundSplash — 回合开场**

全屏 overlay:
- 背景: `bg-black/75 backdrop-blur-sm`
- "第X轮" 小字从上方滑入
- 倍率数字（×1/×2/×4/×8/×16）从 scale(0.3) 弹出到 scale(1)，spring 动画
- 颜色随轮次: 绿→黄→橙→红→深红
- 持续 1.2 秒后淡出

- [ ] **Step 2: FlipReveal — 第4轮暗牌揭示**

全屏 overlay:
- "暗牌揭晓" 标题
- 倒计时 3→2→1 数字（每 600ms 切换）
- 聚光灯效果：用 `radial-gradient` 在牌位置创建圆形高亮区域，其余区域暗化
- 大尺寸牌从背面翻转到正面（3D rotateY）
- 翻开后停顿 1.2 秒让玩家看清

- [ ] **Step 3: 最终轮全员亮牌动画**

第 5 轮特殊处理:
- 所有 AI 座位的手牌同时从 faceDown 翻转为 faceUp（扇形展开）
- 每个座位 stagger 延迟 0.15s
- 翻转后暂停 1.5s 让玩家浏览全场牌面，再进入结算

- [ ] **Step 4: 集成 phase 流转**

在 store 中管理 phase 切换的 timing:
- `confirmPlay` → phase: thinking(600ms) → result
- `nextRound` → phase: dealing(补牌飞入动画 800ms) → round-splash(1200ms) → select
- 第4轮 confirm → phase: flip-reveal(3000ms) → thinking → result
- 第5轮 confirm → phase: thinking(300ms) → 全员亮牌(1500ms) → result

`dealing` 阶段：补牌飞入动画期间显示，动画完成后自动推进到 `round-splash`。

用 `setTimeout` 在 store actions 中控制 phase 流转。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: round splash + flip reveal animations"
```

---

### Task 19: 微交互 + AnimatePresence

**Files:**
- Modify: 多个组件

- [ ] **Step 1: 按钮交互**

所有按钮包裹 `motion.button`:
- `whileHover={{ scale: 1.03 }}`
- `whileTap={{ scale: 0.97 }}`

- [ ] **Step 2: 倍率进度条呼吸光效**

当前活跃步骤: CSS `@keyframes` 脉冲 `box-shadow`。

- [ ] **Step 3: 分数数字滚动**

分数变化时用 `useSpring` 或 `useMotionValue` 从旧值动画到新值。

- [ ] **Step 4: 屏幕切换动画**

`App.tsx` 中用 `AnimatePresence` + `mode="wait"`:
```tsx
<AnimatePresence mode="wait">
  {screen === 'menu' && <motion.div key="menu" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><MenuScreen /></motion.div>}
  ...
</AnimatePresence>
```

- [ ] **Step 5: AI 座位表情反应**

结算时 AI 座位冒出表情: `motion.span` pop in from scale(0.3) + translateY。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: micro-interactions, AnimatePresence, score animations"
```

---

### Task 20: AI 策略升级

**Files:**
- Modify: `src/game/ai.ts`
- Modify: `src/game/evaluate.ts`（添加 estimateWinRate）

- [ ] **Step 1: 迁移 estimateRank 并增强为 estimateWinRate**

从 `poker.html` lines 878-905 迁移 `estimateRank`，然后扩展:

```typescript
export function estimateWinRate(
  hand: Card[],
  selectedIndices: [number, number],
  communityCard: Card | null,
  allCommunity: Card[],
  totalPlayers: number,
  samples: number = 50
): number  // 返回预期排名（1=最好）
```

- [ ] **Step 2: 升级 AI 策略（与规格逐条对齐）**

按设计规格表升级:
- **算命（计算）**: 接入 `estimateWinRate`，用蒙特卡洛模拟选择预期排名最优的出牌方案
- **狐狸（保守）**: 加入排名感知自救 — 累计排名接近输家名次时切换为激进模式，此时也调用 `estimateWinRate`
- **赌神（激进）**: 保留王+A+同花组合到 x8/x16 轮（不使用蒙特卡洛，纯规则逻辑）
- **疯子（随机）**: 10% 概率打最优解（调用 `aiPickSteady`）

注意: `estimateWinRate` 仅在 select phase 被算命和狐狸（自救模式）使用。

- [ ] **Step 3: 验证 AI 行为变化**

跑几局 8 人游戏，在控制台 log AI 决策过程，确认策略变化可感知。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: AI strategy upgrades (aggressive, conservative, random)"
```

---

### Task 21: 移动端适配打磨

**Files:**
- Modify: 多个组件

使用 `@agents/skills/adapt` 指导响应式实现。

- [ ] **Step 1: 卡牌尺寸响应式**

`PlayingCard` 根据 `useResponsive()` 返回的断点自动选择尺寸:
- mobile: `sm` (48x68px)
- tablet: `md` (60x85px)
- desktop: `lg` (72x102px)

- [ ] **Step 2: 座位移动端精简**

mobile 断点:
- 隐藏风格标签
- 缩小头像
- 只显示 emoji + 分数

- [ ] **Step 3: 底部操作区固定**

`ActionBar` + `CardHand` 用 `fixed bottom-0` 定位，加 `safe-area-inset-bottom` padding。

- [ ] **Step 4: 触控优化**

所有可点击元素 `min-w-[44px] min-h-[44px]`。卡牌点击区域加 padding。

- [ ] **Step 5: 横屏建议**

检测 `window.innerHeight > window.innerWidth` 且宽度 < 640px 时，显示一个温和的横屏提示条（不强制，可关闭）:
"横屏体验更佳" + 旋转图标，3 秒后自动淡出，关闭后用 sessionStorage 记住不再提示。

- [ ] **Step 6: 验证**

Chrome DevTools 模拟 iPhone SE / iPhone 14 Pro / iPad，完整走一遍游戏流程。

- [ ] **Step 7: 规则对等性核对**

对照 `游戏规则.md` 逐条验证:
- [ ] 108 张牌（2 副 + 4 王）
- [ ] 2-8 人局可选
- [ ] 输家名次选择（第 2 ~ 第 N-1 名，第 1 和最后不输）
- [ ] 4 底牌（3 明 1 暗）+ 每人 5 手牌
- [ ] 5 轮流程倍率正确
- [ ] 前 3 轮补 2 张，第 4 轮不补
- [ ] 牌型排序正确
- [ ] 赔率零和
- [ ] 大小王万能牌
- [ ] 花色大小 ♠>♥>♣>♦

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: mobile-first responsive polish"
```

---

### Task 22: 音效系统（P1）

**Files:**
- Create: `src/hooks/useSound.ts`
- Create: `public/sounds/` (placeholder)

- [ ] **Step 1: 实现 useSound hook**

```typescript
export function useSound() {
  return {
    playDeal: () => void,
    playFlip: () => void,
    playSelect: () => void,
    playConfirm: () => void,
    playWin: () => void,
    playLose: () => void,
    playRound: () => void,
    playClick: () => void,
    toggleMute: () => void,
    isMuted: boolean,
  }
}
```

内部用 Howler.js 加载 `public/sounds/*.mp3`。try/catch 包裹，文件缺失时静默降级。mute 状态存 localStorage。

**注意**: 音效文件可以用在线免费音效资源（freesound.org）下载，或先用空的 placeholder，游戏可以无音效运行。

- [ ] **Step 2: 在关键交互点调用**

- 发牌 → `playDeal()`
- 翻牌 → `playFlip()`
- 选牌 → `playSelect()`
- 确认 → `playConfirm()`
- 赢 → `playWin()`
- 输 → `playLose()`

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: sound system with howler.js (P1)"
```

---

### Task 23: 全局 Polish + 性能

**Files:**
- Modify: 多个组件

使用 `@agents/skills/polish`, `@agents/skills/critique`, `@agents/skills/audit` 指导最终打磨。

- [ ] **Step 1: 运行设计审计**

用 `critique` skill 的标准检查:
- 颜色对比度
- 间距一致性
- 字体层级
- 焦点状态

修复发现的问题。

- [ ] **Step 2: 性能降级**

检测低端设备 (`navigator.hardwareConcurrency <= 4`):
- 关闭樱花粒子
- 减少纸屑数量
- 关闭 backdrop-filter blur

`prefers-reduced-motion` 时跳过装饰性动画。

- [ ] **Step 3: MenuScreen 视觉升级**

让菜单页面也用春日主题:
- 标题用金色渐变
- 背景可以有淡淡的草地纹理
- 按钮样式统一

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: design polish + performance degradation"
```

---

### Task 24: Vercel 部署

**Files:**
- 可能创建: `vercel.json`（如需配置）

- [ ] **Step 1: 构建验证**

```bash
npm run build
npx serve dist
```

Expected: 本地 serve 能正常访问并完整游戏。

- [ ] **Step 2: 部署到 Vercel**

```bash
npx vercel --prod
```

或通过 Vercel Dashboard 连接 GitHub repo。

- [ ] **Step 3: 验证线上版本**

访问 Vercel 提供的 URL，在手机和电脑上各走一遍完整游戏流程。

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: vercel deployment ready"
```
