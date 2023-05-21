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

import { isGraph, isPipeline, isTask } from "./type-guards.ts";
import type { Tail, Workflow } from "./types.ts";

export enum EdgeType {
  Incoming,
  Outgoing,
}

export function noopAsync(): Promise<void> {
  return Promise.resolve();
}

/**
 * Runs a workflow for a given context.
 * @param workflow The workflow to run.
 * @param ctx The context to run the workflow for.
 * @param tail A function to run after the workflow has finished running.
 * @returns A promise that resolves when the workflow has finished running.
 * @template Ctx The context type.
 * @throws If the workflow throws an error.
 */
export async function runWorkflow<Ctx>(
  workflow: Workflow<Ctx>,
  ctx: Ctx,
  tail?: Tail<Ctx>,
) {
  if (isTask(workflow)) {
    await workflow(ctx, tail ? () => tail(ctx) : noopAsync);
  } else if (isPipeline(workflow)) {
    await workflow.runFor(ctx, tail ? () => tail(ctx) : undefined);
  } else if (isGraph(workflow)) {
    await workflow.runFor(ctx);
    if (tail) {
      await tail(ctx);
    }
  }
}
