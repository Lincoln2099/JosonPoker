import { useSound } from '../../hooks/useSound';

interface SoundToggleProps {
  /** 距视口顶部偏移（避免与其它 HUD 重叠），默认 12 */
  top?: number;
  /** 距视口右侧偏移，默认 12 */
  right?: number;
}

/**
 * 全局音效开关 —— 浮动在右上角，所有 screen 通用。
 */
export default function SoundToggle({ top = 12, right = 12 }: SoundToggleProps) {
  const { isMuted, toggleMute, play } = useSound();

  return (
    <button
      type="button"
      onClick={() => {
        toggleMute();
        // 切回有声时给个反馈音
        if (isMuted) setTimeout(() => play('click'), 30);
      }}
      aria-label={isMuted ? '开启音效' : '关闭音效'}
      title={isMuted ? '开启音效' : '关闭音效'}
      className="fixed z-[80] flex items-center justify-center rounded-full"
      style={{
        top: `calc(${top}px + env(safe-area-inset-top, 0px))`,
        right,
        width: 36,
        height: 36,
        padding: 0,
        background: 'rgba(10,16,12,0.62)',
        border: '1px solid rgba(240,202,80,0.32)',
        color: isMuted ? 'rgba(180,170,150,0.7)' : '#ffd868',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        transition: 'color .15s, transform .12s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        {isMuted ? (
          <>
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.08" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  );
}
