# 分轮倍增赛 (Joson Poker)

多人扑克博弈游戏，5 轮对决、倍率翻倍飙升，只有一个名次输钱。

## 快速开始

```bash
# 需要 Node.js >= 18
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可。

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm run test:e2e` | Playwright 端到端测试 |

## 部署

纯前端项目，无需后端。构建后 `dist/` 目录可直接部署到 Vercel / Netlify / 任意静态托管。

```bash
npm run build
# dist/ 目录即为产物
```

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建
- **Tailwind CSS v4** 样式
- **Zustand** 状态管理
- **Framer Motion** + **GSAP** 动画
- **Howler.js** 音效

## 游戏规则

- 2-8 人局，每人起始 10 张手牌，公共区有 4 张底牌
- 每轮选 2 张手牌 + 1 张底牌组成 3 张牌型，比大小排名
- 5 轮倍率依次为 ×1、×2、×4、×8、×16
- 只有指定的"输家名次"（如第 4 名）承担所有赔付
- 详见 `游戏规则.md`
