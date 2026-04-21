import { useState } from 'react';
import { motion } from 'framer-motion';
import { getAvatarSrc, type AvatarMood } from '../../assets/images';

interface CharacterAvatarProps {
  charIdx: number;
  mood?: AvatarMood;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
  glow?: boolean;
  fallbackEmoji?: string;
  className?: string;
}

/**
 * 圆形角色头像。透明回退到 emoji，便于在图加载失败时仍可见。
 */
export default function CharacterAvatar({
  charIdx,
  mood = 'neutral',
  size = 44,
  ringColor = 'rgba(255,255,255,0.18)',
  ringWidth = 1.5,
  glow = false,
  fallbackEmoji,
  className,
}: CharacterAvatarProps) {
  const [errored, setErrored] = useState(false);
  const src = getAvatarSrc(charIdx, mood);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #243a2c, #16271c)',
        boxShadow: glow
          ? `0 0 12px rgba(240,202,80,0.45), inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.4)`
          : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.32)',
      }}
    >
      {/* 边框光环 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${ringWidth}px solid ${ringColor}`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {!errored && (
        <motion.img
          key={mood}
          src={src}
          alt=""
          onError={() => setErrored(true)}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      )}

      {errored && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: size * 0.5,
          }}
        >
          {fallbackEmoji ?? '😀'}
        </div>
      )}
    </div>
  );
}
