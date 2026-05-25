/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F4D2A",
        secondary: "#1B6B3A",
        accent: "#2D9E5F",
        light: "#DCEEE4",
        surface: "#FFFFFF",
        dark: "#102319",
        muted: "#4F6F5A",
        danger: "#DC3545",
        warning: "#F5A623",
        forest: {
          50: "#eef7ef",
          100: "#d8eadb",
          200: "#b9d7bf",
          300: "#8fbd99",
          400: "#679f73",
          500: "#4c8357",
          600: "#3b6846",
          700: "#2f5339",
          800: "#274330",
          900: "#1f3828",
          950: "#102017"
        },
        sage: {
          50: "#f5f8f2",
          100: "#e7eee0",
          200: "#d2dfc6",
          300: "#b4c99f",
          400: "#95ad78",
          500: "#78935a",
          600: "#5f7547",
          700: "#4d5e3b",
          800: "#404d33",
          900: "#37432d"
        },
        cream: "#fbfdf8"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 16px 40px rgba(16, 32, 23, 0.10)"
      }
    }
  },
  plugins: []
};
