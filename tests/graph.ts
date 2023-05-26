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
import { Edge, Node } from "../mod.ts";

function noopTask() {
  return async (_ctx: AnyRecord, next: () => Promise<void>) => {
    await next();
  };
}

Deno.test("graph", async (t) => {
  const graph = new Graph<AnyRecord, Metadata>({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      addNode: noopTask(),
      addEdge: noopTask(),
      removeNode: noopTask(),
      removeEdge: noopTask(),
      runFor: noopTask(),
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

  await t.step("should throw an error when running with no start node", () => {
    const ctx = {};
    assertRejects(() => runWorkflow(graph, ctx), AggregateError, "Failed to run graph");
  });

  const node1 = new Node<AnyRecord, Metadata>({
    name: "node1",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      addEdge: noopTask(),
      removeEdge: noopTask(),
      incoming: noopTask(),
      outgoing: noopTask(),
      runFor: noopTask(),
      init: noopTask(),
      run: noopTask(),
      destroy: noopTask(),
    },
  });

  await t.step("should add a node", async () => {
    await graph.addNode(node1);
    assertEquals(graph.nodes.size, 1);
    assertEquals(graph.nodes.has(node1), true);
  });

  const node2 = new Node<AnyRecord, Metadata>({
    name: "node2",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      addEdge: noopTask(),
      removeEdge: noopTask(),
      incoming: noopTask(),
      outgoing: noopTask(),
      runFor: noopTask(),
      init: noopTask(),
      run: (c, next) => {
        const { output } = c;
        output.queue([...node1.edges.values()][0]);
        // TODO: Actually write to the output
        // We need at least two edges, so 3 nodes for this to work
        // Rewrite everything to use the output
        return next();
      },
      destroy: noopTask(),
    },
  });

  await t.step("should add another node", async () => {
    await graph.addNode(node2);
    assertEquals(graph.nodes.size, 2);
    assertEquals(graph.nodes.has(node2), true);
  });

  await t.step("should add an edge", async () => {
    await graph.addEdge(node1, node2);
    assertEquals(graph.edges.size, 1);
  });

  await t.step("should send a message over the edge", async () => {
    const ctx = { incoming: false, outgoing: false };

    node1.ops.outgoing = (ctx, next) => {
      ctx.ctx.outgoing = true;
      return next();
    };

    node2.ops.incoming = (ctx, next) => {
      ctx.ctx.incoming = true;
      return next();
    };

    await node1.process(node1.getEdges()[0], ctx);
    assertEquals(ctx.outgoing, true);
    assertEquals(ctx.incoming, true);
  });

  await t.step("should run a node", async () => {
    const ctx = { run: false };

    node2.ops.run = (ctx, next) => {
      ctx.ctx.run = true;
      return next();
    };

    await node2.runFor(ctx);
    assertEquals(ctx.run, true);
  });

  let edge: Edge<AnyRecord, Metadata> | undefined;

  await t.step("should throw an error writing to edge when written", async () => {
    edge = node1.getEdges()[0];
    edge.ops.write = (ctx, next) => {
      ctx.written = true;
      return next();
    };

    await assertRejects(
      () => edge!.write({}),
      "Edge has already been written. If this is intentional, then set `write` to `false` in the `write` operation.",
    );
  });

  await t.step("should remove an edge", async () => {
    await graph.removeEdge(node1.getEdges()[0]);
    assertEquals(graph.edges.size, 0);
  });

  await t.step("should remove a node", async () => {
    await graph.removeNode(node1);
    assertEquals(graph.nodes.size, 1);
    assertEquals(graph.nodes.has(node1), false);
  });
});
