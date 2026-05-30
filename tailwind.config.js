/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0b0c10',
        bgCard: '#1f2833',
        accentGold: '#f5af19',
        accentGreen: '#04d361',
      }
    },
  },
  plugins: [],
}