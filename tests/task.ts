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

import type { Task } from "../types.ts";
import { assertEquals } from "testing/asserts.ts";
import { runWorkflow } from "../util.ts";

interface MyCtx {
  counter: number;
}

Deno.test("task", async (t) => {
  const ctx: MyCtx = { counter: 0 };

  const myTask: Task<MyCtx> = async (ctx, next) => {
    ctx.counter++;
    await next();
    ctx.counter++;
  };

  await t.step("should run the task", async () => {
    await runWorkflow(myTask, ctx, () => {
      assertEquals(ctx.counter, 1);
      return Promise.resolve();
    });

    assertEquals(ctx.counter, 2);
  });
});
