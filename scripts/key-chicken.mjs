#!/usr/bin/env node
/**
 * Chroma-key: 把 AI 生成的纯白背景图转成真正 RGBA 透明 PNG。
 *
 * AI 能可靠输出纯白背景（#FFFFFF 附近），这比"画棋盘格透明"容易抠干净得多。
 *
 * 阶段：
 * 1. 全局抠接近纯白的像素
 * 2. 连通域分析，只保留最大块（鸡身）
 * 3. 边缘羽化：把边缘 1 像素的浅灰像素改为半透明，让轮廓平滑不锯齿
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
const N = width * height;

const hasAlpha = src.data.length === N * 4;
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  if (hasAlpha) {
    rgba.set(src.data.subarray(i * 4, i * 4 + 4), i * 4);
  } else {
    rgba[i * 4] = src.data[i * 3];
    rgba[i * 4 + 1] = src.data[i * 3 + 1];
    rgba[i * 4 + 2] = src.data[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
}

/**
 * 判定白色背景（纯白 #FFFFFF 或非常接近）。
 * - 所有通道 >= 244
 * - 极差 <= 8（纯中性白，不是鸡身的米色奶白）
 * 鸡身奶白色通常 R,G,B 在 [215, 240]，且微有暖色调，不会命中。
 */
function isWhiteBg(r, g, b) {
  if (r < 244 || g < 244 || b < 244) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > 8) return false;
  return true;
}

// ---- Pass 1：抠白色背景 ----
let killed1 = 0;
for (let i = 0; i < N; i++) {
  const r = rgba[i * 4];
  const g = rgba[i * 4 + 1];
  const b = rgba[i * 4 + 2];
  if (isWhiteBg(r, g, b)) {
    rgba[i * 4 + 3] = 0;
    killed1++;
  }
}

// ---- Pass 2：连通域分析，保留最大块 ----
const labels = new Int32Array(N).fill(-1);
const sizes = [];
const queue = new Int32Array(N);
for (let start = 0; start < N; start++) {
  if (labels[start] !== -1 || rgba[start * 4 + 3] === 0) continue;
  const label = sizes.length;
  labels[start] = label;
  let head = 0, tail = 0;
  queue[tail++] = start;
  let count = 0;
  while (head < tail) {
    const idx = queue[head++];
    count++;
    const x = idx % width;
    const y = (idx / width) | 0;
    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
    ];
    for (const ni of neighbors) {
      if (ni < 0 || labels[ni] !== -1 || rgba[ni * 4 + 3] === 0) continue;
      labels[ni] = label;
      queue[tail++] = ni;
    }
  }
  sizes.push(count);
}

let maxLabel = -1, maxSize = 0;
for (let i = 0; i < sizes.length; i++) {
  if (sizes[i] > maxSize) { maxSize = sizes[i]; maxLabel = i; }
}

let killed2 = 0;
for (let i = 0; i < N; i++) {
  if (rgba[i * 4 + 3] === 0) continue;
  if (labels[i] !== maxLabel) {
    rgba[i * 4 + 3] = 0;
    killed2++;
  }
}

// ---- Pass 3：边缘半透明羽化（反锯齿 + 平滑）----
// 边界处被 anti-alias 后的像素（白色和鸡身色混合，如 R=248, G=246, B=235）
// 卡在 [220, 244] 区间既不完全背景也不完全鸡身。让它们保留颜色但降低 alpha。
let softened = 0;
const snap = Buffer.from(rgba);
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const idx = y * width + x;
    if (snap[idx * 4 + 3] === 0) continue;
    const hasTransparentNeighbor =
      snap[(idx - 1) * 4 + 3] === 0 ||
      snap[(idx + 1) * 4 + 3] === 0 ||
      snap[(idx - width) * 4 + 3] === 0 ||
      snap[(idx + width) * 4 + 3] === 0;
    if (!hasTransparentNeighbor) continue;
    const r = snap[idx * 4];
    const g = snap[idx * 4 + 1];
    const b = snap[idx * 4 + 2];
    // 边缘像素如果亮度非常高（接近白色）→ 说明是抗锯齿过渡，降 alpha
    const brightness = (r + g + b) / 3;
    if (brightness >= 230) {
      // 越接近纯白，alpha 越低
      const t = Math.min(1, (brightness - 230) / 14); // 230→0, 244→1
      rgba[idx * 4 + 3] = Math.round(255 * (1 - t * 0.85));
      softened++;
    }
  }
}

const out = new PNG({ width, height, colorType: 6 });
out.data = rgba;
fs.writeFileSync(dstPath, PNG.sync.write(out));
console.log(
  `✓ wrote ${dstPath} (${width}x${height}, RGBA)\n` +
    `  pass1 white bg = ${killed1}\n` +
    `  pass2 islands  = ${killed2} (body = ${maxSize} px)\n` +
    `  pass3 softened = ${softened}`,
);
