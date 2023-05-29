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
import { runWorkflow } from "../util.ts";
import Scribe from "../lib/Scribe.ts";

interface MyCtx {
  counter: number;
}

const scribe = new Scribe<AnyRecord>();

Deno.test("pipeline", async (t) => {
  const pipeline = await scribe.createPipeline({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
  });

  await t.step("should have the correct name", () => {
    assertEquals(pipeline.name, "test");
    assertEquals(pipeline.version, "1.0.0");
    assertEquals(pipeline.tags, ["test"]);
    assertEquals(pipeline.metadata, { key: "value" });
  });

  await t.step("should have no workflows", () => {
    assertEquals(pipeline.workflows.length, 0);
  });

  await t.step("should add a task workflow", () => {
    pipeline.push(
      async (ctx, next) => {
        ctx.counter++;
        await next();
        ctx.counter++;
      },
    );

    assertEquals(pipeline.workflows.length, 1);
  });

  await t.step("should run the task", async () => {
    const ctx: MyCtx = { counter: 0 };

    await runWorkflow(pipeline, ctx, () => {
      assertEquals(ctx.counter, 1);
      return Promise.resolve();
    });

    assertEquals(ctx.counter, 2);
  });

  await t.step("should add and run a second workflow task", async () => {
    const ctx: MyCtx = { counter: 0 };

    pipeline.push(
      async (ctx, next) => {
        ctx.counter++;
        await next();
        ctx.counter++;
      },
    );

    assertEquals(pipeline.workflows.length, 2);

    await runWorkflow(pipeline, ctx, () => {
      assertEquals(ctx.counter, 2);
      return Promise.resolve();
    });

    assertEquals(ctx.counter, 4);
  });

  await t.step("should shallow duplicate", () => {
    const pipeline2 = pipeline.duplicate();

    assertEquals(pipeline.name, "test");
    assertEquals(pipeline.version, "1.0.0");
    assertEquals(pipeline.tags, ["test"]);
    assertEquals(pipeline.metadata, { key: "value" });

    assertNotEquals(pipeline, pipeline2);
    assertNotEquals(pipeline.id, pipeline2.id);

    assert(pipeline.workflows !== pipeline2.workflows);
  });

  await t.step("should deep duplicate", () => {
    const pipeline2 = pipeline.duplicate({ deep: true });

    assertEquals(pipeline.name, "test");
    assertEquals(pipeline.version, "1.0.0");
    assertEquals(pipeline.tags, ["test"]);
    assertEquals(pipeline.metadata, { key: "value" });

    assertNotEquals(pipeline, pipeline2);
    assertNotEquals(pipeline.id, pipeline2.id);

    assert(pipeline.workflows !== pipeline2.workflows);
  });

  await t.step("should throw an error when pushing empty workflows", () => {
    assertRejects(() => pipeline.push(), Error, "No workflows provided");
  });

  await t.step("should throw a push error", () => {
    pipeline.ops.push = () => {
      throw new Error("push error");
    };

    assertRejects(
      () =>
        pipeline.push(
          async (_ctx, next) => {
            await next();
          },
        ),
      AggregateError,
      "All pushes failed",
    );
  });

  await t.step("should throw a runFor error", () => {
    pipeline.ops.runFor = () => {
      throw new Error("runFor error");
    };

    assertRejects(
      () => pipeline.runFor({ counter: 0 }),
      AggregateError,
      "Pipeline failed",
    );
  });
});
