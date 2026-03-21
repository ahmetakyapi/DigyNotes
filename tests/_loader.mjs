/**
 * Custom ESM loader hooks:
 * - Resolves `@/…` → `<project>/src/…`
 * - Resolves extensionless relative imports to `.ts` files
 * - Stubs unavailable bare modules (next/server, next-auth, etc.)
 * - Forces `.ts`/`.tsx` files to be treated as TypeScript modules
 *   (so --experimental-strip-types can process them)
 */

import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { constants } from "node:fs";

const SRC_ROOT = new URL("../src/", import.meta.url).href;

/**
 * Modules that are not available in the Node.js test environment
 * but are imported at the top level of source files.
 * These are replaced with empty stubs.
 */
const STUBBED_MODULES = new Set([
  "next/server",
  "next/server.js",
  "next-auth",
  "next-auth/providers/credentials",
  "sanitize-html",
]);

const STUB_URL = "test:stub";

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, nextResolve) {
  // 1. Stub unavailable bare modules
  if (STUBBED_MODULES.has(specifier)) {
    return { url: STUB_URL, shortCircuit: true };
  }

  // 2. Resolve @/ alias
  if (specifier.startsWith("@/")) {
    const mapped = SRC_ROOT + specifier.slice(2);
    return resolve(mapped, context, nextResolve);
  }

  // 3. Try to resolve extensionless imports to .ts/.tsx
  //    Works for relative ("./foo") AND absolute file:// URLs without extension
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const isFileUrl = specifier.startsWith("file://");
  const hasExtension = /\.\w+$/.test(specifier);

  if (!hasExtension && (isRelative || isFileUrl)) {
    const baseUrl = isFileUrl ? specifier : (context.parentURL ?? SRC_ROOT);
    const target = isFileUrl ? specifier : new URL(specifier, baseUrl).href;

    for (const ext of [".ts", ".tsx"]) {
      const candidate = target + ext;
      try {
        const candidatePath = fileURLToPath(candidate);
        if (await fileExists(candidatePath)) {
          return nextResolve(candidate, context);
        }
      } catch {
        // Not a valid file URL, skip
      }
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // Return empty stub for unavailable modules
  if (url === STUB_URL) {
    return {
      format: "module",
      source: `
        // sanitize-html stub
        const sanitizeHtml = (html) => html ?? "";
        sanitizeHtml.defaults = {
          allowedTags: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "br", "blockquote", "pre", "code"],
          allowedAttributes: { a: ["href", "target"] },
        };

        export default sanitizeHtml;
        export const NextResponse = { json: (data, opts) => ({ data, status: opts?.status ?? 200 }) };
        export const getServerSession = async () => null;
      `,
      shortCircuit: true,
    };
  }

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
