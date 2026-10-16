/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lila: {
          dark: '#0A0E17',
          card: '#121824',
          cardBorder: '#1F293D',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.25)',
          neonGreen: '#39FF14',
          neonOrange: '#FF7700',
          neonRed: '#FF3366',
          neonPurple: '#B026FF',
          bot: '#8892B0',
          muted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
