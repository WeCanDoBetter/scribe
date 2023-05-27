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

import type { Tail, Task, Workflow } from "./types.ts";
import { isGraph, isPipeline, isTask } from "./type-guards.ts";

/**
 * A promise that resolves immediately.
 */
export const noopAsync = Promise.resolve;

/**
 * A task that does nothing.
 */
export const noopTask: Task<any> = (_ctx, next) => {
  return next();
};

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

/**
 * Duplicates a workflow. If the workflow is a Task, it is returned as-is. If
 * `deep` is true, the workflow is duplicated deeply. Otherwise, the workflow is
 * duplicated shallowly.
 * @param workflow The workflow to duplicate.
 * @param deep Whether to duplicate the workflow deeply.
 */
export function duplicateWorkflow<Ctx>(workflow: Workflow<Ctx>, deep = false) {
  if (isPipeline(workflow)) {
    return workflow.duplicate({ deep });
  } else if (isGraph(workflow)) {
    return workflow.duplicate({ deep });
  }

  return workflow;
}

/**
 * The default operations for a Scribe instance. These operations do nothing, and
 * can be overridden by the user if desired.
 */
export function createDefaultScribeOps() {
  return {
    createPipeline: noopTask,
    createGraph: noopTask,
    createNode: noopTask,
  };
}

/**
 * The default operations for a node instance. These operations do nothing, and
 * can be overridden by the user if desired.
 */
export function createDefaultNodeOps() {
  return {
    addEdge: noopTask,
    removeEdge: noopTask,
    incoming: noopTask,
    outgoing: noopTask,
    runFor: noopTask,
    init: noopTask,
    run: noopTask,
    destroy: noopTask,
  };
}

/**
 * The default operations for a pipeline instance. These operations do nothing,
 * and can be overridden by the user if desired.
 */
export function createDefaultPipelineOps() {
  return {
    push: noopTask,
    runFor: noopTask,
  };
}

/**
 * The default operations for a graph instance. These operations do nothing, and
 * can be overridden by the user if desired.
 */
export function createDefaultGraphOps() {
  return {
    addNode: noopTask,
    addEdge: noopTask,
    removeNode: noopTask,
    removeEdge: noopTask,
    runFor: noopTask,
  };
}
