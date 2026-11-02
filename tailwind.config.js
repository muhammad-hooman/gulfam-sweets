/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        m: {
          DEFAULT: '#6B0F1A',
          dark: '#45090F',
          soft: '#F8EDEE'
        },
        g: {
          DEFAULT: '#D4A62A',
          light: '#F3E2A9',
          dark: '#B8891A'
        },
        cream: '#FFF9EE'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

