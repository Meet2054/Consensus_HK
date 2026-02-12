const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Paths for scanning your files
  ],
  darkMode: "class", // Enable dark mode
  theme: {
    extend: {
      colors: {
        darkgreen: "#022926", // Add your custom color
      },
      animation: {
        bounce: "bounce 1s infinite", // Add custom bounce animation
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(100%)",
            animationTimingFunction: "ease-in-out",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "ease-in-out",
          },
        },
      },
    },
  },
  plugins: [
    addVariablesForColors, // Your custom plugin for color variables
  ],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g., var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
