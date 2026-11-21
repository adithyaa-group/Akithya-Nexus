'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, fmtDate, pretty } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ErrorBox, Loading, PageHead } from '@/components/Page';

function Card({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="panel-title">{label}</div>
      <div className="mt-2 font-display text-3xl text-holo">{value ?? '—'}</div>
      {sub && <div className="mt-1 font-mono text-[10px] text-holo/40">{sub}</div>}
    </div>
  );
}

function Bars({ data, color = '#42DFFF' }: { data: { key: string; count: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <p className="text-holo/40 text-sm">No records yet.</p>;
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.key}>
          <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-holo/70"><span>{pretty(d.key)}</span><span>{d.count}</span></div>
          <div className="mt-1 h-2 bg-midnight border border-cyan/15"><div className="h-full" style={{ width: `${(d.count / max) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Overview() {
  const { me } = useSession();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/dashboard').then(setD).catch((e) => setErr(e.message)); }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!d) return <Loading />;
  const maxAct = Math.max(1, ...d.activity.map((a: any) => a.count));
  const sec = d.system.security;

  return (
    <>
      <PageHead kicker={`WELCOME, ${me?.fullName?.toUpperCase() ?? 'OPERATOR'}`} title="Command Overview">
        <Link href="/dashboard/subjects" className="btn">Open Registry</Link>
      </PageHead>

      <section aria-label="Summary" className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <Card label="Total subject records" value={d.cards.totalSubjects} />
        <Card label="Active records" value={d.cards.activeSubjects} />
        <Card label="Archived records" value={d.cards.archivedSubjects} />
        {d.cards.operators !== null ? <Card label="Active operators" value={d.cards.operators} /> : <Card label="Clearance level" value={String(me?.clearance ?? '').padStart(2, '0')} />}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4"><h2 className="panel-title mb-3">Records by classification</h2><Bars data={d.byClassification} /></section>
        <section className="panel p-4"><h2 className="panel-title mb-3">Verification status</h2><Bars data={d.byVerification} color="#4dffb0" /></section>
        <section className="panel p-4">
          <h2 className="panel-title mb-3">Activity · 7 days</h2>
          <div className="flex h-32 items-end gap-2" role="img" aria-label="Activity over the last seven days">
            {d.activity.map((a: any) => (
              <div key={a.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full bg-cyan/70" style={{ height: `${Math.max(3, (a.count / maxAct) * 100)}%`, boxShadow: '0 0 8px rgba(66,223,255,.5)' }} title={`${a.count} events`} />
                <span className="mt-1 font-mono text-[9px] text-holo/40">{a.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="panel p-4">
          <h2 className="panel-title mb-3">System status</h2>
          <dl className="space-y-2 font-mono text-[12px]">
            {[
              ['API', d.system.api, d.system.api === 'operational'],
              ['Database', d.system.database, d.system.database === 'connected'],
              ['Backups', d.system.backup, false],
              ['Uptime', `${Math.floor(d.system.uptimeSeconds / 60)} min`, true],
            ].map(([k, v, ok]: any) => (
              <div key={k} className="flex justify-between"><dt className="text-holo/50">{k}</dt><dd className={ok ? 'text-ok' : 'text-amber'}>{String(v).toUpperCase()}</dd></div>
            ))}
            {sec && (
              <>
                <div className="flex justify-between"><dt className="text-holo/50">Logins 24h</dt><dd className="text-holo">{sec.successfulLogins24h}</dd></div>
                <div className="flex justify-between"><dt className="text-holo/50">Failed logins 24h</dt><dd className={sec.failedLogins24h ? 'text-alert' : 'text-holo'}>{sec.failedLogins24h}</dd></div>
                <div className="flex justify-between"><dt className="text-holo/50">Locked accounts</dt><dd className={sec.lockedAccounts ? 'text-alert' : 'text-holo'}>{sec.lockedAccounts}</dd></div>
              </>
            )}
          </dl>
        </section>
        <section className="panel p-4 overflow-x-auto">
          <h2 className="panel-title mb-3">Recent events</h2>
          <table className="w-full text-sm">
            <thead><tr><th className="th">Time</th><th className="th">Operator</th><th className="th">Action</th></tr></thead>
            <tbody>
              {d.recent.map((r: any) => (
                <tr key={r.seq}><td className="td font-mono text-[11px] text-holo/50 whitespace-nowrap">{fmtDate(r.createdAt)}</td><td className="td">{r.username ?? 'system'}</td>
                  <td className={`td font-mono text-[11px] ${r.success ? 'text-cyan' : 'text-alert'}`}>{r.action}</td></tr>
              ))}
              {!d.recent.length && <tr><td className="td text-holo/40" colSpan={3}>No events recorded.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
