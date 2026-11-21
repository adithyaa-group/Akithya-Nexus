import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

function key(): Buffer {
  const k = process.env.NEXUS_ENC_KEY;
  if (!k) throw new Error('NEXUS_ENC_KEY is not set');
  return /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, 'hex') : scryptSync(k, 'nexus-static-salt', 32);
}
/** AES-256-GCM. Output: iv.tag.ciphertext (base64 parts) */
export function encrypt(plain?: string | null): string | null {
  if (!plain) return null;
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
export function decrypt(payload?: string | null): string | null {
  if (!payload) return null;
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
export function mask(v?: string | null): string | null {
  if (!v) return null;
  return '•'.repeat(Math.max(v.length - 4, 4)) + v.slice(-4);
}
