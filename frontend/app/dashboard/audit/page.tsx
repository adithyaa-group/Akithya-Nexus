'use client';
import { useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api';
import { ErrorBox, Loading, PageHead } from '@/components/Page';

export default function Audit() {
  const [page, setPage] = useState(1);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [chain, setChain] = useState<any>(null);

  useEffect(() => { api(`/audit?page=${page}&limit=40`).then(setD).catch((e) => setErr(e.message)); }, [page]);
  const pages = d ? Math.max(1, Math.ceil(d.total / 40)) : 1;

  return (
    <>
      <PageHead kicker="SECURITY COMMAND" title="Audit Trail">
        <button className="btn" onClick={() => api('/audit/verify').then(setChain).catch((e) => setErr(e.message))}>Verify integrity</button>
      </PageHead>
      {chain && (
        <div className={`mb-4 border p-3 font-mono text-sm ${chain.valid ? 'border-ok/50 text-ok bg-ok/5' : 'border-alert text-alert bg-alert/10'}`} role="status">
          {chain.valid ? `CHAIN INTACT — ${chain.checked} entries verified.` : `TAMPERING DETECTED at entry #${chain.brokenAtSeq} (${chain.checked} verified before the break).`}
        </div>
      )}
      {err && <ErrorBox msg={err} />}
      {!d && !err && <Loading />}
      {d && (
        <section className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{['#', 'Time', 'Operator', 'Action', 'Record', 'Result', 'IP'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {d.items.map((a: any) => (
                <tr key={a.seq}>
                  <td className="td font-mono text-[11px] text-holo/40">{a.seq}</td>
                  <td className="td font-mono text-[11px] whitespace-nowrap text-holo/60">{fmtDate(a.createdAt)}</td>
                  <td className="td">{a.username ?? 'system'}</td>
                  <td className="td font-mono text-[11px] text-cyan">{a.action}</td>
                  <td className="td font-mono text-[11px] text-holo/50">{a.entityType ?? ''}{a.entityId ? ` ${String(a.entityId).slice(0, 8)}` : ''}</td>
                  <td className="td"><span className={`tag ${a.success ? 'border-ok text-ok' : 'border-alert text-alert'}`}>{a.success ? 'ok' : 'fail'}</span></td>
                  <td className="td font-mono text-[11px] text-holo/40">{a.ip ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 font-mono text-[11px] text-holo/60">
            <span>{d.total} entries</span>
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
