import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    /* eslint-config-next 16 brings eslint-plugin-react-hooks 7, whose React Compiler rules
       flag patterns this codebase uses on purpose (prop → state sync and localStorage reads
       in effects, refs read during render for scroll/IntersectionObserver bookkeeping,
       Date.now() in render). The Next 14 config never ran them, the React Compiler is not
       enabled, and rewriting ~70 effects is not part of the Next 16 migration. Off until
       the compiler is adopted; every other react-hooks 7 rule stays on. */
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "node_modules/**", "next-env.d.ts"]),
]);
