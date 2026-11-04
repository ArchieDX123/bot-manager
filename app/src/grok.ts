/**
 * Grok-links herkennen in geplakte tekst.
 *
 * Er bestaat (nog) geen officiële manier om de lijst met je eigen Grok-bots op te
 * vragen. Daarom plak je de links; de app maakt er bots van. Per regel mag er een
 * naam voor de link staan, bv. "Sales Manager - https://grok.com/bot/…".
 */
export interface ParsedLink {
  url: string;
  name: string;
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const GROK_HOSTS = /(^|\.)(grok\.com|x\.ai|x\.com|twitter\.com)$/i;

export function isGrokUrl(url: string) {
  try {
    const u = new URL(url);
    if (!GROK_HOSTS.test(u.hostname)) return false;
    // x.com en twitter.com alleen voor Grok-pagina's
    if (/(^|\.)(x\.com|twitter\.com)$/i.test(u.hostname)) return u.pathname.startsWith('/i/grok');
    return true;
  } catch {
    return false;
  }
}

/** Haalt de naam vóór de link uit een regel ("Naam - link", "Naam: link", "Naam link"). */
function nameBefore(line: string, url: string) {
  const before = line.slice(0, line.indexOf(url));
  return before
    .replace(/[\s:|–—\-•*>\t]+$/u, '')
    .replace(/^[\s\d.)•*\-–—]+/u, '')
    .trim();
}

export function parseGrokLinks(text: string): { links: ParsedLink[]; ignored: string[] } {
  const links: ParsedLink[] = [];
  const ignored: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const urls = line.match(URL_RE) ?? [];
    for (const raw of urls) {
      const url = raw.replace(/[.,;]+$/, '');
      if (!isGrokUrl(url)) {
        ignored.push(url);
        continue;
      }
      const key = normalizeUrl(url);
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ url, name: urls.length === 1 ? nameBefore(line, raw) : '' });
    }
  }
  return { links, ignored };
}

/** Om dubbele links te herkennen: zonder https, www, slash op het einde en hoofdletters. */
export function normalizeUrl(url: string) {
  return url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}
