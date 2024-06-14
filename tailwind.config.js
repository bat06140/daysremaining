/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      height: {
        "15p": "15%",
        "85p": "85%",
      },
      colors: {
        "notion-black": "#37352F",
      },
      fontFamily: {
        sans: ["Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
