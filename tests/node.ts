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

import type { AnyRecord } from "../types.ts";
import { assertEquals, assertRejects } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import Scribe from "../lib/Scribe.ts";

interface MyCtx {
  counter: number;
}

const scribe = new Scribe<AnyRecord>();

Deno.test("node", async (t) => {
  const node = await scribe.createNode({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
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

  await t.step("should be uninitialized", () => {
    assertEquals(node.initialized, false);
  });

  await t.step("should throw an error when running and not initialized", async () => {
    await assertRejects(() => node.runFor({ counter: 0 }), "Cannot run uninitialized node");
  });

  await t.step("should throw an error when destroying and not initialized", async () => {
    await assertRejects(() => node.destroy(), "Cannot destroy uninitialized node");
  });
});
