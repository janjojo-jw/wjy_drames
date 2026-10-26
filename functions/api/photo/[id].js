// GET /api/photo/<id>  所有人可看;内容不会变,可长期缓存
import { hasKV } from '../../_shared.js';

export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  if (!hasKV(env) || !/^[a-f0-9]{32}$/.test(id)) return new Response('not found', { status: 404 });
  const buf = await env.DATA.get('photo:' + id, { type: 'arrayBuffer' });
  if (!buf) return new Response('not found', { status: 404 });
  return new Response(buf, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
}
