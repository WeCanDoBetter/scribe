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

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import Scribe from "../lib/Scribe.ts";

Deno.test("scribe", async (t) => {
  let scribe: Scribe<any> | undefined = undefined;

  await t.step("create scribe instance", () => {
    scribe = new Scribe();
  });

  await t.step("should have no workflows", () => {
    assertEquals(scribe!.find().length, 0);
  });

  await t.step("should add and find a pipeline", async () => {
    await scribe!.createPipeline({});
    assertEquals(scribe!.find().length, 1);
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
});
