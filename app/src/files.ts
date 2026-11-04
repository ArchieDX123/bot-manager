const MAX_SIDE = 512;

/**
 * Haalt een effen achtergrond weg uit een logo en snijdt de lege rand af.
 * De achtergrondkleur wordt aan de randen gemeten; alleen pixels die met de rand
 * verbonden zijn en op die kleur lijken worden doorzichtig (zachte overgang),
 * zodat dezelfde kleur binnenin het logo blijft staan.
 * Geeft null terug als er geen effen achtergrond is (bv. een foto).
 */
export async function removeLogoBackground(src: string): Promise<string | null> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Logo kon niet geladen worden.'));
    i.src = src;
  });
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  const W = Math.max(1, Math.round(img.width * scale));
  const H = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;

  // Randpixels: al doorzichtig? Dan niets te doen behalve bijsnijden.
  const border: number[] = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const opaque = border.filter((p) => d[p * 4 + 3] > 200);
  if (opaque.length < border.length * 0.5) return trim(ctx, image, W, H);

  // Achtergrondkleur = mediaan van de rand; moet effen genoeg zijn.
  const med = (k: number) => opaque.map((p) => d[p * 4 + k]).sort((a, b) => a - b)[Math.floor(opaque.length / 2)];
  const bg = [med(0), med(1), med(2)];
  const dist = (i: number) => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
  const similar = opaque.filter((p) => dist(p * 4) < 40).length;
  if (similar < opaque.length * 0.8) return null;

  const HARD = 28; // tot hier volledig doorzichtig
  const SOFT = 90; // tot hier gedeeltelijk (zachte rand, anti-aliasing)
  const seen = new Uint8Array(W * H);
  const stack = border.filter((p) => dist(p * 4) < SOFT);
  stack.forEach((p) => (seen[p] = 1));
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    const dd = dist(i);
    if (dd < HARD) d[i + 3] = 0;
    else d[i + 3] = Math.min(d[i + 3], Math.round(((dd - HARD) / (SOFT - HARD)) * 255));
    if (dd >= SOFT * 0.6) continue; // niet verder het logo in kruipen
    const x = p % W;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
      if (q < 0 || q >= W * H || seen[q]) continue;
      seen[q] = 1;
      if (dist(q * 4) < SOFT) stack.push(q);
    }
  }
  ctx.putImageData(image, 0, 0);
  return trim(ctx, image, W, H);
}

/** Snijdt doorzichtige randen weg en geeft een PNG terug. */
function trim(ctx: CanvasRenderingContext2D, image: ImageData, W: number, H: number) {
  const d = image.data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (d[(y * W + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  const pad = 2;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad);
  y1 = Math.min(H - 1, y1 + pad);
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d')?.drawImage(ctx.canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  // Niet groter dan nodig voor een logo in de kopbalk
  const s = Math.min(1, 800 / Math.max(out.width, out.height));
  if (s === 1) return out.toDataURL('image/png');
  const small = document.createElement('canvas');
  small.width = Math.round(out.width * s);
  small.height = Math.round(out.height * s);
  small.getContext('2d')?.drawImage(out, 0, 0, small.width, small.height);
  return small.toDataURL('image/png');
}

/**
 * Leest een afbeelding in als data-URL en verkleint grote foto's tot max. 512 px,
 * zodat de opslag (ca. 5 MB) niet volloopt. SVG blijft zoals het is.
 */
export async function readImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Kies een afbeeldingsbestand.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Bestand kon niet gelezen worden.'));
    r.readAsDataURL(file);
  });
  if (file.type === 'image/svg+xml') return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Afbeelding kon niet geladen worden.'));
    i.src = dataUrl;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 400_000) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.9);
}
