/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IBAYTECH Dark Theme
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b0b0b0',
          300: '#808080',
          400: '#505050',
          500: '#1a1a1a', // Main dark background
          600: '#141414',
          700: '#0f0f0f',
          800: '#0a0a0a',
          900: '#000000', // Pure black
        },
        primary: {
          50: '#ffe6e6',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#ff3333',
          500: '#ff0000', // IBAYTECH red
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        accent: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff', // IBAYTECH blue accent
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        gradient: {
          blue: '#3b82f6',    // Gradient start
          purple: '#a855f7',  // Gradient middle
          pink: '#ec4899',    // Gradient middle-end
          red: '#ef4444',     // Gradient end
        },
      },
      backgroundImage: {
        'gradient-ibaytech': 'linear-gradient(90deg, #3b82f6, #a855f7, #ec4899, #ef4444)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
