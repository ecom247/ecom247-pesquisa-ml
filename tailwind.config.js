/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#FF6803',
          50: '#FFF0E6',
          100: '#FFD9B3',
          200: '#FFB366',
          300: '#FF8C1A',
          400: '#FF6803',
          500: '#E55C00',
          600: '#CC5200',
          700: '#994000',
          800: '#662B00',
          900: '#331500',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          100: '#111111',
          200: '#1A1A1A',
          300: '#222222',
          400: '#2A2A2A',
          500: '#333333',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-orange': 'pulseOrange 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 104, 3, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(255, 104, 3, 0)' },
        },
      },
    },
  },
  plugins: [],
}
