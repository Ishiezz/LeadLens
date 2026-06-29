/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50 : '#f0f4ff',
          100: '#dde6ff',
          200: '#c0d0ff',
          300: '#97b0ff',
          400: '#6b85ff',
          500: '#4a5eff',
          600: '#2e3aff',
          700: '#1e27e0',
          800: '#1920b5',
          900: '#191f8e',
          950: '#121255',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fadeIn'    : 'fadeIn 0.25s ease-out',
        'slideUp'   : 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slideDown' : 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scaleIn'   : 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer'   : 'shimmer 1.6s infinite',
        'pulse-dot' : 'pulseDot 1.4s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
        'progress'  : 'progress 0.6s cubic-bezier(0.16,1,0.3,1)',
        'glow'      : 'glow 2s ease-in-out infinite alternate',
        'float'     : 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn    : { from: { opacity: 0 },              to: { opacity: 1 } },
        slideUp   : { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown : { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn   : { from: { opacity: 0, transform: 'scale(0.96)' },      to: { opacity: 1, transform: 'scale(1)' } },
        shimmer   : { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseDot  : { '0%,100%': { transform: 'scale(0.7)', opacity: 0.4 }, '50%': { transform: 'scale(1)', opacity: 1 } },
        bounceDot : { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-6px)' } },
        progress  : { from: { width: '0%' } },
        glow      : { from: { boxShadow: '0 0 8px rgba(46,58,255,0.3)' }, to: { boxShadow: '0 0 20px rgba(46,58,255,0.6)' } },
        float     : { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      boxShadow: {
        'card'  : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'modal' : '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
        'input-focus': '0 0 0 3px rgba(46,58,255,0.12)',
      },
      borderRadius: {
        'xl'  : '12px',
        '2xl' : '16px',
        '3xl' : '24px',
      },
    },
  },
  plugins: [],
};
