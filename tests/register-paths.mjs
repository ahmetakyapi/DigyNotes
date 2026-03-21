/**
 * Node.js custom loader hooks for the test runner:
 * Resolves `@/…` path aliases → `./src/…`
 *
 * Registered via `--import` flag and `module.register()`.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./tests/_loader.mjs", pathToFileURL("./"));
