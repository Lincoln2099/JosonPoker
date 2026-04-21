import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useOrientation } from '../../hooks/useOrientation';
import { playSound } from '../../hooks/useSound';
import {
  collectPreloadList,
  preloadImages,
  LOADING_PORTRAIT,
  LOADING_LANDSCAPE,
} from '../../assets/images';

const MIN_DURATION_MS = 1200;

export default function LoadingScreen() {
  const finishLoading = useGameStore((s) => s.finishLoading);
  const orientation = useOrientation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const list = collectPreloadList();

    preloadImages(list, (loaded, total) => {
      setProgress(loaded / total);
    }).then(() => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_DURATION_MS - elapsed);
      setTimeout(() => {
        setProgress(1);
        playSound('chime'); // 加载完成清脆和弦
        setTimeout(finishLoading, 220);
      }, wait);
    });
  }, [finishLoading]);

  const bg = orientation === 'portrait' ? LOADING_PORTRAIT : LOADING_LANDSCAPE;

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-end overflow-hidden"
      style={{ background: '#1a1410' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 第 1 层：放大并大幅模糊的背景，无缝铺满整个视口 */}
      <div
        className="absolute"
        style={{
          inset: -60,
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(56px) saturate(1.1) brightness(0.95)',
          transform: 'scale(1.2)',
        }}
      />

      {/* 第 2 层：径向暗化，弱化模糊层中心、让前景图更立体 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/*
        第 2.5 层：顶部 / 底部色彩匹配条 —— 取自启动图本身的顶/底色调，
        让模糊层与图片真实边缘的颜色完全一致，消除接缝处的"色差感"。
        - 顶部：取自图片中的桃粉 / 暖橙 / 樱花粉
        - 底部：取自图片中的草绿
      */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '38%',
          background:
            'linear-gradient(180deg, #f8c8b0 0%, rgba(248,200,176,0.85) 25%, rgba(248,200,176,0.45) 60%, transparent 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: '32%',
          background:
            'linear-gradient(0deg, #8fc070 0%, rgba(143,192,112,0.7) 35%, rgba(143,192,112,0.3) 70%, transparent 100%)',
        }}
      />

      {/*
        第 3 层：清晰前景启动图。
        - 外层 motion.div 用 flex 居中并承载 scale/opacity 动画
        - 内层 <img> 自然 contain 完整显示，再用 mask-image 羽化最外 4% 边缘
          消除与背后模糊层的硬切感（4% 在标题之外，不会损伤"今天抓老几？"）
      */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img
          src={bg}
          alt=""
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, #000 4%, #000 96%, transparent 100%)',
            maskImage:
              'linear-gradient(180deg, transparent 0%, #000 4%, #000 96%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* 底部进度条区域柔和暗化 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, transparent 70%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* 进度条与提示 */}
      <motion.div
        className="relative z-10 mb-12 flex w-full max-w-[320px] flex-col items-center px-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
      >
        {/* 提示文字 */}
        <div
          className="mb-3 text-[12px] tracking-[0.3em]"
          style={{
            color: '#fff3d8',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            fontWeight: 600,
          }}
        >
          {progress < 1 ? '资源加载中…' : '准备就绪'}
        </div>

        {/* 进度条容器 */}
        <div
          className="relative h-[6px] w-full overflow-hidden rounded-full"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #f6c860 0%, #ffe89a 50%, #f6c860 100%)',
              boxShadow: '0 0 12px rgba(255,224,140,0.7)',
            }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ ease: 'easeOut', duration: 0.25 }}
          />
        </div>

        <div
          className="mt-2 text-[10px]"
          style={{ color: 'rgba(255, 240, 200, 0.7)' }}
        >
          {Math.round(progress * 100)}%
        </div>
      </motion.div>

      {/* 底部版权 */}
      <div
        className="absolute bottom-3 z-10 text-[9px] tracking-[0.3em]"
        style={{ color: 'rgba(255,240,210,0.5)' }}
      >
        JOSON POKER · v1.0
      </div>
    </motion.div>
  );
}
