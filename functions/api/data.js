// GET  /api/data  → { rev, data }  (所有人可读;还没有数据时 data 为 null)
// PUT  /api/data  → 管理员写入  body: { baseRev, data };baseRev 必须等于目前版本,否则 409(避免两人同时改而互相覆盖)
import { json, requireAdmin, hasKV } from '../_shared.js';

const MAX = 5 * 1024 * 1024;

export async function onRequestGet({ env }) {
  if (!hasKV(env)) return json({ error: 'no-binding' }, 503);
  const raw = await env.DATA.get('data');
  if (!raw) return json({ rev: 0, data: null });
  return new Response(raw, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function onRequestPut({ request, env }) {
  if (!hasKV(env)) return json({ error: 'no-binding' }, 503);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const text = await request.text();
  if (text.length > MAX) return json({ error: 'too-large' }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'bad-json' }, 400); }
  const d = body && body.data;
  if (!d || !Array.isArray(d.scenes) || !Array.isArray(d.roles)) return json({ error: 'bad-data' }, 400);

  const cur = JSON.parse((await env.DATA.get('data')) || '{"rev":0}');
  if (Number(body.baseRev) !== cur.rev) return json({ error: 'conflict', rev: cur.rev }, 409);

  const rev = cur.rev + 1;
  await env.DATA.put('data', JSON.stringify({ rev, savedAt: new Date().toISOString(), data: d }));
  return json({ ok: true, rev });
}
