/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6F0",
        terracotta: "#C97B4A",
        deepgreen: "#3A5A40",
        sand: "#E4D5C3",
        charcoal: "#3A3532",
      },
      fontFamily: {
        serif: ["Fraunces", "Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
}