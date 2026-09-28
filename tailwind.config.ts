import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bangla: ['Hind Siliguri', 'sans-serif'],
        sans: ['Poppins', 'Hind Siliguri', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#fef9ee',
          100: '#fdf0d3',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        saffron: '#FF9933',
        vermilion: '#E34234',
        // Semantic tokens — map to CSS variables (see globals.css :root /
        // .dark) so a single class like `bg-surface` or `text-body` resolves
        // to the right color in both themes, instead of hardcoding
        // `bg-white`/`text-gray-900` (light-only) everywhere.
        background:      'var(--background)',
        surface:         'var(--surface)',
        'surface-alt':   'var(--surface-alt)',
        body:            'var(--body)',
        muted:           'var(--muted)',
        border:          'var(--border)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  // Gates all `hover:` utilities behind `@media (hover: hover)`, so touch devices
  // never get stuck in a lingering :hover state that eats the first tap on
  // buttons/links (the classic "need 2-3 taps on mobile" issue).
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config
