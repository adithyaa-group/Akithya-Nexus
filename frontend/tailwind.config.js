/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#06111F',
        deep: '#0B2033',
        intel: '#087FAD',
        cyan: { DEFAULT: '#42DFFF', dim: '#2aa8c4' },
        holo: '#D8F6FF',
        alert: '#ff5d73',
        amber: '#ffc857',
        ok: '#4dffb0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: { glow: '0 0 24px rgba(66,223,255,.25)', glowsm: '0 0 10px rgba(66,223,255,.35)' },
      keyframes: {
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: .35 } },
      },
      animation: { scan: 'scan 6s linear infinite', dot: 'pulseDot 2s ease-in-out infinite' },
    },
  },
  plugins: [],
};
