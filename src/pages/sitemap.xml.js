// sitemap.xml with hreflang links between the language versions of each page.
import { loadSite } from '../lib/data.js';
import { SITE } from '../lib/site.mjs';
import { homeAlternates, namesAlternates, verseAlternates, nameAlternates } from '../lib/pagedata.js';

const abs = (p) => new URL(p, SITE.origin).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export async function GET() {
  const site = await loadSite();
  const groups = [homeAlternates(), namesAlternates(), ...site.verses.map(verseAlternates), ...site.names.map(nameAlternates)].filter((g) => g.length);
  const urls = groups.flatMap((group) =>
    group.map((page) => {
      const links =
        group.length > 1
          ? [...group.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${esc(abs(a.href))}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs((group.find((a) => a.lang === 'en') || group[0]).href))}"/>`].join('\n')
          : '';
      return `  <url>\n    <loc>${esc(abs(page.href))}</loc>${links ? `\n${links}` : ''}\n  </url>`;
    })
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
