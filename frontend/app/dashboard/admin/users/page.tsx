'use client';
import { useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ErrorBox, Loading, PageHead } from '@/components/Page';

const ROLES: [string, string][] = [
  ['supreme_admin', 'Supreme Administrator'], ['chief_officer', 'Chief Intelligence Officer'], ['division_director', 'Division Director'],
  ['intelligence_officer', 'Intelligence Officer'], ['intelligence_analyst', 'Intelligence Analyst'], ['registered_user', 'Registered User'],
];
const blank = { username: '', email: '', fullName: '', designation: '', role: 'intelligence_analyst', clearance: '', password: '' };

export default function Personnel() {
  const { me } = useSession();
  const [users, setUsers] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState<any>(null);
  const [formErr, setFormErr] = useState('');

  const load = () => api('/users').then(setUsers).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: any) {
    try { await api(`/users/${id}`, { method: 'PATCH', body }); await load(); setErr(''); } catch (e: any) { setErr(e.message); }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); setFormErr('');
    const body: any = { ...form }; if (!body.clearance) delete body.clearance; else body.clearance = Number(body.clearance); if (!body.designation) delete body.designation;
    try { await api('/users', { method: 'POST', body }); setForm(null); load(); } catch (e: any) { setFormErr(e.message); }
  }

  if (!users && !err) return <Loading />;
  return (
    <>
      <PageHead kicker="ADMINISTRATIVE CONTROL CENTER" title="Personnel Control">
        <button className="btn" onClick={() => setForm(form ? null : { ...blank })}>{form ? 'Close' : '+ New Operator'}</button>
      </PageHead>
      {err && <div className="mb-4"><ErrorBox msg={err} /></div>}

      {form && (
        <form onSubmit={create} className="panel p-4 mb-4 grid gap-4 md:grid-cols-3">
          {[['username', 'Username'], ['email', 'Email'], ['fullName', 'Full name'], ['designation', 'Designation (optional)']].map(([k, l]) => (
            <div key={k}><label className="label">{l}</label><input className="input" value={form[k]} required={k !== 'designation'} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div><label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label">Clearance 1–9 (blank = role default)</label><input className="input" type="number" min={1} max={9} value={form.clearance} onChange={(e) => setForm({ ...form, clearance: e.target.value })} /></div>
          <div className="md:col-span-3"><label className="label">Initial password (12+ chars, upper/lower/number/symbol)</label>
            <input className="input" type="password" autoComplete="new-password" value={form.password} required onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          {formErr && <p role="alert" className="md:col-span-3 text-alert">{formErr}</p>}
          <div className="md:col-span-3"><button className="btn">Create operator</button></div>
        </form>
      )}

      {users && (
        <section className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{['Operator', 'Role', 'Clearance', 'MFA', 'Last login', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td className="td"><div className="font-semibold">{u.fullName}</div><div className="font-mono text-[11px] text-holo/50">{u.username} · {u.email}</div></td>
                    <td className="td"><select className="input py-1" disabled={self} value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} aria-label={`Role for ${u.username}`}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                    <td className="td"><select className="input py-1 w-20" value={u.clearance} onChange={(e) => patch(u.id, { clearance: Number(e.target.value) })} aria-label={`Clearance for ${u.username}`}>{[1,2,3,4,5,6,7,8,9].map((n) => <option key={n} value={n}>{String(n).padStart(2, '0')}</option>)}</select></td>
                    <td className="td font-mono text-[11px]">{u.mfaEnabled ? <span className="text-ok">ON</span> : <span className="text-holo/40">OFF</span>}</td>
                    <td className="td font-mono text-[11px] text-holo/60 whitespace-nowrap">{fmtDate(u.lastLoginAt)}</td>
                    <td className="td">
                      <select className="input py-1" disabled={self} value={u.status} onChange={(e) => patch(u.id, { status: e.target.value })} aria-label={`Status for ${u.username}`}>
                        <option value="active">Active</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
