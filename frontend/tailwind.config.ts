import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F2745",
        navy: "#17365D",
        blue: "#2D5B91",
        mist: "#E7EEF7",
        paper: "#F7FAFC",
      },
    },
  },
  plugins: [],
};

export default config;
