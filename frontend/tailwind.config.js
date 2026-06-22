/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Domaine"', '"Inter"', 'serif'],
        highlight: ['"ABC Favorit"', '"Inter"', 'sans-serif'],
        mono: ['"Commit Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        canvas: '#0a0a0a',
        surface: {
          DEFAULT: '#111111',
          raised: '#161616',
          hover: '#1a1a1a',
        },
        line: {
          DEFAULT: '#1e1e1e',
          strong: '#2a2a2a',
        },
        ink: {
          DEFAULT: '#ededed',
          muted: '#888888',
          faint: '#555555',
        },
        brand: {
          DEFAULT: '#c4a574',
          dim: 'rgba(196, 165, 116, 0.10)',
          light: '#d4b588',
        },
        danger: '#e5484d',
        success: '#30a46c',
      },
      boxShadow: {
        panel: '0 0 0 1px #1e1e1e',
        dropdown: '0 8px 30px rgba(0, 0, 0, 0.55)',
        modal: '0 16px 70px rgba(0, 0, 0, 0.65)',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
