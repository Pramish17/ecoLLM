/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a0f1e',
          50: '#0d1426',
          100: '#101829',
          200: '#141e33',
          300: '#1a2540',
          400: '#1f2d4e',
        },
        slate: {
          800: '#1e293b',
          900: '#0f172a',
        },
        green: {
          accent: '#00ff88',
        },
        cyan: {
          accent: '#00d4ff',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
