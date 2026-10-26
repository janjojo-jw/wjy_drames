// POST /api/photo  管理员上传一张(已在浏览器压缩过的)JPEG → { url: "/api/photo/<id>" }
import { json, requireAdmin, hasKV } from '../_shared.js';

const MAX = 1.5 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!hasKV(env)) return json({ error: 'no-binding' }, 503);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX) return json({ error: 'too-large' }, 413);
  const b = new Uint8Array(buf);
  if (!(b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)) return json({ error: 'not-jpeg' }, 415);

  const id = crypto.randomUUID().replace(/-/g, '');
  await env.DATA.put('photo:' + id, buf, { metadata: { type: 'image/jpeg' } });
  return json({ ok: true, url: '/api/photo/' + id });
}
