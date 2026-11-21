'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHead } from '@/components/Page';
import SubjectForm from '@/components/SubjectForm';

export default function NewSubject() {
  const router = useRouter();
  return (
    <>
      <PageHead kicker="DATABASE · IDENTITY CORE" title="Create Subject Record" />
      <SubjectForm submitLabel="Create record" onCancel={() => router.back()}
        onSubmit={async (body) => { const r = await api('/subjects', { method: 'POST', body }); router.push(`/dashboard/subjects/${r.id}`); }} />
    </>
  );
}
