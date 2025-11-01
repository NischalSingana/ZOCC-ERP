/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zocc-blue': {
          50: '#e6f0ff',
          100: '#b3d5ff',
          200: '#80baff',
          300: '#4d9fff',
          400: '#1a84ff',
          500: '#0069e5',
          600: '#0056b8',
          700: '#00438b',
          800: '#00305e',
          900: '#001d31',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

