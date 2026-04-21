import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { playSound } from '../../hooks/useSound';
import HowToPlay from './HowToPlay';

const SUITS = ['♠', '♥', '♣', '♦'];

function BgScene() {
  const noiseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = noiseRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const w = 200, h = 200;
    c.width = w; c.height = h;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 12;
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 100% 70% at 50% 20%, rgba(18,50,32,0.8) 0%, transparent 70%),
          radial-gradient(ellipse 80% 50% at 50% 110%, rgba(12,36,22,0.6) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 50% 50%, rgba(240,202,80,0.04) 0%, transparent 80%),
          linear-gradient(180deg, #081610 0%, #0e2016 50%, #081610 100%)
        `,
      }} />

      <canvas
        ref={noiseRef}
        className="absolute inset-0 h-full w-full opacity-40"
        style={{ imageRendering: 'pixelated', mixBlendMode: 'overlay' }}
      />

      <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{
        width: '60%',
        height: '45%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(240,202,80,0.08) 0%, transparent 70%)',
      }} />

      <div className="absolute inset-0" style={{
        boxShadow: 'inset 0 0 200px 60px rgba(0,0,0,0.7)',
      }} />

      {SUITS.map((s, i) => (
        <div
          key={s}
          className="absolute select-none"
          style={{
            fontSize: 120,
            color: 'rgba(255,255,255,0.03)',
            left: `${15 + i * 22}%`,
            top: `${20 + (i % 2) * 40}%`,
            transform: `rotate(${-15 + i * 12}deg)`,
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

export default function MenuScreen() {
  const goToChickenScene = useGameStore((s) => s.goToChickenScene);
  const [np, setNp] = useState(4);
  const [ante, setAnte] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hoverStart, setHoverStart] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col items-center px-5 py-8">
      <BgScene />

      <AnimatePresence>
        {showTutorial && <HowToPlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

      {/* === Hero / Brand === */}
      <motion.div
        className="relative z-10 mb-6 mt-auto flex flex-col items-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(240,202,80,0.4))' }} />
          <span className="text-[11px] tracking-[0.4em]" style={{ color: 'rgba(240,202,80,0.65)', fontWeight: 500 }}>
            ♠ ♥ ♣ ♦
          </span>
          <div className="h-px w-10" style={{ background: 'linear-gradient(270deg, transparent, rgba(240,202,80,0.4))' }} />
        </div>

        <h1
          className="text-center leading-[1.05]"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(36px, 8vw, 52px)',
            fontWeight: 900,
            color: '#ffd868',
            letterSpacing: '0.08em',
            textShadow: '0 2px 20px rgba(240,202,80,0.25), 0 1px 0 rgba(0,0,0,0.3)',
          }}
        >
          分轮倍增赛
        </h1>

        <p className="mt-3 text-center text-[12px] leading-relaxed" style={{ color: '#b0a898', maxWidth: 260 }}>
          五轮博弈 · 倍率飙升 · 抓老几谁就输
        </p>

        <button
          onClick={() => {
            playSound('click');
            setShowTutorial(true);
          }}
          className="mt-2 text-[11px]"
          style={{
            color: 'rgba(240,202,80,0.7)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            borderBottom: '1px dashed rgba(240,202,80,0.35)',
            transition: 'color 0.15s',
          }}
        >
          了解玩法规则
        </button>
      </motion.div>

      {/* === 设置面板 === */}
      <motion.div
        className="relative z-10 w-full max-w-[380px] overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(14,36,24,0.95) 0%, rgba(10,28,18,0.98) 100%)',
          border: '1px solid rgba(240,202,80,0.14)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(240,202,80,0.06) inset',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
      >
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(240,202,80,0.35) 50%, transparent 90%)' }} />

        {/* 玩家人数 */}
        <div className="px-5 pt-5 pb-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em]" style={{ color: '#b0a898' }}>
              玩家人数
            </span>
            <span className="text-[11px] font-bold" style={{ color: '#ffd868' }}>{np}人</span>
          </div>
          <div className="flex gap-1">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => {
              const active = np === n;
              return (
                <button
                  key={n}
                  onClick={() => {
                    if (n !== np) playSound('click');
                    setNp(n);
                  }}
                  className="flex-1 rounded-md py-2 text-[13px] font-bold"
                  style={{
                    background: active
                      ? 'linear-gradient(180deg, #f0ca50, #d4a840)'
                      : 'rgba(255,255,255,0.04)',
                    color: active ? '#0e1e16' : '#8a8878',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 2px 8px rgba(240,202,80,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-5 h-px" style={{ background: 'rgba(240,202,80,0.08)' }} />

        {/* 底注 */}
        <div className="px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.12em]" style={{ color: '#b0a898' }}>
              底注
            </span>
            <span className="text-[11px] font-bold" style={{ color: '#ffd868' }}>{ante}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setAnte((a) => Math.max(1, a - 1));
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[15px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#8a8878',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={ante}
              onChange={(e) => setAnte(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 rounded-md px-2 py-1.5 text-center text-[15px] font-bold outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#ffd868',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
            <button
              onClick={() => {
                playSound('click');
                setAnte((a) => a + 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[15px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#8a8878',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="mx-5 h-px" style={{ background: 'rgba(240,202,80,0.08)' }} />

        {/* 流程提示 */}
        <div className="px-5 py-4">
          <div className="mb-2 text-[11px] font-semibold tracking-[0.12em]" style={{ color: '#b0a898' }}>
            接下来
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px]"
            style={{
              background: 'rgba(255,180,200,0.08)',
              border: '1px solid rgba(255,180,200,0.18)',
              color: '#f6d0d0',
            }}
          >
            <span style={{ fontSize: 18 }}>🐔</span>
            <span>下一步选择「抓哪只鸡」决定本局输家名次</span>
          </div>
        </div>
      </motion.div>

      {/* === 开始按钮 === */}
      <motion.button
        onClick={() => {
          playSound('confirm');
          goToChickenScene(np, ante);
        }}
        onMouseEnter={() => setHoverStart(true)}
        onMouseLeave={() => setHoverStart(false)}
        className="relative z-10 mt-6 mb-auto overflow-hidden rounded-xl"
        style={{
          padding: '14px 56px',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: '0.12em',
          color: '#0a1610',
          cursor: 'pointer',
          border: 'none',
          background: hoverStart
            ? 'linear-gradient(180deg, #ffd868 0%, #f0ca50 100%)'
            : 'linear-gradient(180deg, #f0ca50 0%, #d4a840 100%)',
          boxShadow: hoverStart
            ? '0 8px 32px rgba(240,202,80,0.4), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.15) inset'
            : '0 4px 20px rgba(240,202,80,0.25), 0 1px 0 rgba(255,255,255,0.2) inset, 0 -1px 0 rgba(0,0,0,0.15) inset',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            borderRadius: 'inherit',
          }}
        />
        <span className="relative">下一步 · 抓鸡</span>
      </motion.button>

      <p className="z-10 mt-4 text-[9px] tracking-widest" style={{ color: '#506050' }}>
        JOSON POKER · v1.0
      </p>
    </div>
  );
}
