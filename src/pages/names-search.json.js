// Search text for the names index: entry k is name k+1, in every script and every written language.
// The names page fetches this only when someone starts a search, which keeps that page small.
import { loadSite } from '../lib/data.js';
import { searchText } from '../lib/pagedata.js';

export async function GET() {
  const { names } = await loadSite();
  const list = [];
  for (const n of names) list[n.number - 1] = searchText(n);
  return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
