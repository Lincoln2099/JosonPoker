#!/usr/bin/env node
/**
 * Chroma-key utility: AI 图像模型不会输出 alpha 通道，却把"透明背景"画成了实际的
 * 黑白棋盘格像素。此脚本把这些棋盘格灰像素抠掉，输出真正 RGBA PNG。
 *
 * 实现：
 * 1. 读 RGB PNG，扩展为 RGBA
 * 2. 全局扫描每个像素；若满足"严格中性灰"的棋盘格像素特征 → 设 alpha = 0
 *    （不使用 flood-fill，因为鸡身内部可能有被包围的棋盘格口袋）
 * 3. 为避免把鸡身上的中性阴影误判，阈值收得很紧（max-min ≤ 4）
 * 4. 不做边缘羽化，避免残留半透明灰点
 *
 * 用法: node scripts/key-chicken.mjs <src> <dst>
 */
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const [, , srcPath, dstPath] = process.argv;
if (!srcPath || !dstPath) {
  console.error('Usage: node scripts/key-chicken.mjs <src> <dst>');
  process.exit(1);
}

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width, height } = src;

const hasAlpha = src.data.length === width * height * 4;
const rgba = Buffer.alloc(width * height * 4);

for (let i = 0; i < width * height; i++) {
  if (hasAlpha) {
    rgba[i * 4] = src.data[i * 4];
    rgba[i * 4 + 1] = src.data[i * 4 + 1];
    rgba[i * 4 + 2] = src.data[i * 4 + 2];
    rgba[i * 4 + 3] = src.data[i * 4 + 3];
  } else {
    rgba[i * 4] = src.data[i * 3];
    rgba[i * 4 + 1] = src.data[i * 3 + 1];
    rgba[i * 4 + 2] = src.data[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
}

/**
 * 判断一个像素是否属于棋盘格背景。
 * 棋盘格特征：严格中性灰 + 值域在棋盘两种灰的范围。
 * - R/G/B 三通道极差 ≤ 4（严格纯灰，排除任何有色调的阴影）
 * - 亮度在 [120, 210]（棋盘的深灰 ~128 和浅灰 ~192）
 * 鸡身的白色（~240+）、棕色翅膀（R>G>B）、红冠（R>>G,B）、黄喙等都不会命中。
 */
function isCheckerBg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > 4) return false;
  if (r < 120 || r > 210) return false;
  return true;
}

// 全局扫描：每个像素独立判断（不依赖连通性）
let killed = 0;
for (let i = 0; i < width * height; i++) {
  const r = rgba[i * 4];
  const g = rgba[i * 4 + 1];
  const b = rgba[i * 4 + 2];
  if (isCheckerBg(r, g, b)) {
    rgba[i * 4 + 3] = 0;
    killed++;
  }
}

/**
 * 抗锯齿清理：鸡身边缘如果残留零星透明像素（被抠错的杂色点）补回来。
 * 规则：如果一个透明像素的 8 邻域里有 ≥ 6 个不透明且有颜色的像素，
 * 说明它是鸡身内部误抠，恢复为不透明。
 */
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const idx = y * width + x;
    if (rgba[idx * 4 + 3] !== 0) continue;
    let opaqueCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ni = (y + dy) * width + (x + dx);
        if (rgba[ni * 4 + 3] !== 0) opaqueCount++;
      }
    }
    if (opaqueCount >= 7) {
      // 被不透明邻居完全包围，恢复。颜色取邻居平均
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ni = (y + dy) * width + (x + dx);
          if (rgba[ni * 4 + 3] !== 0) {
            sr += rgba[ni * 4];
            sg += rgba[ni * 4 + 1];
            sb += rgba[ni * 4 + 2];
            n++;
          }
        }
      }
      rgba[idx * 4] = (sr / n) | 0;
      rgba[idx * 4 + 1] = (sg / n) | 0;
      rgba[idx * 4 + 2] = (sb / n) | 0;
      rgba[idx * 4 + 3] = 255;
    }
  }
}

const out = new PNG({ width, height, colorType: 6 });
out.data = rgba;
fs.writeFileSync(dstPath, PNG.sync.write(out));
console.log(`✓ wrote ${dstPath} (${width}x${height}, RGBA, killed ${killed} checker px)`);
