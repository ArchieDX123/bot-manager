import type { ShapeKey } from './types';

/**
 * Herkent de bot-icoontjes in een screenshot van de botlijst in Grok.
 * Werkt volledig lokaal: het beeld wordt nergens naartoe gestuurd.
 *
 * Werkwijze: de icoontjes zijn gekleurde (of witte) vlakken links in elke rij.
 * We zoeken samenhangende vlakken van "icoonpixels" in de linkerstrook, houden
 * de vlakken met een icoonachtige grootte over en lezen per vlak de kleur.
 * Volgorde = van boven naar onder, zoals in Grok.
 */
export interface DetectedBot {
  color: string;
  shape: ShapeKey | undefined;
  /** positie in het beeld (0–1), voor de voorvertoning */
  box: { x: number; y: number; w: number; h: number };
}

const WORK_WIDTH = 420;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Deze afbeelding kon niet geladen worden.'));
    img.src = src;
  });
}

export async function detectBots(src: string): Promise<DetectedBot[]> {
  const img = await loadImage(src);
  const scale = WORK_WIDTH / img.width;
  const W = WORK_WIDTH;
  const H = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Afbeelding kon niet verwerkt worden.');
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  // Achtergrondhelderheid (mediaan van de rechterrand) om ook lichte thema's te ondersteunen.
  const lum = (i: number) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const edge: number[] = [];
  for (let y = 0; y < H; y += 4) edge.push(lum((y * W + (W - 2)) * 4));
  edge.sort((a, b) => a - b);
  const bgLum = edge[Math.floor(edge.length / 2)] ?? 20;
  const darkTheme = bgLum < 128;

  const stripW = Math.round(W * 0.2); // icoontjes staan in de linkerstrook
  const mask = new Uint8Array(stripW * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < stripW; x++) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max ? (max - min) / max : 0;
      const l = lum(i);
      const colored = sat > 0.35 && max > 80;
      const contrast = darkTheme ? l > 200 : l < 60; // wit icoon op donker (of omgekeerd)
      if (colored || contrast) mask[y * stripW + x] = 1;
    }
  }

  // Samenhangende vlakken zoeken
  const seen = new Uint8Array(stripW * H);
  const blobs: { x0: number; y0: number; x1: number; y1: number; px: number[] }[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let x0 = stripW, y0 = H, x1 = 0, y1 = 0;
    const px: number[] = [];
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % stripW, y = (p - x) / stripW;
      px.push(p);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const q of [p - 1, p + 1, p - stripW, p + stripW]) {
        if (q < 0 || q >= mask.length || seen[q] || !mask[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === stripW - 1)) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    blobs.push({ x0, y0, x1, y1, px });
  }

  const minSide = W * 0.05;
  const maxSide = W * 0.2;
  const icons = blobs
    .map((b) => {
      const w = b.x1 - b.x0 + 1;
      const h = b.y1 - b.y0 + 1;
      return { ...b, w, h, fill: b.px.length / (w * h) };
    })
    .filter((b) => b.w >= minSide && b.h >= minSide && b.w <= maxSide && b.h <= maxSide && b.w / b.h > 0.6 && b.w / b.h < 1.7 && b.fill > 0.35)
    .sort((a, b) => a.y0 - b.y0);

  return icons.map((b) => {
    // Mediaan van de kleur (oogjes en randen tellen niet mee)
    const rs: number[] = [], gs: number[] = [], bs: number[] = [];
    for (const p of b.px) {
      const x = p % stripW, y = (p - x) / stripW;
      const i = (y * W + x) * 4;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
    const med = (a: number[]) => a.sort((m, n) => m - n)[Math.floor(a.length / 2)];
    const color = toHex(med(rs), med(gs), med(bs));
    // Een ster vult haar vak veel minder dan een rond icoon.
    const shape: ShapeKey | undefined = b.fill < 0.62 ? 'star' : undefined;
    return {
      color,
      shape,
      box: { x: b.x0 / W, y: b.y0 / H, w: b.w / W, h: b.h / H },
    };
  });
}

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
