// 共用工具:JSON 回应、管理员验证。此文件没有 onRequest 导出,所以不会变成网址。
export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return new Uint8Array(d);
}
async function same(a, b) { // 先各自取杂凑再比较,避免用长度/内容时间差猜密码
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function checkCreds(env, u, p) {
  if (!env.ADMIN_USER || !env.ADMIN_PASS) return 'not-configured';
  const a = await same(u, env.ADMIN_USER), b = await same(p, env.ADMIN_PASS);
  return a && b ? 'ok' : 'bad';
}

// 请求头 Authorization: Bearer <base64(UTF-8 的 {"u":..,"p":..})>
export async function requireAdmin(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(\S+)$/i);
  if (!m) return json({ error: 'unauthorized' }, 401);
  let u, p;
  try {
    const bin = atob(m[1]);
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    u = String(o.u ?? ''); p = String(o.p ?? '');
  } catch { return json({ error: 'unauthorized' }, 401); }
  const r = await checkCreds(env, u, p);
  if (r === 'not-configured') return json({ error: 'not-configured' }, 503);
  if (r !== 'ok') { await new Promise(r => setTimeout(r, 400)); return json({ error: 'unauthorized' }, 401); }
  return null; // 通过
}

export const hasKV = env => !!(env && env.DATA && typeof env.DATA.get === 'function');
