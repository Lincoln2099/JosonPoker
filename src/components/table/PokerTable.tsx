import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useOrientation } from '../../hooks/useOrientation';
import { TABLE_PORTRAIT, TABLE_LANDSCAPE } from '../../assets/images';

interface PokerTableProps {
  children: ReactNode;
}

/**
 * 桌布原图固定为 1376×768 横向（木框 + 足球场 + 樱花 + 奖杯）。
 * 竖屏时把图整体旋转 90° 充满纵向容器，让足球场长轴自然垂直、球门朝上下。
 *
 * 关键实现：用 ResizeObserver 量出容器实际像素尺寸，再用一个"转置后"的子元素
 * （pre-rotation 宽 = container.height，pre-rotation 高 = container.width）+ rotate(90deg)，
 * 旋转后视觉宽高与容器精确一致，不会有黑边或越界。
 */
export default function PokerTable({ children }: PokerTableProps) {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const aspectRatio = isLandscape ? '16 / 9' : '9 / 16';
  const widthClamp = isLandscape ? 'min(94vw, 880px)' : 'min(94vw, 460px)';

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const r = e.contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto overflow-visible"
      style={{
        aspectRatio,
        width: widthClamp,
        maxHeight: 'calc(100dvh - 100px)',
      }}
    >
      {/* 桌布层 */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[28px]"
        style={{
          boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)',
          background: '#0a1810',
        }}
      >
        {size.w > 0 && size.h > 0 && (
          isLandscape ? (
            // 横屏：直接 cover
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${TABLE_LANDSCAPE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            // 竖屏：转置 + rotate(90deg)，使旋转后的视觉宽高 = 容器宽高
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size.h, // 旋转后变成视觉高度
                height: size.w, // 旋转后变成视觉宽度
                backgroundImage: `url(${TABLE_PORTRAIT})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
              }}
            />
          )
        )}
      </div>

      {/* 暗角 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.28), inset 0 0 16px rgba(0,0,0,0.18)',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* 顶部柔光 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-[28px]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,240,200,0.08) 0%, transparent 100%)',
        }}
      />

      {/* 子内容（公牌、座位） */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible">
        {children}
      </div>
    </div>
  );
}
