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
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8deff',
          300: '#7ac5ff',
          400: '#34a6ff',
          500: '#0a88ff',
          600: '#0069e5',
          700: '#0052b8',
          800: '#044696',
          900: '#0a3d7a',
          950: '#052042',
        },
        'primary': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
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

