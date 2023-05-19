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

import type Graph from "./lib/Graph.ts";
import type Pipeline from "./lib/Pipeline.ts";

/**
 * An object with string keys, can contain any value.
 */
export type AnyRecord = Record<string, any>;

/**
 * Executes the next task in the workflow.
 */
export type Next = () => Promise<void>;

/**
 * A task is a function that takes a context and a next function.
 * @template Ctx The context type.
 * @param ctx The context.
 * @param next The next function.
 * @returns A promise that resolves when the task is done.
 */
export type Task<Ctx> = (ctx: Ctx, next: Next) => Promise<void>;

/**
 * A workflow is a task, a pipeline or a graph.
 * @template Ctx The context type.
 */
export type Workflow<Ctx> = Task<Ctx> | Pipeline<Ctx> | Graph<Ctx>;

/**
 * A tail is a function that is called when the workflow is done.
 * @returns A promise that resolves when the tail is done.
 */
export type Tail<Ctx> = (ctx: Ctx) => Promise<void>;

/**
 * The metadata of a workflow. This is an object with string keys, can contain any value.
 */
export type Metadata = AnyRecord;
