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
import Pipeline from "../lib/Pipeline.ts";
import { runWorkflow } from "../util.ts";

interface MyCtx {
  counter: number;
}

Deno.test("pipeline", async (t) => {
  const pipeline = new Pipeline<MyCtx, Metadata>({
    name: "test",
    version: "1.0.0",
    tags: ["test"],
    metadata: { key: "value" },
    ops: {
      push: async (_ctx, next) => {
        await next();
      },
      runFor: async (_ctx, next) => {
        await next();
      },
    },
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
});
