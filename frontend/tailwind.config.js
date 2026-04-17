/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050816",
          900: "#0b1220",
          800: "#111a2d",
          700: "#18243b"
        }
      },
      boxShadow: {
        panel: "0 24px 60px rgba(2, 6, 23, 0.45)",
        glow: "0 18px 50px rgba(99, 102, 241, 0.18)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(14,165,233,0.14), transparent 24%), linear-gradient(180deg, #050816 0%, #08101d 100%)",
        "brand-gradient":
          "linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(139,92,246,1) 100%)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        rise: "rise 0.7s ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};
