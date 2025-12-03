import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vrcore: {
          blue: "#1A73E8",
          darkBlue: "#0D47A1",
          lightBlue: "#E3F2FD",
          gray: "#F5F5F5",
        }
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        heading: ["Roboto", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;

