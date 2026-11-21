'use client';
import { useState } from 'react';
import { useSession, WRITE_ROLES } from '@/lib/session';

const list = (v: any) => (Array.isArray(v) ? v.join(', ') : v || '');
const toArr = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? 'md:col-span-2' : ''}><label className="label">{label}</label>{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="panel p-4">
      <legend className="panel-title px-2 bg-midnight">{title}</legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function SubjectForm({ initial, onSubmit, onCancel, submitLabel }: { initial?: any; onSubmit: (body: any) => Promise<void>; onCancel?: () => void; submitLabel: string }) {
  const { me } = useSession();
  const full = !!me && WRITE_ROLES.includes(me.role); // officers+ may change control fields
  const [f, setF] = useState<any>({
    fullName: '', preferredName: '', previousNames: '', aliases: '', dateOfBirth: '', placeOfBirth: '', nationality: '', citizenship: '',
    gender: '', preferredLanguage: '', additionalLanguages: '', maritalStatus: '', heightCm: '', eyeColor: '', hairColor: '',
    physicalDescription: '', distinguishingFeatures: '', passportRef: '', nationalIdRef: '', drivingLicenseRef: '',
    classification: 'CONFIDENTIAL', verificationStatus: 'user_provided', dataSource: 'administrator_entry',
    ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, Array.isArray(v) ? list(v) : v ?? ''])),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const inp = (k: string, props: any = {}) => <input className="input" value={f[k] ?? ''} onChange={set(k)} {...props} />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const body: any = { ...f };
    for (const k of ['previousNames', 'aliases', 'additionalLanguages']) body[k] = toArr(f[k] || '');
    body.heightCm = f.heightCm === '' ? undefined : Number(f.heightCm);
    // drop empty strings & server-managed fields
    for (const k of Object.keys(body)) if (body[k] === '' || body[k] === null) delete body[k];
    ['id', 'seq', 'subjectId', 'createdAt', 'updatedAt', 'createdById', 'ownerId', 'status', 'idsMasked', 'canEdit', 'canArchive'].forEach((k) => delete body[k]);
    if (!full) ['classification', 'verificationStatus', 'dataSource'].forEach((k) => delete body[k]);
    try { await onSubmit(body); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Section title="Basic identity">
        <Field label="Full legal name *">{inp('fullName', { required: true, minLength: 2 })}</Field>
        <Field label="Preferred name">{inp('preferredName')}</Field>
        <Field label="Previous names (comma separated)">{inp('previousNames')}</Field>
        <Field label="Authorized aliases (comma separated)">{inp('aliases')}</Field>
        <Field label="Date of birth">{inp('dateOfBirth', { type: 'date' })}</Field>
        <Field label="Place of birth">{inp('placeOfBirth')}</Field>
        <Field label="Nationality">{inp('nationality')}</Field>
        <Field label="Citizenship">{inp('citizenship')}</Field>
        <Field label="Gender (voluntary)">{inp('gender')}</Field>
        <Field label="Marital status (voluntary)">{inp('maritalStatus')}</Field>
        <Field label="Preferred language">{inp('preferredLanguage')}</Field>
        <Field label="Additional languages (comma separated)">{inp('additionalLanguages')}</Field>
      </Section>
      <Section title="Physical description">
        <Field label="Height (cm)">{inp('heightCm', { type: 'number', min: 30, max: 272 })}</Field>
        <Field label="Eye color">{inp('eyeColor')}</Field>
        <Field label="Hair color">{inp('hairColor')}</Field>
        <div />
        <Field label="General description" wide><textarea className="input min-h-[70px]" value={f.physicalDescription ?? ''} onChange={set('physicalDescription')} /></Field>
        <Field label="Distinguishing visible characteristics" wide><textarea className="input min-h-[70px]" value={f.distinguishingFeatures ?? ''} onChange={set('distinguishingFeatures')} /></Field>
      </Section>
      <Section title="Identification records · encrypted at rest">
        <Field label="Passport reference">{inp('passportRef', { autoComplete: 'off' })}</Field>
        <Field label="National ID reference">{inp('nationalIdRef', { autoComplete: 'off' })}</Field>
        <Field label="Driving licence reference">{inp('drivingLicenseRef', { autoComplete: 'off' })}</Field>
        {initial?.idsMasked && <p className="md:col-span-2 text-sm text-amber">Values are masked for your clearance. Masked fields are left unchanged on save.</p>}
      </Section>
      {full && (
        <Section title="Record control">
          <Field label="Classification">
            <select className="input" value={f.classification} onChange={set('classification')}>
              {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Verification status">
            <select className="input" value={f.verificationStatus} onChange={set('verificationStatus')}>
              {['verified', 'user_provided', 'imported', 'unverified', 'historical'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Data source">
            <select className="input" value={f.dataSource} onChange={set('dataSource')}>
              {['user_provided', 'authorized_import', 'administrator_entry', 'fictional_demo'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </Section>
      )}
      {err && <p role="alert" className="border border-alert/50 bg-alert/10 p-3 text-alert">{err}</p>}
      <div className="flex gap-3">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
