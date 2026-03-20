/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6",
        background: "#FDFBF7",
        foreground: "#0a0a0a",
        muted: "#f5f5f5",
        "muted-foreground": "#737373",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [],
};
