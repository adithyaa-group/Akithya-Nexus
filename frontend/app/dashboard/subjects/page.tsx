'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSession, WRITE_ROLES } from '@/lib/session';
import { ClassTag, StatusTag, VerTag } from '@/components/Tags';
import { ErrorBox, Loading, PageHead } from '@/components/Page';

export default function Registry() {
  const { me } = useSession();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cls, setCls] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: '15' });
    if (q.trim()) p.set('q', q.trim());
    if (status) p.set('status', status);
    if (cls) p.set('classification', cls);
    api('/subjects?' + p).then((r) => { setData(r); setErr(''); }).catch((e) => setErr(e.message));
  }, [q, status, cls, page]);

  // debounce typing; filters/page reload immediately via the same effect
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <PageHead kicker="DATABASE · IDENTITY CORE" title="Subject Registry">
        {me && WRITE_ROLES.includes(me.role) && <Link href="/dashboard/subjects/new" className="btn">+ New Subject</Link>}
      </PageHead>

      <div className="panel p-4 mb-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label htmlFor="q" className="label">Search · name, Subject ID, nationality, alias</label>
          <input id="q" className="input" placeholder="e.g. AG-SUB-000002 or Hartmann" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label htmlFor="st" className="label">Status</label>
          <select id="st" className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option><option value="active">Active</option><option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="cl" className="label">Classification</label>
          <select id="cl" className="input" value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}
      {!data && !err && <Loading />}
      {data && (
        <section className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{['Subject ID', 'Name', 'Nationality', 'Born', 'Classification', 'Verification', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map((s: any) => (
                <tr key={s.id} className="hover:bg-cyan/5">
                  <td className="td font-mono text-cyan whitespace-nowrap"><Link href={`/dashboard/subjects/${s.id}`} className="hover:underline">{s.subjectId}</Link></td>
                  <td className="td font-semibold"><Link href={`/dashboard/subjects/${s.id}`} className="hover:text-cyan">{s.fullName}</Link></td>
                  <td className="td text-holo/70">{s.nationality || '—'}</td>
                  <td className="td font-mono text-[12px] text-holo/60">{s.dateOfBirth || '—'}</td>
                  <td className="td"><ClassTag v={s.classification} /></td>
                  <td className="td"><VerTag v={s.verificationStatus} /></td>
                  <td className="td"><StatusTag v={s.status} /></td>
                </tr>
              ))}
              {!data.items.length && <tr><td className="td text-holo/40" colSpan={7}>No records match your search or clearance.</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 font-mono text-[11px] text-holo/60">
            <span>{data.total} record{data.total === 1 ? '' : 's'}</span>
            <span className="flex items-center gap-2">
              <button className="btn-ghost px-2 py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>{page} / {pages}</span>
              <button className="btn-ghost px-2 py-1" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </span>
          </div>
        </section>
      )}
    </>
  );
}
