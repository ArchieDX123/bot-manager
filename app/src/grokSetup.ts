import type { ShapeKey } from './types';
import { SHAPE_KEYS } from './shapes';

/**
 * De prompt die de gebruiker samen met een screenshot van zijn botlijst in Grok plakt.
 * Grok antwoordt met een leesbaar overzicht ("bots per team") én een JSON-blok
 * dat de app inleest.
 */
export const SETUP_PROMPT = `Ik gebruik de app Bot Manager om al mijn Grok-bots overzichtelijk te tonen. Bij dit bericht zit een screenshot van mijn lijst met bots.

1. Maak eerst een kort overzicht "Bots per team": groepeer de bots per team en schrijf bij elke bot in één zin wat hij doet. Gebruik wat je over elke bot weet en wat je op de screenshot ziet.

2. Geef daarna precies één codeblok met JSON in dit formaat. Zet de bots in dezelfde volgorde als op de screenshot, van boven naar onder:

\`\`\`json
{
  "bots": [
    {
      "name": "naam precies zoals op de screenshot",
      "team": "teamnaam, bv. Leiding, Verkoop, Marketing",
      "role": "functie in maximaal 5 woorden",
      "description": "wat de bot doet, in 1 of 2 korte zinnen",
      "tags": ["2 tot 4 korte trefwoorden"],
      "color": "kleur van het icoontje als hexcode, bv. #22C267",
      "shape": "star, blob, circle, pill, cloud, flower, hexagon, egg of heart"
    }
  ]
}
\`\`\`

Regels: neem alle bots van de screenshot op, verzin er geen bij, en schrijf in het Nederlands.`;

export interface SetupItem {
  name: string;
  team: string;
  role: string;
  description: string;
  tags: string[];
  color?: string;
  shape?: ShapeKey;
}

const SHAPE_ALIASES: Record<string, ShapeKey> = {
  star: 'star',
  ster: 'star',
  blob: 'squircle',
  squircle: 'squircle',
  circle: 'circle',
  rond: 'circle',
  cirkel: 'circle',
  pill: 'pill',
  pil: 'pill',
  cloud: 'cloud',
  wolk: 'cloud',
  flower: 'flower',
  bloem: 'flower',
  hexagon: 'hexagon',
  zeshoek: 'hexagon',
  egg: 'egg',
  druppel: 'egg',
  heart: 'bean',
  hart: 'bean',
  bean: 'bean',
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function toShape(v: unknown): ShapeKey | undefined {
  const s = str(v).toLowerCase();
  if (SHAPE_ALIASES[s]) return SHAPE_ALIASES[s];
  return SHAPE_KEYS.includes(s as ShapeKey) ? (s as ShapeKey) : undefined;
}

function toColor(v: unknown): string | undefined {
  const s = str(v);
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) return ('#' + s.slice(1).split('').map((c) => c + c).join('')).toUpperCase();
  return undefined;
}

/** Zoekt het JSON-deel in het antwoord van Grok (codeblok, of het eerste { … } / [ … ]). */
function extractJson(text: string): unknown {
  const candidates: string[] = [];
  const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text))) candidates.push(m[1]);
  const first = text.search(/[{[]/);
  if (first >= 0) {
    const open = text[first];
    const last = text.lastIndexOf(open === '{' ? '}' : ']');
    if (last > first) candidates.push(text.slice(first, last + 1));
  }
  for (const c of candidates) {
    const cleaned = c
      .replace(/[“”]/g, '"')
      .replace(/,\s*([}\]])/g, '$1'); // komma's te veel
    try {
      return JSON.parse(cleaned);
    } catch {
      /* volgende proberen */
    }
  }
  throw new Error('In dit antwoord staat geen leesbaar JSON-blok. Kopieer het volledige antwoord van Grok, inclusief het codeblok.');
}

export function parseSetupAnswer(text: string): SetupItem[] {
  if (!text.trim()) return [];
  const data = extractJson(text);
  const list = Array.isArray(data) ? data : (data as { bots?: unknown })?.bots;
  if (!Array.isArray(list)) throw new Error('Het JSON-blok bevat geen lijst "bots".');
  const items: SetupItem[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const name = str(r.name);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    items.push({
      name,
      team: str(r.team) || 'Overig',
      role: str(r.role),
      description: str(r.description),
      tags: Array.isArray(r.tags) ? r.tags.map(str).filter(Boolean).slice(0, 6) : [],
      color: toColor(r.color),
      shape: toShape(r.shape),
    });
  }
  if (!items.length) throw new Error('Geen bots gevonden in het antwoord.');
  return items;
}

/** Namen vergelijken zonder hoofdletters, spaties of leestekens. */
export const nameKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
