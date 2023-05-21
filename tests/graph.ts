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

import { assertEquals, assertRejects } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import Graph from "../lib/Graph.ts";
import { AnyRecord, Metadata } from "../types.ts";
import { runWorkflow } from "../util.ts";

Deno.test("graph", async (t) => {
  const graph = new Graph<AnyRecord, Metadata>({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      runFor: async (_ctx, next) => {
        await next();
      },
    },
  });

  await t.step("should have the correct name", () => {
    assertEquals(graph.name, "test");
    assertEquals(graph.version, "1.0.0");
    assertEquals(graph.tags, ["test"]);
    assertEquals(graph.metadata, { key: "value" });
  });

  await t.step("should have no nodes", () => {
    assertEquals(graph.nodes.size, 0);
  });

  await t.step("should have no edges", () => {
    assertEquals(graph.edges.size, 0);
  });

  await t.step("should throw an error when running with no nodes", () => {
    const ctx = {};
    assertRejects(() => runWorkflow(graph, ctx), AggregateError, "Failed to run graph");
  });
});
