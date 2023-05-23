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

import type { Metadata } from "../types.ts";
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import Node from "../lib/Node.ts";

interface MyCtx {
  counter: number;
}

Deno.test("node", async (t) => {
  const node = new Node<MyCtx, Metadata>({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      addEdge: async (_ctx, next) => {
        await next();
      },
      removeEdge: async (_ctx, next) => {
        await next();
      },
      incoming: async (_ctx, next) => {
        await next();
      },
      outgoing: async (_ctx, next) => {
        await next();
      },
      runFor: async (_ctx, next) => {
        await next();
      },
      init: async (_ctx, next) => {
        await next();
      },
      run: async (_ctx, next) => {
        await next();
      },
      destroy: async (_ctx, next) => {
        await next();
      },
    },
  });

  await t.step("should have the correct name", () => {
    assertEquals(node.name, "test");
    assertEquals(node.version, "1.0.0");
    assertEquals(node.tags, ["test"]);
    assertEquals(node.metadata, { key: "value" });
  });

  await t.step("should be initialized", () => {
    assertEquals(node.initialized, true);
  });

  await t.step("should not be corrupted", () => {
    assertEquals(node.corrupted, false);
  });

  await t.step("should have no edges", () => {
    assertEquals(node.edges.size, 0);
  });

  await t.step("should destroy the node", async () => {
    await node.destroy();
  });

  await t.step("should not be initialized", () => {
    assertEquals(node.initialized, false);
  });
});
