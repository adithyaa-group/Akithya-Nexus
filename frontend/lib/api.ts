export async function api(path: string, opts: { method?: string; body?: any } = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const m = data?.message;
    throw new Error(Array.isArray(m) ? m.join(' · ') : m || 'Request failed');
  }
  return data;
}

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const pretty = (s?: string | null) => (s ? s.replace(/_/g, ' ') : '—');
