import { type ReactNode } from 'react';
import { useOrientation } from '../../hooks/useOrientation';

interface PokerTableProps {
  children: ReactNode;
}

/**
 * 桌面容器：按横竖屏选择 16:9 或 9:16 的 aspect-ratio，
 * 不再绘制足球场桌布图，改为柔和椭圆灯光聚焦圈融入场景。
 */
export default function PokerTable({ children }: PokerTableProps) {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const aspectRatio = isLandscape ? '16 / 9' : '9 / 16';
  // maxWidth / maxHeight 都设成 100% 让父容器 flex 空间说了算，
  // 同时用 aspect-ratio 保持比例 —— 小屏幕时宽高会同比缩，不会把页面撑出视口。
  const widthClamp = isLandscape ? 'min(94vw, 880px)' : 'min(94vw, 460px)';

  return (
    <div
      className="relative mx-auto overflow-visible"
      style={{
        aspectRatio,
        width: widthClamp,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* 椭圆灯光聚焦圈 —— 取代原本的矩形桌布，营造自然落下的绿色柔光
          下层：森林绿主光；上层：微弱暖金高光补在正上方 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 62% 58% at 50% 52%, rgba(90,185,120,0.22) 0%, rgba(45,140,80,0.12) 38%, rgba(20,60,38,0.06) 62%, transparent 82%),
            radial-gradient(ellipse 42% 28% at 50% 32%, rgba(255,240,190,0.08) 0%, transparent 72%)
          `,
        }}
      />

      {/* 子内容（公牌、座位） */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible">
        {children}
      </div>
    </div>
  );
}
