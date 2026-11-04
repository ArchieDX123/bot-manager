import { useEffect, useId, useRef, useState } from 'react';
import { motion, useSpring, type MotionValue } from 'framer-motion';
import type { Bot } from '../types';
import { shapePath } from '../shapes';

// Plaats van de ogen in het 200 x 200-vak, zoals bij de Grok-gezichtjes.
const EYES = [
  { cx: 108, cy: 88 },
  { cx: 140, cy: 88 },
];
const MAX_X = 22; // maximale verschuiving van de ogen, horizontaal
const MAX_Y = 18; // en verticaal
const SPRING = { stiffness: 150, damping: 17, mass: 0.6 };

interface Props {
  bot: Pick<Bot, 'name' | 'role' | 'color' | 'shape' | 'avatar'>;
  tracking: boolean;
  size?: string | number;
}

/**
 * Het botgezicht. De ogen volgen de muis via springs van Framer Motion:
 * geen React-rerender per muisbeweging. Staat de muis 5 seconden stil (of staat
 * volgen uit), dan kijkt de bot rustig rond.
 */
export function BotFace({ bot, tracking, size = 'min(52vh, 440px)' }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const tilt = useSpring(0, { stiffness: 80, damping: 14 });
  const [blink, setBlink] = useState(false);
  const uid = useId().replace(/:/g, '');
  const path = shapePath(bot.shape);

  useEffect(() => {
    let lastMove = performance.now();
    let frame = 0;
    const look = (px: number, py: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ox = r.left + r.width * 0.62;
      const oy = r.top + r.height * 0.44;
      const dx = px - ox;
      const dy = py - oy;
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / (r.width * 0.9));
      x.set((dx / dist) * k * MAX_X);
      y.set((dy / dist) * k * MAX_Y);
      tilt.set((dx / dist) * k * 3);
    };
    const onMove = (e: PointerEvent) => {
      lastMove = performance.now();
      if (tracking) look(e.clientX, e.clientY);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
      tilt.set(0);
    };
    const idle = (t: number) => {
      if (!tracking || t - lastMove > 5000) {
        x.set((Math.sin(t / 2300) * 0.6 + Math.sin(t / 900) * 0.1) * MAX_X);
        y.set(Math.cos(t / 3100) * 0.35 * MAX_Y);
        tilt.set(Math.sin(t / 2300) * 2);
      }
      frame = requestAnimationFrame(idle);
    };
    frame = requestAnimationFrame(idle);
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [tracking, x, y, tilt]);

  // Knipperen met wisselende tussenpozen, soms twee keer kort na elkaar.
  useEffect(() => {
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 120);
        if (Math.random() < 0.18) {
          window.setTimeout(() => setBlink(true), 250);
          window.setTimeout(() => setBlink(false), 370);
        }
        schedule();
      }, 2500 + Math.random() * 3500);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      style={{ width: size, height: size, display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={bot.role ? `${bot.name}, ${bot.role}` : bot.name}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={path} />
        </clipPath>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <motion.g style={{ rotate: tilt, originX: '100px', originY: '100px', transformBox: 'view-box' }}>
        <path d={path} fill={bot.color} />
        {bot.avatar && (
          <image
            href={bot.avatar}
            x="0"
            y="0"
            width="200"
            height="200"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-${uid})`}
          />
        )}
        <path d={path} fill={`url(#shade-${uid})`} />
        <g clipPath={`url(#clip-${uid})`}>
          {EYES.map((e, i) => (
            <Eye key={i} cx={e.cx} cy={e.cy} x={x} y={y} blink={blink} />
          ))}
        </g>
      </motion.g>
    </svg>
  );
}

function Eye({ cx, cy, x, y, blink }: { cx: number; cy: number; x: MotionValue<number>; y: MotionValue<number>; blink: boolean }) {
  return (
    <motion.g style={{ x, y }}>
      <motion.g
        style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: 'view-box' }}
        animate={{ scaleY: blink ? 0.1 : 1 }}
        transition={{ duration: 0.08, ease: 'easeInOut' }}
      >
        <ellipse cx={cx} cy={cy} rx="8.5" ry="13" fill="#141414" />
        <ellipse cx={cx + 2.4} cy={cy - 5} rx="2.4" ry="3.2" fill="#fff" opacity="0.85" />
      </motion.g>
    </motion.g>
  );
}

/** Klein icoontje van een bot, voor lijsten. */
export function BotIcon({ bot, className }: { bot: Pick<Bot, 'color' | 'shape'>; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <path d={shapePath(bot.shape)} fill={bot.color} />
      <ellipse cx="112" cy="90" rx="11" ry="17" fill="#141414" />
      <ellipse cx="146" cy="90" rx="11" ry="17" fill="#141414" />
    </svg>
  );
}
