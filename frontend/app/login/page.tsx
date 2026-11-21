'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Crest from '@/components/Crest';
import { api } from '@/lib/api';

const BOOT = [
  '> NEXUS SECURE GATEWAY v1.0',
  '> TLS CHANNEL ........ ESTABLISHED',
  '> CREDENTIAL SERVICE .. ONLINE',
  '> AUDIT TRAIL ......... ACTIVE',
  '> AWAITING OPERATOR IDENTIFICATION',
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState(0);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLines((n) => (n < BOOT.length ? n + 1 : n)), 380);
    return () => clearInterval(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const r = mfaToken
        ? await api('/auth/mfa/verify', { method: 'POST', body: { mfaToken, code } })
        : await api('/auth/login', { method: 'POST', body: { identifier, password } });
      if (r.mfaRequired) { setMfaToken(r.mfaToken); setPassword(''); }
      else window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      if (mfaToken && /expired/i.test(err.message)) { setMfaToken(null); setCode(''); }
    } finally { setBusy(false); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan/10 to-transparent animate-scan" />
      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
        {/* Identity side */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start"><Crest size={190} glow /></div>
          <p className="mt-6 font-mono text-xs tracking-[.4em] text-cyan/70">AKITHYA GROUP</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-[.18em] text-holo" style={{ textShadow: '0 0 28px rgba(66,223,255,.45)' }}>N.E.X.U.S.</h1>
          <p className="mt-2 font-display text-[11px] tracking-[.28em] text-cyan">CENTRAL INTELLIGENCE DIVISION</p>
          <p className="mt-4 max-w-md mx-auto lg:mx-0 text-holo/60">National Executive eXchange &amp; Unified Intelligence System</p>
          <div className="mt-6 hidden lg:block panel p-4 font-mono text-[12px] leading-6 text-cyan/80 max-w-md" aria-hidden>
            {BOOT.slice(0, lines).map((l) => <div key={l}>{l}</div>)}
            {lines < BOOT.length && <span className="animate-dot">█</span>}
          </div>
        </motion.section>

        {/* Auth panel */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="panel p-6 sm:p-8 shadow-glow">
          <div className="flex items-center justify-between">
            <h2 className="panel-title">Operator Authentication</h2>
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-ok"><i className="h-2 w-2 rounded-full bg-ok animate-dot" /> SECURE CHANNEL</span>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {!mfaToken ? (
                <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <label htmlFor="identifier" className="label">User identification</label>
                    <input id="identifier" className="input" autoComplete="username" autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username or email" required />
                  </div>
                  <div>
                    <label htmlFor="password" className="label">Password</label>
                    <div className="relative">
                      <input id="password" className="input pr-16" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-widest text-cyan/80 hover:text-cyan">{show ? 'HIDE' : 'SHOW'}</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="mfa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label htmlFor="code" className="label">Two-factor verification code</label>
                  <input id="code" className="input text-center font-mono text-2xl tracking-[.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
                  <p className="mt-2 text-sm text-holo/50">Enter the 6-digit code from your authenticator app.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p role="alert" className="border border-alert/50 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

            <button className="btn w-full py-3" disabled={busy || (mfaToken ? code.length !== 6 : !identifier || !password)}>
              {busy ? 'Verifying…' : mfaToken ? 'Verify & Enter' : 'Authenticate'}
            </button>
            {mfaToken && <button type="button" className="btn-ghost w-full" onClick={() => { setMfaToken(null); setCode(''); setError(''); }}>Back</button>}
          </form>

          <div className="mt-5 flex justify-between text-sm">
            <button className="text-cyan/80 hover:text-cyan underline-offset-4 hover:underline" onClick={() => setHelp((h) => !h)}>Forgot password / account recovery</button>
          </div>
          {help && (
            <p className="mt-3 border border-cyan/20 bg-midnight/60 p-3 text-sm text-holo/70">
              Self-service recovery is not enabled yet. Contact your Supreme Administrator to have your credentials reset; all resets are recorded in the audit trail.
            </p>
          )}

          <p className="mt-6 border-t border-cyan/15 pt-4 font-mono text-[10px] leading-relaxed tracking-wider text-amber/80">
            ▲ CLASSIFIED SYSTEM — AUTHORIZED PERSONNEL ONLY. All access is monitored and recorded. Unauthorized access attempts are logged and reported.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
