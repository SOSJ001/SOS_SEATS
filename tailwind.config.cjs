const config = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
  ],

  plugins: [require("flowbite/plugin")],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // flowbite-svelte
        primary: {
          50: "#FFF5F2",
          100: "#FFF1EE",
          200: "#FFE4DE",
          300: "#FFD5CC",
          400: "#FFBCAD",
          500: "#FE795D",
          600: "#EF562F",
          700: "#EB4F27",
          800: "#CC4522",
          900: "#A5371B",
        },
        // HI-FI public (fileKey r7WJ5vTjJU3Bl4fz4ZQfnV)
        brand: {
          DEFAULT: "#ff5a1f",
          soft: "#fff7ed",
          wash: "rgba(255, 90, 31, 0.04)",
          faint: "rgba(255, 90, 31, 0.03)",
          ghost: "rgba(255, 90, 31, 0.06)",
        },
        ink: {
          DEFAULT: "#12041c",
          secondary: "#6b5e78",
          muted: "#9a92b3",
          body: "#475569",
          seats: "#0f1729",
        },
        paper: {
          DEFAULT: "#ffffff",
          cream: "#faf8f5",
          border: "#e8e3dd",
        },
        slate: {
          public: "#0f172a",
          chip: "#1e293b",
        },
        accent: {
          blue: "#3b82f6",
          "blue-soft": "#eff6ff",
          "blue-wash": "rgba(59, 130, 246, 0.04)",
          green: "#10b981",
          "green-soft": "#ecfdf5",
          "green-wash": "rgba(16, 185, 129, 0.04)",
        },
      },
      fontFamily: {
        public: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        logo: ["Inter", '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "public-nav": "0 4px 8px rgba(18, 4, 28, 0.04)",
        "public-card":
          "0 2px 8px -4px rgba(18, 4, 28, 0.03), 0 12px 28px -10px rgba(18, 4, 28, 0.08)",
        "public-step":
          "0 2px 8px rgba(18, 4, 28, 0.03), 0 12px 28px rgba(18, 4, 28, 0.08)",
        "public-cta":
          "0 4px 12px rgba(0, 0, 0, 0.15), 0 12px 28px rgba(255, 90, 31, 0.25)",
        "public-search":
          "0 10px 12px rgba(18, 4, 28, 0.05), inset 0 2px 10px rgba(18, 4, 28, 0.04)",
        "public-badge": "0 6px 8px rgba(0, 0, 0, 0.08)",
        "public-fee": "0 8px 10px rgba(18, 4, 28, 0.05)",
        "hero-accent": "0 0 24px 8px rgba(255, 90, 31, 0.25)",
      },
      backgroundImage: {
        "public-page": "linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)",
        "public-hero-shade":
          "linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.8) 100%)",
        "public-hero-accent":
          "linear-gradient(90deg, rgba(255, 90, 31, 0.4), rgba(255, 90, 31, 0))",
        "public-card-image":
          "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)",
        "public-trust-fees":
          "linear-gradient(180deg, #ffffff 0%, rgba(255, 90, 31, 0.03) 100%)",
        "public-footer-accent":
          "linear-gradient(90deg, #ff5a1f, rgba(255, 90, 31, 0))",
      },
    },
  },
};

module.exports = config;
