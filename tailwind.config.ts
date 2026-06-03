import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bangla: ['Hind Siliguri', 'sans-serif'],
        sans: ['Hind Siliguri', 'Inter', 'sans-serif'],
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
      },
    },
  },
  plugins: [],
}

export default config
