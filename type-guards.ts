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

import type { Task, Workflow } from "./types.ts";
import type Graph from "./lib/Graph.ts";
import type Pipeline from "./lib/Pipeline.ts";

/**
 * Checks if a workflow is a task.
 * @param workflow The workflow to check.
 * @returns True if the workflow is a task, false otherwise.
 * @template Ctx The context type.
 */
export function isTask<Ctx = unknown>(
  workflow: Workflow<Ctx>,
): workflow is Task<Ctx> {
  return typeof workflow === "function";
}

/**
 * Checks if a workflow is a pipeline.
 * @param workflow The workflow to check.
 * @returns True if the workflow is a pipeline, false otherwise.
 * @template Ctx The context type.
 */
export function isPipeline<Ctx = unknown>(
  workflow: Workflow<Ctx>,
): workflow is Pipeline<Ctx> {
  // NOTE: We do this and not `workflow instanceof Pipeline` because
  //      of a circular dependency issue when importing Pipeline.
  return typeof workflow === "object" && (workflow as Pipeline<Ctx>).push !== undefined;
}

/**
 * Checks if a workflow is a graph.
 * @param workflow The workflow to check.
 * @returns True if the workflow is a graph, false otherwise.
 * @template Ctx The context type.
 */
export function isGraph<Ctx = unknown>(
  workflow: Workflow<Ctx>,
): workflow is Graph<Ctx> {
  // NOTE: We do this and not `workflow instanceof Pipeline` because
  //      of a circular dependency issue when importing Graph.
  return typeof workflow === "object" && (workflow as Graph<Ctx>).addNode !== undefined;
}
