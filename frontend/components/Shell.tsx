'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Crest from './Crest';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

const LIVE = [
  { href: '/dashboard', label: 'Command Overview', icon: '◈' },
  { href: '/dashboard/subjects', label: 'Subject Registry', icon: '▤' },
];
const LOCKED = ['Family Matrix', 'Personal Archive', 'Education Archive', 'Career Intelligence', 'Financial Intelligence', 'Medical Archive', 'Relationship Archive', 'Geographic Archive', 'Digital Identity', 'Legal Archive', 'Document Vault', 'Life Timeline'];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { me } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [calm, setCalm] = useState(false);

  const admin = me?.role === 'supreme_admin';
  const audit = admin || me?.role === 'chief_officer';
  const items = [
    ...LIVE,
    ...(admin ? [{ href: '/dashboard/admin/users', label: 'Personnel Control', icon: '⚙' }] : []),
    ...(audit ? [{ href: '/dashboard/audit', label: 'Audit Trail', icon: '⛨' }] : []),
  ];
  const active = (h: string) => (h === '/dashboard' ? path === h : path.startsWith(h));

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  }

  return (
    <div className={`min-h-screen ${calm ? 'reduce-motion' : ''}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-cyan focus:text-midnight focus:px-3 focus:py-1">Skip to content</a>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cyan/20 bg-midnight/90 px-4 py-2 backdrop-blur">
        <button className="lg:hidden btn-ghost px-2 py-1" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button>
        <Crest size={38} />
        <div className="leading-tight">
          <div className="font-display text-sm tracking-[.25em] text-holo">N.E.X.U.S.</div>
          <div className="hidden sm:block font-mono text-[9px] tracking-[.25em] text-cyan/60">AKITHYA GROUP · CENTRAL INTELLIGENCE DIVISION</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:flex items-center gap-2 font-mono text-[10px] tracking-widest text-ok"><i className="h-2 w-2 rounded-full bg-ok animate-dot" />SESSION ACTIVE</span>
          <button className="btn-ghost px-2 py-1 text-[10px]" onClick={() => setCalm(!calm)} aria-pressed={calm} title="Toggle animations">{calm ? 'Motion off' : 'Motion on'}</button>
          {me && (
            <Link href="/dashboard/account" className="hidden sm:block text-right leading-tight hover:text-cyan">
              <div className="text-sm font-semibold">{me.fullName}</div>
              <div className="font-mono text-[10px] tracking-wider text-cyan/70">{me.designation} · LVL {String(me.clearance).padStart(2, '0')}</div>
            </Link>
          )}
          <button className="btn-ghost px-3 py-1.5" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <nav aria-label="Primary" className={`${open ? 'block' : 'hidden'} lg:block border-r border-cyan/15 bg-midnight/60 lg:min-h-[calc(100vh-57px)] lg:sticky lg:top-[57px] lg:self-start lg:max-h-[calc(100vh-57px)] overflow-y-auto`}>
          <ul className="p-3 space-y-1">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? 'page' : undefined}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2 font-display text-[11px] tracking-[.16em] uppercase transition ${active(i.href) ? 'border-cyan bg-cyan/10 text-cyan' : 'border-transparent text-holo/70 hover:bg-cyan/5 hover:text-cyan'}`}>
                  <span className="w-4 text-center">{i.icon}</span>{i.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 pt-4 pb-1 font-mono text-[9px] tracking-[.3em] text-cyan/50">DATABASE DIVISIONS</div>
          <ul className="p-3 pt-1 space-y-0.5">
            {LOCKED.map((l) => (
              <li key={l} className="flex items-center justify-between px-3 py-1.5 text-sm text-holo/30 cursor-not-allowed" aria-disabled="true">
                <span>{l}</span><span className="font-mono text-[8px] tracking-widest border border-holo/20 px-1">SOON</span>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
