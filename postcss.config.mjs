/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4: one plugin, vendor prefixes included (autoprefixer is no longer needed).
    "@tailwindcss/postcss": {},
  },
};

export default config;
