import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espacio: '#030614',
        atmos: '#4fc3f7',
        oceano: '#1565c0',
        suave: 'rgba(255, 255, 255, 0.6)',
        card: 'rgba(255, 255, 255, 0.07)',
        'card-borde': 'rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      keyframes: {
        titilar: {
          from: { opacity: '0.2', transform: 'scale(1)' },
          to: { opacity: '1', transform: 'scale(1.4)' },
        },
        aparecer: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(20px)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        titilar: 'titilar var(--duracion) ease-in-out infinite alternate',
        aparecer: 'aparecer 0.3s ease',
        girar: 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
