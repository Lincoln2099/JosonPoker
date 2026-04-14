# 分轮倍增赛 React 重构设计规格

## 概述

将现有的单文件 HTML 原型（`poker.html`，~1500 行）重构为模块化的 React 项目，以参加比赛并部署到 Vercel。重点提升动画流畅度、视觉设计感、移动端适配和 AI 策略深度。

## 约束

- **时间**：3 天
- **无后端**：纯前端静态站点
- **部署**：Vercel
- **优先级**：丝滑动画 > 移动端适配 > 精美 UI > AI 智能
- **设计 Skills**：Impeccable（polish/critique/animate/adapt/audit）、Framer Motion Animator、Tailwind CSS、Frontend Design Pro、Game Development

---

## 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| Vite | latest | 构建工具 |
| React | 18+ | UI 框架 |
| TypeScript | 5+ | 类型安全 |
| Zustand | latest | 状态管理 |
| Framer Motion | latest | 动画引擎 |
| Tailwind CSS | 4+ | 样式系统 |
| Howler.js | latest | 音效 |

---

## 项目结构

```
joson-poker/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── game/                       # 纯游戏逻辑（零 UI 依赖）
│   │   ├── Card.ts                 # Card 类、SUITS、RANKS 等常量
│   │   ├── Deck.ts                 # 洗牌、发牌
│   │   ├── evaluate.ts             # evalHand, evalRaw, cmpEval
│   │   ├── payout.ts              # calcWeights, calcPayouts, distributeEvenly
│   │   ├── ai.ts                   # 7 种 AI 策略 + aiPick 调度
│   │   └── GameEngine.ts           # 游戏状态机：initGame, doRound, dealCards
│   ├── store/
│   │   └── useGameStore.ts         # Zustand 全局状态
│   ├── components/
│   │   ├── screens/
│   │   │   ├── MenuScreen.tsx      # 主菜单
│   │   │   ├── GameScreen.tsx      # 游戏主界面
│   │   │   └── GameOverScreen.tsx  # 结算画面
│   │   ├── table/
│   │   │   ├── PokerTable.tsx      # 牌桌（春日足球场主题）
│   │   │   ├── SeatRing.tsx        # 环形座位布局
│   │   │   ├── Seat.tsx            # 单个座位（玩家/AI）
│   │   │   └── CommunityCards.tsx  # 公共底牌区
│   │   ├── cards/
│   │   │   ├── PlayingCard.tsx     # 单张牌（含翻转3D动画）
│   │   │   └── CardHand.tsx        # 手牌排列
│   │   ├── hud/
│   │   │   ├── TopBar.tsx          # 回合信息、分数
│   │   │   ├── MultiplierBar.tsx   # 倍率进度条
│   │   │   ├── ActionBar.tsx       # 操作按钮
│   │   │   └── HandPreview.tsx     # 牌型预览
│   │   └── fx/
│   │       ├── WinCelebration.tsx  # 赢牌庆祝动画
│   │       ├── LoseEffect.tsx      # 输牌效果
│   │       ├── RoundSplash.tsx     # 回合切换动画
│   │       ├── FlipReveal.tsx      # 暗牌揭示动画
│   │       └── ParticleSystem.tsx  # 粒子特效
│   ├── hooks/
│   │   ├── useSound.ts            # 音效管理
│   │   └── useResponsive.ts       # 响应式断点
│   ├── styles/
│   │   └── theme.ts               # 春日主题色彩系统
│   └── utils/
│       └── geometry.ts            # 环形座位坐标计算
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

**关键设计决策**：`src/game/` 是纯 TypeScript 逻辑层，零 React 依赖。现有原型的核心逻辑（Card、Deck、evalHand、AI 策略）几乎原样迁入，只加类型标注。UI 层通过 Zustand store 读写游戏状态。

---

## 视觉主题：春日足球场

抛弃暗红赌场风格，用春日足球场俯视图概念作为牌桌。

### 色彩系统

```typescript
const springTheme = {
  // 主色 — 足球场草地
  field:       '#2d8a4e',   // 草坪绿
  fieldLight:  '#3da760',   // 浅草绿（条纹交替）
  fieldDark:   '#1e6b38',   // 深草绿（阴影）

  // 边线与标记
  chalk:       '#ffffff',   // 白色边线
  chalkFaded:  'rgba(255,255,255,0.15)',

  // 春天点缀
  sakura:      '#ffb7c5',   // 樱花粉
  sky:         '#87ceeb',   // 天空蓝
  sunlight:    '#ffd700',   // 阳光金

  // 功能色
  win:         '#4ade80',   // 赢 — 明亮绿
  lose:        '#f87171',   // 输 — 柔和红
  gold:        '#fbbf24',   // 强调/倍率

  // 卡牌
  cardWhite:   '#fefefe',
  suitRed:     '#dc2626',
  suitBlack:   '#1e293b',

  // 背景
  bgDeep:      '#0f1923',
  bgMid:       '#1a2e1a',
}
```

### 牌桌设计（PokerTable.tsx）

- CSS 渐变模拟交替明暗草皮条纹
- 椭圆形白线围出"球场"范围，中圈位置放公共牌
- 四角有角旗标记装饰
- 牌桌周围持续飘落的樱花瓣粒子（轻量 CSS 动画）
- 白色+浅绿干净边线风格替代暗红木质边框

### 卡牌风格

- 牌面带微妙纸质纹理（CSS noise）
- 牌背改为绿色+金色配色呼应主题
- 选中状态：金色光晕脉冲 + 微放大
- 大小王用特殊渐变背景

---

## 环形座位布局

### 算法

玩家固定在椭圆底部（6点钟方向），AI 对手沿椭圆上半弧均匀分布。

```typescript
function getSeatPositions(totalPlayers: number) {
  const seats = []
  seats.push({ x: 50, y: 92, angle: 0 }) // 玩家固定底部

  const aiCount = totalPlayers - 1
  for (let i = 0; i < aiCount; i++) {
    const startAngle = 210 // 左下
    const endAngle = 330   // 右下
    const angle = startAngle + (endAngle - startAngle) * i / (aiCount - 1 || 1)
    const rad = (angle * Math.PI) / 180
    const x = 50 + 42 * Math.cos(rad)
    const y = 48 + 35 * Math.sin(rad)
    seats.push({ x, y, angle })
  }
  return seats
}
```

### 座位组件

每个座位包含：头像（emoji）、名字、风格标签、分数、手牌缩略图或结果展示。用 Framer Motion `layout` 属性让座位在人数变化时平滑过渡位置。

---

## 动画系统

核心原则：**越灵动越好**。用 Framer Motion 作为主引擎，配合 CSS 实现粒子/背景效果。

### 卡牌动画

| 场景 | 效果 |
|------|------|
| 发牌 | 牌从牌桌中央飞出，带旋转+缩放，stagger 延迟入手，到手后弹跳 |
| 翻牌（3D） | rotateY(180deg) 真实翻转 + 阴影变化，暗牌加聚光灯效果 |
| 选牌 | 金色光晕脉冲 + 上浮 + 缩放 1.08，取消时弹回 |
| 出牌 | 牌飞向牌桌中央出牌区，缩小+淡入，剩余牌自动收拢（layout 动画） |
| 补牌 | 新牌从牌堆飞入手中，轻微旋转，落位后高亮闪烁 |

### 输赢特效

**赢牌时：**
- 组合牌金色边框脉冲发光
- 屏幕顶部彩色纸屑粒子雨（绿/金/白春天配色）
- 分数数字弹跳放大 + 飘出 `+XX` 绿色浮动文字
- 大赢（高倍率+第1名）：全屏金色光芒爆发 + 震动 + 粒子密度加倍

**输牌时：**
- 牌灰度化 + 下沉
- 屏幕边缘红色闪烁 vignette（暗角）
- 分数飘出 `-XX` 红色浮动文字 + 数字抖动效果
- 短暂屏幕微震（translateX 随机抖动 150ms）

**其他玩家：**
- AI 赢了：头顶表情 + 座位边框绿色光晕
- AI 输了：座位红色闪烁 + 愤怒表情

### 回合过渡

| 场景 | 效果 |
|------|------|
| 回合开始 | 全屏遮罩 + 倍率数字从小弹出，颜色随倍率升级 |
| 暗牌揭示（第4轮） | 倒计时 3-2-1 + 聚光灯 + 翻转 + 停顿 |
| 最终轮 | 所有玩家手牌同时翻开，扇形展开 |

### 微交互

- 按钮 hover/press 缩放 + 阴影变化
- 倍率进度条当前步骤呼吸光效
- 分数变化时数字滚动（count up/down）
- 牌桌樱花瓣持续飘落（CSS @keyframes）
- 页面切换使用 AnimatePresence 进出动画

---

## AI 策略升级

### 核心新增：estimateWinRate()

用快速蒙特卡洛模拟（50次采样）评估每种出牌方案的预期排名。

### 各 AI 升级方向

| AI | 升级 |
|----|------|
| 庄家（稳健） | 加入手牌潜力评估，差一张成强牌型时保留 |
| 赌神（激进） | 保留所有高价值牌（王+A+同花组合）到 x8/x16 轮 |
| 狐狸（保守） | 排名感知——接近输家名次时策略变激进自救 |
| 算命（计算） | 蒙特卡洛模拟估算出牌胜率 |
| 老千（反向） | 名次追踪——动态调整，始终远离输家名次 |
| 疯子（随机） | 保持随机，10% 概率打出最优解 |
| 新手（简单） | 学习曲线——后面轮次比前面稍微聪明 |

---

## 移动端适配

采用 Mobile-First 设计，三个断点。

### 断点

| 断点 | 布局 |
|------|------|
| <640px（手机） | 牌桌满屏，座位紧贴边缘，卡牌 48x68px，按钮全宽 |
| 640-1024px（平板） | 牌桌居中，卡牌 60x85px |
| >1024px（桌面） | 完整布局，卡牌 72x102px |

### 手机端优化

- 手牌支持左右滑动浏览
- 点击选牌（不用拖拽）
- AI 座位只显示 emoji + 分数
- 底部操作区固定不滚动
- 温和的横屏建议（不强制）

---

## 音效设计

使用 Howler.js，所有音效为短促 Web Audio：

| 场景 | 音效 |
|------|------|
| 发牌 | 清脆的 "刷" 声 |
| 翻牌 | 纸牌翻转 "啪" 声 |
| 选牌 | 轻柔的 "叮" 声 |
| 出牌确认 | 干脆的 "嗒" 声 |
| 赢牌 | 欢快的金币/铃铛音效 |
| 输牌 | 低沉的 "嗡" 声 |
| 回合切换 | 鼓点/号角声 |
| 按钮点击 | 轻微的 "咔" 声 |

音效可通过设置页面开关控制。

---

## 游戏流程状态机

```
MenuScreen
  ↓ [开始游戏]
GameScreen
  ├─ phase: 'round-splash'  → 显示回合动画
  ├─ phase: 'flip-reveal'   → 第4轮暗牌揭示
  ├─ phase: 'select'        → 玩家选牌
  ├─ phase: 'thinking'      → AI 思考动画
  ├─ phase: 'result'        → 结算动画 + 输赢特效
  └─ phase: 'dealing'       → 补牌动画
  ↓ [5轮结束]
GameOverScreen
  ├─ [同配置再来] → GameScreen
  └─ [返回菜单]   → MenuScreen
```

---

## 部署

- `vite build` 输出到 `dist/`
- Vercel 自动检测 Vite 项目
- 无需额外配置
