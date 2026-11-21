'use client';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, pretty } from '@/lib/api';
import { ClassTag, StatusTag, VerTag } from '@/components/Tags';
import { ErrorBox, Loading } from '@/components/Page';
import SubjectForm from '@/components/SubjectForm';

const TABS = ['Identity Core', 'Family Matrix', 'Personal Archive', 'Education', 'Career', 'Financial', 'Medical', 'Relationships', 'Geographic', 'Digital Identity', 'Legal', 'Documents', 'Timeline'];

function Row({ k, v, mono = false }: { k: string; v: any; mono?: boolean }) {
  return (
    <div className="border-b border-cyan/10 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-cyan/60">{k}</dt>
      <dd className={`mt-0.5 ${mono ? 'font-mono text-[13px]' : ''} ${v ? '' : 'text-holo/30'}`}>{Array.isArray(v) ? (v.length ? v.join(', ') : '—') : v || '—'}</dd>
    </div>
  );
}

export default function SubjectProfile() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<any>(null);
  const [hist, setHist] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api(`/subjects/${id}`);
      setS(r);
      api(`/subjects/${id}/history`).then(setHist).catch(() => setHist([]));
    } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggle() {
    await api(`/subjects/${id}/${s.status === 'active' ? 'archive' : 'restore'}`, { method: 'POST' });
    load();
  }

  if (err) return <ErrorBox msg={err} />;
  if (!s) return <Loading />;

  return (
    <>
      {/* Identity header */}
      <section className="panel p-5 flex flex-wrap items-center gap-5">
        <div className="grid h-24 w-24 shrink-0 place-items-center border border-cyan/30 bg-midnight font-display text-3xl text-cyan/70" aria-label="No photograph on file">
          {s.fullName.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs tracking-[.25em] text-cyan">{s.subjectId}</div>
          <h1 className="font-display text-2xl tracking-wider text-holo break-words">{s.fullName}</h1>
          {s.preferredName && <div className="text-holo/60">Preferred: {s.preferredName}</div>}
          <div className="mt-2 flex flex-wrap gap-2"><StatusTag v={s.status} /><ClassTag v={s.classification} /><VerTag v={s.verificationStatus} /></div>
        </div>
        <div className="flex gap-2">
          {s.canEdit && !editing && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
          {s.canArchive && <button className="btn-ghost" onClick={toggle}>{s.status === 'active' ? 'Archive' : 'Restore'}</button>}
        </div>
      </section>

      {/* Tabs: only Identity Core is live in this phase */}
      <div role="tablist" aria-label="Profile modules" className="mt-4 flex gap-1 overflow-x-auto border-b border-cyan/20">
        {TABS.map((t, i) => (
          <button key={t} role="tab" aria-selected={i === 0} aria-disabled={i !== 0} disabled={i !== 0}
            className={`whitespace-nowrap px-3 py-2 font-display text-[10px] tracking-[.15em] uppercase ${i === 0 ? 'border-b-2 border-cyan text-cyan' : 'text-holo/25 cursor-not-allowed'}`}>{t}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        {editing ? (
          <div>
            <SubjectForm initial={s} submitLabel="Save changes" onCancel={() => setEditing(false)}
              onSubmit={async (body) => { await api(`/subjects/${id}`, { method: 'PATCH', body }); setEditing(false); load(); }} />
          </div>
        ) : (
          <div className="space-y-4">
            <section className="panel p-4">
              <h2 className="panel-title mb-2">Basic identity</h2>
              <dl className="grid gap-x-6 md:grid-cols-2">
                <Row k="Full legal name" v={s.fullName} /><Row k="Preferred name" v={s.preferredName} />
                <Row k="Previous names" v={s.previousNames} /><Row k="Authorized aliases" v={s.aliases} />
                <Row k="Date of birth" v={s.dateOfBirth} mono /><Row k="Place of birth" v={s.placeOfBirth} />
                <Row k="Nationality" v={s.nationality} /><Row k="Citizenship" v={s.citizenship} />
                <Row k="Gender" v={s.gender} /><Row k="Marital status" v={s.maritalStatus} />
                <Row k="Preferred language" v={s.preferredLanguage} /><Row k="Additional languages" v={s.additionalLanguages} />
              </dl>
            </section>
            <section className="panel p-4">
              <h2 className="panel-title mb-2">Physical description</h2>
              <dl className="grid gap-x-6 md:grid-cols-3">
                <Row k="Height" v={s.heightCm ? `${s.heightCm} cm` : ''} /><Row k="Eye color" v={s.eyeColor} /><Row k="Hair color" v={s.hairColor} />
              </dl>
              <Row k="General description" v={s.physicalDescription} /><Row k="Distinguishing characteristics" v={s.distinguishingFeatures} />
            </section>
            <section className="panel p-4">
              <h2 className="panel-title mb-2">Identification records {s.idsMasked && <span className="tag border-amber text-amber ml-2">masked</span>}</h2>
              <dl className="grid gap-x-6 md:grid-cols-3">
                <Row k="Passport" v={s.passportRef} mono /><Row k="National ID" v={s.nationalIdRef} mono /><Row k="Driving licence" v={s.drivingLicenseRef} mono />
              </dl>
            </section>
          </div>
        )}

        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="panel-title mb-2">Record metadata</h2>
            <dl>
              <Row k="Data source" v={pretty(s.dataSource)} /><Row k="Verification" v={pretty(s.verificationStatus)} />
              <Row k="Created" v={fmtDate(s.createdAt)} /><Row k="Last modified" v={fmtDate(s.updatedAt)} />
            </dl>
          </section>
          <section className="panel p-4">
            <h2 className="panel-title mb-2">Edit & access history</h2>
            <ul className="space-y-2 text-sm max-h-80 overflow-y-auto">
              {hist.map((h) => (
                <li key={h.seq} className="border-l-2 border-cyan/30 pl-3">
                  <div className={`font-mono text-[11px] ${h.success ? 'text-cyan' : 'text-alert'}`}>{h.action}</div>
                  <div className="text-holo/60">{h.username ?? 'system'} · {fmtDate(h.createdAt)}</div>
                </li>
              ))}
              {!hist.length && <li className="text-holo/40">History not available for your role or no events yet.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
