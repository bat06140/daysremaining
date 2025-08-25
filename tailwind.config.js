/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      height: {
        "03p": "0.3%",
        "15p": "15%",
        "85p": "85%",
      },
      colors: {
        "notion-black": "#37352F",
        "notion-light-gray-border": "#dfdfde",
      },
      fontFamily: {
        sans: ["Bebas Neue", "sans-serif"],
        mono: ["Roboto", "sans-serif"],
      },
      aspectRatio: {
        "1/2": "1 / 2",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      zIndex: {
        1: "1",
        2: "2",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
