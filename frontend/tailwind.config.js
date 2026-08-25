/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        white: '#FFFDF7', // warm white
        gray: {
          50: '#F6F3E8', // warm cream
          100: '#F6F3E8', // warm cream
          200: '#DDE4D9', // light border
          300: '#DDE4D9', // light border
          400: '#66736B', // muted text
          500: '#66736B', // muted text
          600: '#66736B', // muted text
          700: '#17201B', // dark text
          800: '#17201B', // dark text
          900: '#17201B', // dark text
          950: '#17201B', // dark text
        },
        agri: {
          50:  '#F6F3E8', // warm cream
          100: '#DDE4D9', // light border
          200: '#DDE4D9', // light border
          300: '#2E8B57', // secondary green
          400: '#2E8B57', // secondary green
          500: '#176B3A', // primary agricultural green
          600: '#176B3A', // primary agricultural green
          700: '#124A2A', // deep green
          800: '#124A2A', // deep green
          900: '#124A2A', // deep green
          950: '#124A2A', // deep green
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
