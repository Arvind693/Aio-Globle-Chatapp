/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      textShadow: {
        sm: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        DEFAULT: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        lg: '3px 3px 6px rgba(0, 0, 0, 0.5)',
        glow: '0 0 8px rgba(255, 255, 255, 0.8)',
        'neon-blue': '0 0 10px rgba(0, 122, 255, 0.8)',
      },
      colors: {
        customYellow: '#f7db57',
        customGray:'	#9fb6c3'
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const textShadow = theme('textShadow');
      const textShadowUtilities = Object.entries(textShadow).map(([key, value]) => ({
        [`.text-shadow-${key}`]: { textShadow: value },
      }));

      addUtilities(textShadowUtilities);
    },
  ],
}

