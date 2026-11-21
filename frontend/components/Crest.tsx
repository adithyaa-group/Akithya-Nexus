export default function Crest({ size = 48, glow = false, className = '' }: { size?: number; glow?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/akithya-crest.png"
      alt="Akithya Group crest"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', filter: glow ? 'drop-shadow(0 0 18px rgba(66,223,255,.45))' : undefined }}
    />
  );
}
