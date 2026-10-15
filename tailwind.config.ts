import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17102B",
        plum: "#241A44",
        haze: "#F3EEFF",
        truth: "#38BDF8",
        dare: "#FF4D6D",
        sun: "#FFD60A",
      },
      boxShadow: {
        pop: "5px 5px 0 0 #000",
        popsm: "3px 3px 0 0 #000",
      },
    },
  },
  plugins: [],
};
export default config;
