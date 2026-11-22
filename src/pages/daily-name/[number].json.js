// Static files: the browser fetches only the selected day's name, never all 1000.
import { loadSite } from '../../lib/data.js';
import { homeNameData } from '../../lib/pagedata.js';

export async function getStaticPaths() {
  const { names } = await loadSite();
  return names.map((name) => ({ params: { number: String(name.number) }, props: { name } }));
}

export function GET({ props }) {
  return new Response(JSON.stringify(homeNameData(props.name)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
