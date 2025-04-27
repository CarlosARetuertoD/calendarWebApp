/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors:{
        'color-button':'#2A2A2A'
      },
      animation: {
                 'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
                 'star-movement-top': 'star-movement-top linear infinite alternate',
                },
      keyframes: {
                'star-movement-bottom': {
                   '70%': { transform: 'translate(0%, 0%)', opacity: '2' },
                  '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
              },
                 'star-movement-top': {
                   '70%': { transform: 'translate(0%, 0%)', opacity: '2' },
                   '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
                 },
              },
    },
  },
  plugins: [
      require("@tailwindcss/forms"),
      require("@tailwindcss/typography"),
      require("@tailwindcss/line-clamp"),
      require("@tailwindcss/aspect-ratio"),
  ],
}

