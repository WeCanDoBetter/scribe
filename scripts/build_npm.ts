import { build, emptyDir } from "https://deno.land/x/dnt@0.36.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  scriptModule: "umd",
  shims: {
    crypto: true,
  },
  package: {
    name: "@wecandobetter/scribe",
    version: Deno.args[0]?.replace(/^v/, ""),
    description: "Scribe is an innovative context-aware workflow orchestrator.",
    author: "We Can Do Better (https://www.wcdb.life)",
    license: "GPLv3",
    contributors: [
      {
        name: "Michiel van der Velde",
        email: "michiel@wcdb.life",
        url: "https://www.wcdb.life",
      },
    ],
    repository: {
      type: "git",
      url: "git+https://github.com/WeCanDoBetter/scribe.git",
    },
    bugs: {
      url: "https://github.com/WeCanDoBetter/scribe/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE.md", "npm/LICENSE.md");
    Deno.copyFileSync("README.md", "npm/README.md");
    Deno.copyFileSync("SECURITY.md", "npm/SECURITY.md");
    Deno.copyFileSync("CONTRIBUTING.md", "npm/CONTRIBUTING.md");
    Deno.copyFileSync("ALPHA.md", "npm/ALPHA.md");
  },
});
