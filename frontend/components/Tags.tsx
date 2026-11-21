import { pretty } from '@/lib/api';

const CLS: Record<string, string> = {
  UNCLASSIFIED: 'border-holo/40 text-holo/70',
  CONFIDENTIAL: 'border-cyan text-cyan',
  SECRET: 'border-amber text-amber',
  TOP_SECRET: 'border-alert text-alert',
};
const VER: Record<string, string> = {
  verified: 'border-ok text-ok', user_provided: 'border-cyan text-cyan', imported: 'border-intel text-intel',
  unverified: 'border-amber text-amber', historical: 'border-holo/40 text-holo/60', archived: 'border-holo/40 text-holo/60',
};
export const ClassTag = ({ v }: { v: string }) => <span className={`tag ${CLS[v] || ''}`}>{pretty(v)}</span>;
export const VerTag = ({ v }: { v: string }) => <span className={`tag ${VER[v] || ''}`}>{pretty(v)}</span>;
export const StatusTag = ({ v }: { v: string }) => (
  <span className={`tag ${v === 'active' ? 'border-ok text-ok' : 'border-holo/40 text-holo/60'}`}>{v}</span>
);
