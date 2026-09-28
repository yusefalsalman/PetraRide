/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        petra: {
          900: '#1E3A8A',
          700: '#1D4ED8',
          600: '#2563EB',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'pin-drop': {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '60%': { transform: 'translateY(4px)', opacity: '1' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        wave: 'wave 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
