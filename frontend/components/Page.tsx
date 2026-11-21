export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="font-mono text-[10px] tracking-[.3em] text-cyan/60">{kicker}</div>
        <h1 className="font-display text-2xl tracking-[.12em] text-holo">{title}</h1>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
export const Loading = ({ label = 'Retrieving data…' }) => <div className="panel p-6 font-mono text-sm text-cyan/70 animate-dot">{label}</div>;
export const ErrorBox = ({ msg }: { msg: string }) => <div role="alert" className="border border-alert/50 bg-alert/10 p-3 text-alert">{msg}</div>;
