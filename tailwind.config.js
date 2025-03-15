// tailwind.config.js
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          beer: {
            light: '#F3E9D2',
            DEFAULT: '#E1B07E',
            dark: '#A66E42',
          },
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 1s ease-in-out',
        },
      },
    },
    plugins: [],
  }
  