'use client';
import { useState } from 'react';
import { api, fmtDate } from '@/lib/api';
import { useSession } from '@/lib/session';
import { PageHead } from '@/components/Page';

export default function Account() {
  const { me } = useSession();
  const [setup, setSetup] = useState<any>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [enabled, setEnabled] = useState(false);

  if (!me) return null;
  return (
    <>
      <PageHead kicker="OPERATOR PROFILE" title="Account & Security" />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="panel-title mb-3">Identity</h2>
          <dl className="space-y-2 text-sm">
            {[['Name', me.fullName], ['Username', me.username], ['Designation', me.designation], ['Role', me.roleLabel], ['Clearance', `LEVEL ${String(me.clearance).padStart(2, '0')}`], ['Last login', fmtDate(me.lastLoginAt)]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-cyan/10 py-1"><dt className="font-mono text-[11px] uppercase tracking-widest text-cyan/60">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>
        <section className="panel p-4">
          <h2 className="panel-title mb-3">Two-factor authentication</h2>
          {me.mfaEnabled || enabled ? (
            <p className="text-ok font-mono text-sm">ENABLED — a code is required at every login.</p>
          ) : !setup ? (
            <>
              <p className="text-holo/60 mb-3">Protect this account with a time-based code from an authenticator app.</p>
              <button className="btn" onClick={async () => setSetup(await api('/auth/mfa/setup', { method: 'POST' }))}>Begin setup</button>
            </>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="Authenticator QR code" width={180} height={180} className="bg-white p-1" />
              <p className="font-mono text-[12px] break-all text-holo/60">Manual key: {setup.secret}</p>
              <label className="label" htmlFor="c">Enter the 6-digit code to confirm</label>
              <input id="c" className="input w-40 font-mono tracking-[.4em]" maxLength={6} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              {msg && <p role="alert" className="text-alert text-sm">{msg}</p>}
              <div><button className="btn" disabled={code.length !== 6} onClick={async () => { try { await api('/auth/mfa/enable', { method: 'POST', body: { code } }); setEnabled(true); } catch (e: any) { setMsg(e.message); } }}>Enable</button></div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
