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

import { assertEquals } from "testing/asserts.ts";
import Scribe from "../lib/Scribe.ts";
import Node from "../lib/Node.ts";

Deno.test("scribe", async (t) => {
  let scribe: Scribe<any> | undefined = undefined;

  await t.step("create scribe instance", () => {
    scribe = new Scribe();
  });

  await t.step("should have no workflows", () => {
    assertEquals(scribe!.find().length, 0);
  });

  await t.step("should add and find a pipeline", async () => {
    await scribe!.createPipeline({ name: "test-pipeline" });
    assertEquals(scribe!.find().length, 1);
  });

  await t.step("should find a named pipeline with find()", () => {
    assertEquals(scribe!.find((w) => w.name === "test-pipeline").length, 1);
  });

  await t.step("should find a named pipeline with findOne()", () => {
    const p = scribe!.findOne((w) => w.name === "test-pipeline");
    assertEquals(p?.name, "test-pipeline");
  });

  await t.step("should find a named pipeline with has()", () => {
    assertEquals(scribe!.has((w) => w.name === "test-pipeline"), true);
  });

  await t.step("should add and find a graph", async () => {
    await scribe!.createGraph({});
    assertEquals(scribe!.find().length, 2);
  });

  await t.step("should add and find a task", () => {
    scribe!.use(
      async (_ctx, next) => {
        await next();
      },
    );
    assertEquals(scribe!.find().length, 3);
  });

  await t.step("should create a node", async () => {
    const node = await scribe!.createNode({});
    assertEquals(node instanceof Node, true);
  });

  await t.step("should remove a workflow", () => {
    const num = scribe!.remove((w) => scribe!.find()[0] === w);
    assertEquals(num, 1);
    assertEquals(scribe!.find().length, 2);
  });
});
