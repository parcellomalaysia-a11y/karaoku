/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'n-red': '#E60012',
        'n-red-dark': '#B00010',
        'n-red-light': '#FF3347',
        'n-black': '#0A0A0A',
        'n-dark': '#1A1A1A',
        'n-gray': '#2A2A2A',
      },
    },
  },
  plugins: [],
}
