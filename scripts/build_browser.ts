/**
 * Scribe is an innovative context-aware workflow orchestrator.
 * Copyright (C) 2023 We Can Do Better
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { emptyDir } from "fs";
import { build } from "esbuild";

await emptyDir("./browser");

// Build browser bundle
await build({
  entryPoints: ["./mod.ts"],
  outfile: "./browser/scribe.js",
  bundle: true,
  format: "esm",
  sourcemap: true,
  target: "es2020",
});

// Minified version
await build({
  entryPoints: ["./mod.ts"],
  outfile: "./browser/scribe_min.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
});

console.log("Done");
// NOTE: Hack to prevent Deno from hanging
Deno.exit(0);
