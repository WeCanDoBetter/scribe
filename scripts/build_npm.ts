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

import { build, emptyDir } from "dnt";

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
