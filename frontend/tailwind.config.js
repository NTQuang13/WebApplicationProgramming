/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          500: '#1677d2',
          600: '#0f62b3',
          700: '#0c4f91',
        },
        ink: '#102033',
      },
      boxShadow: {
        soft: '0 18px 45px -28px rgba(15, 35, 66, 0.45)',
      },
    },
  },
  plugins: [],
}
