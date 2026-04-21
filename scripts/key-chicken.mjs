#!/usr/bin/env node
/**
 * Chroma-key utility: take the AI-generated chicken PNG that has a
 * "transparent-checkerboard" drawn as actual pixels, detect those
 * near-neutral-grey pixels from the image edges (flood-fill), and
 * write a new PNG with a true alpha channel.
 *
 * Usage: node scripts/key-chicken.mjs <src> <dst>
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

// 源是 RGB(no alpha)；我们需要输出 RGBA
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

/** 判断一个像素是否属于"棋盘格背景"。
 * 棋盘格特征：近似中性灰（R≈G≈B），且颜色在 [105, 220] 之间（深灰/浅灰方块）。
 */
function isCheckerBg(r, g, b) {
  if (r < 90 || r > 230) return false;
  // 三通道极差 ≤ 8 视为中性灰
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > 10) return false;
  return true;
}

// Flood fill from all edges
const visited = new Uint8Array(width * height);
const queue = [];

function pushEdge(x, y) {
  const idx = y * width + x;
  if (visited[idx]) return;
  const r = rgba[idx * 4];
  const g = rgba[idx * 4 + 1];
  const b = rgba[idx * 4 + 2];
  if (isCheckerBg(r, g, b)) {
    queue.push(idx);
    visited[idx] = 1;
  }
}

for (let x = 0; x < width; x++) {
  pushEdge(x, 0);
  pushEdge(x, height - 1);
}
for (let y = 0; y < height; y++) {
  pushEdge(0, y);
  pushEdge(width - 1, y);
}

let head = 0;
while (head < queue.length) {
  const idx = queue[head++];
  const x = idx % width;
  const y = (idx / width) | 0;
  rgba[idx * 4 + 3] = 0; // set fully transparent
  const neigh = [];
  if (x > 0) neigh.push(idx - 1);
  if (x < width - 1) neigh.push(idx + 1);
  if (y > 0) neigh.push(idx - width);
  if (y < height - 1) neigh.push(idx + width);
  for (const ni of neigh) {
    if (visited[ni]) continue;
    const r = rgba[ni * 4];
    const g = rgba[ni * 4 + 1];
    const b = rgba[ni * 4 + 2];
    if (isCheckerBg(r, g, b)) {
      queue.push(ni);
      visited[ni] = 1;
    }
  }
}

// Soft-edge feathering: any pixel adjacent to a transparent one and still
// close to the neutral-grey threshold → fade alpha to half/quarter.
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (rgba[idx * 4 + 3] !== 255) continue;
    const r = rgba[idx * 4];
    const g = rgba[idx * 4 + 1];
    const b = rgba[idx * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const neutralish = max - min <= 18 && r >= 90 && r <= 230;
    if (!neutralish) continue;
    // 检查是否与已透明像素相邻
    const up = y > 0 ? visited[idx - width] : 0;
    const dn = y < height - 1 ? visited[idx + width] : 0;
    const lt = x > 0 ? visited[idx - 1] : 0;
    const rt = x < width - 1 ? visited[idx + 1] : 0;
    if (up + dn + lt + rt > 0) {
      rgba[idx * 4 + 3] = 80;
    }
  }
}

const out = new PNG({ width, height, colorType: 6 });
out.data = rgba;
fs.writeFileSync(dstPath, PNG.sync.write(out));
console.log(`✓ wrote ${dstPath} (${width}x${height}, RGBA)`);
