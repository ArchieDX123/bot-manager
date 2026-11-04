const MAX_SIDE = 512;

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
