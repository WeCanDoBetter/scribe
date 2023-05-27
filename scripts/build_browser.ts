import { emptyDir } from "https://deno.land/std@0.182.0/fs/mod.ts";
import { build } from "https://deno.land/x/esbuild@v0.17.19/mod.js";

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
