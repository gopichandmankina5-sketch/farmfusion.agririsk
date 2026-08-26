/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        white: '#FFFDF8', // warm white
        gray: {
          50: '#F7F1E7', // warm cream
          100: '#F7F1E7',
          200: '#DED3C5', // border
          300: '#DED3C5',
          400: '#75665B', // muted brown
          500: '#75665B',
          600: '#75665B',
          700: '#252525', // dark charcoal
          800: '#252525',
          900: '#252525',
          950: '#252525',
        },
        agri: {
          50:  '#F7F1E7', // warm cream
          100: '#DED3C5', // border
          200: '#DED3C5',
          300: '#C65A28', // primary terracotta
          400: '#C65A28',
          500: '#C65A28',
          600: '#C65A28',
          700: '#963F1F', // dark terracotta
          800: '#963F1F',
          900: '#963F1F',
          950: '#963F1F',
        },
        risk: {
          low:      '#2E8B57', // secondary green
          medium:   '#eab308',
          high:     '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      }
    },
  },
  plugins: [],
}
