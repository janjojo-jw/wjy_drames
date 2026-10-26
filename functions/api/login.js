// POST /api/login  body: { u, p } → 200 {ok:true} | 401 | 503(服务器还没设定管理员账号)
import { json, checkCreds } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const r = await checkCreds(env, String(b.u ?? '').trim(), String(b.p ?? ''));
  if (r === 'not-configured') return json({ error: 'not-configured' }, 503);
  if (r !== 'ok') { await new Promise(r => setTimeout(r, 400)); return json({ error: 'unauthorized' }, 401); }
  return json({ ok: true });
}
