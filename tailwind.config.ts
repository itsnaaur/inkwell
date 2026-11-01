import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        inkwell: {
          navy: 'var(--inkwell-navy)',
          'navy-light': 'var(--inkwell-navy-light)',
          'navy-dark': 'var(--inkwell-navy-dark)',
          'navy-muted': 'var(--inkwell-navy-muted)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 26 114 / 0.04), 0 1px 2px -1px rgb(0 26 114 / 0.04)',
        'card-hover': '0 10px 25px -5px rgb(0 26 114 / 0.08), 0 4px 6px -4px rgb(0 26 114 / 0.04)',
      },
    },
  },
  plugins: [],
}

export default config
