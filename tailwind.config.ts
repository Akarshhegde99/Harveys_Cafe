import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'garet': ['Garet', 'sans-serif'],
        'grimpt': ['Grimpt', 'serif'],
        'grimpt-brush': ['Grimpt Brush', 'cursive'],
        'grimpt-script': ['Grimpt Script', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
