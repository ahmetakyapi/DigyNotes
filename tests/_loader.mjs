/**
 * Custom ESM loader hooks:
 * - Resolves `@/…` → `<project>/src/…`
 * - Forces `.tsx` files to be treated as TypeScript modules
 *   (so --experimental-strip-types can process them)
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SRC_ROOT = new URL("../src/", import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const mapped = SRC_ROOT + specifier.slice(2);
    return nextResolve(mapped, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file://")) return nextLoad(url, context);

  const path = fileURLToPath(url);

  // For .ts/.tsx files, read source and return as module-typescript
  // so --experimental-strip-types handles the type stripping
  if (path.endsWith(".ts") || path.endsWith(".tsx")) {
    const source = await readFile(path, "utf-8");
    return {
      format: "module-typescript",
      source,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
