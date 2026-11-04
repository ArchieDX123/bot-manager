import type { ShapeKey } from './types';

/** Kleuren die je met één klik kiest. Elke bot mag ook een eigen kleur hebben. */
export const PALETTE = {
  white: '#F2F2F0',
  green: '#22C267',
  red: '#FF3D4F',
  orange: '#FF6A13',
  purple: '#8B5CF6',
  teal: '#16B39E',
  blue: '#2F7BFF',
} as const;
export const SWATCHES: string[] = Object.values(PALETTE);

// Alle vormen staan in een vak van 200 x 200 met het midden op (100, 100).
function polar(radius: (t: number) => number, steps = 180, sx = 1, sy = 1) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius(t);
    const x = 100 + Math.cos(t) * r * sx;
    const y = 100 + Math.sin(t) * r * sy;
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + 'Z';
}

function superellipse(a: number, b: number, n: number) {
  let d = '';
  for (let i = 0; i <= 180; i++) {
    const t = (i / 180) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = 100 + a * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = 100 + b * Math.sign(s) * Math.abs(s) ** (2 / n);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + 'Z';
}

const angleDiff = (a: number, b: number) =>
  ((((a - b + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
const bump = (t: number, at: number, width: number) =>
  Math.exp(-(angleDiff(t, at) ** 2) / width);

function roundedPolygon(sides: number, radius: number, rounding: number, rotation: number) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i / sides) * Math.PI * 2;
    return [100 + Math.cos(a) * radius, 100 + Math.sin(a) * radius];
  });
  const lerp = (p: number[], q: number[], k: number) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  let d = '';
  pts.forEach((p, i) => {
    const prev = pts[(i - 1 + sides) % sides];
    const next = pts[(i + 1) % sides];
    const a = lerp(p, prev, rounding);
    const b = lerp(p, next, rounding);
    d += `${i ? 'L' : 'M'}${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  });
  return d + 'Z';
}

const wave = (base: number, lobes: number, depth: number, phase = 0) => (t: number) =>
  base * (1 + depth * Math.cos(lobes * (t - phase)));

export const SHAPES: Record<ShapeKey, { label: string; path: string }> = {
  circle: { label: 'Rond', path: polar(() => 86) },
  pill: { label: 'Pil', path: superellipse(94, 62, 2.6) },
  squircle: {
    label: 'Blob',
    path: polar((t) => 84 * (1 + 0.07 * Math.cos(2 * (t + 0.5)) + 0.04 * Math.cos(3 * t))),
  },
  bean: {
    label: 'Hart',
    path: polar(
      (t) =>
        86 *
        (1 +
          0.07 * Math.cos(2 * (t + 0.2)) -
          0.2 * bump(t, -Math.PI / 2 - 0.2, 0.05) +
          0.06 * bump(t, Math.PI / 2 - 0.2, 0.25)),
      240,
    ),
  },
  cloud: { label: 'Wolk', path: polar(wave(80, 7, 0.075, -Math.PI / 2)) },
  flower: { label: 'Bloem', path: polar(wave(80, 5, 0.13, -Math.PI / 2)) },
  hexagon: { label: 'Zeshoek', path: roundedPolygon(6, 96, 0.32, 0.2) },
  egg: { label: 'Druppel', path: polar((t) => 84 * (1 + 0.1 * Math.cos(t - 2.4) + 0.03 * Math.cos(2 * t))) },
  star: { label: 'Ster', path: polar(wave(80, 6, 0.17, -Math.PI / 2 + 0.3)) },
};
export const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];

export const shapePath = (shape: string) => (SHAPES[shape as ShapeKey] ?? SHAPES.circle).path;
