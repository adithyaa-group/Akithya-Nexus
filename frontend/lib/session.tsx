'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type Me = {
  id: string; username: string; fullName: string; role: string; roleLabel: string; designation: string;
  clearance: number; mfaEnabled: boolean; lastLoginAt?: string;
};
const Ctx = createContext<{ me: Me | null }>({ me: null });
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { api('/auth/me').then((r) => setMe(r.user)).catch(() => {}); }, []);
  return <Ctx.Provider value={{ me }}>{children}</Ctx.Provider>;
}

export const WRITE_ROLES = ['supreme_admin', 'chief_officer', 'division_director', 'intelligence_officer'];
