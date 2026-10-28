import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espacio: '#030614',
        atmos: '#4fc3f7',
        oceano: '#1565c0',
        // Texto secundario: 80 % pasa AA sobre todos los fondos (ver utils/theme.ts)
        suave: 'rgba(255, 255, 255, 0.8)',
        card: 'rgba(255, 255, 255, 0.08)',
        'card-borde': 'rgba(255, 255, 255, 0.14)',
      },
      fontFamily: {
        sans: ['"DM Sans"', '"DM Sans Fallback"', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        // Banderas: nombrar la fuente emoji de cada sistema evita que el navegador la busque entre todas (es lento)
        emoji: ['"Apple Color Emoji"', '"Segoe UI Emoji"', '"Noto Color Emoji"', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        hero: '28px',
      },
      spacing: {
        tactil: '44px',
      },
      keyframes: {
        titilar: {
          from: { opacity: '0.2', transform: 'scale(1)' },
          to: { opacity: '1', transform: 'scale(1.4)' },
        },
        entrada: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-entrada': {
          from: { opacity: '0', transform: 'translate(-50%, -12px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        // Gráfico de 24 h: la curva se dibuja de izquierda a derecha
        revelar: {
          from: { clipPath: 'inset(0 100% 0 0)' },
          to: { clipPath: 'inset(0 0 0 0)' },
        },
        shimmer: {
          from: { backgroundPosition: '150% 0' },
          to: { backgroundPosition: '-50% 0' },
        },
        respirar: {
          '0%, 100%': { opacity: '0.75', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        // Íconos del clima
        'girar-lento': { to: { transform: 'rotate(360deg)' } },
        flotar: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' },
        },
        caer: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateY(8px)', opacity: '0' },
        },
        destello: {
          '0%, 88%, 100%': { opacity: '0.2' },
          '90%, 94%': { opacity: '1' },
        },
      },
      animation: {
        titilar: 'titilar var(--duracion) ease-in-out infinite alternate',
        entrada: 'entrada 350ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'toast-entrada': 'toast-entrada 300ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        revelar: 'revelar 900ms cubic-bezier(0.4, 0, 0.2, 1) 150ms both',
        shimmer: 'shimmer 1.4s linear infinite',
        respirar: 'respirar 6s ease-in-out infinite',
        girar: 'spin 0.8s linear infinite',
        'girar-lento': 'girar-lento 24s linear infinite',
        flotar: 'flotar 4s ease-in-out infinite',
        caer: 'caer 1.2s linear infinite',
        destello: 'destello 4s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
