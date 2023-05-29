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
import { assert, assertEquals, assertNotEquals, assertRejects } from "testing/asserts.ts";
import Scribe from "../lib/Scribe.ts";

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

  await t.step("should shallow duplicate", () => {
    const node2 = node.duplicate();

    assertEquals(node2.name, "test");
    assertEquals(node2.version, "1.0.0");
    assertEquals(node2.tags, ["test"]);
    assertEquals(node2.metadata, { key: "value" });

    assertNotEquals(node, node2);
    assertNotEquals(node.id, node2.id);
  });

  await t.step("should deep duplicate", () => {
    const node2 = node.duplicate({ deep: true });

    assertEquals(node2.name, "test");
    assertEquals(node2.version, "1.0.0");
    assertEquals(node2.tags, ["test"]);
    assertEquals(node2.metadata, { key: "value" });

    assertNotEquals(node, node2);
    assertNotEquals(node.id, node2.id);

    assert(node.ops !== node2.ops);
  });

  await t.step("should register and get a bool procedure on the api", () => {
    node.api.register("test-bool", true);
    assertEquals(node.api.get("test-bool"), true);
  });

  await t.step("should register and get a function procedure on the api", () => {
    node.api.register("test-procedure", true);
    assertEquals(node.api.get("test-procedure"), true);
  });

  await t.step("should register multiple procedures on the api", () => {
    node.api.register({
      name: "test-procedure2",
      value: true,
    }, {
      name: "test-procedure3",
      value: false,
    });

    assertEquals(node.api.get("test-fn2"), true);
    assertEquals(node.api.get("test-fn3"), false);
  });
});
