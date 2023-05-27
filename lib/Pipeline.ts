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

import type { Metadata, Next, Tail, Workflow } from "../types.ts";
import { duplicateWorkflow, runWorkflow } from "../util.ts";
import SharedComponent, { SharedErrorEvent, SharedOptions } from "./SharedComponent.ts";

export interface Ops<Ctx> extends Record<string, Workflow<any>> {
  push: Workflow<{ push: boolean; pushed: boolean; workflow: Workflow<Ctx> }>;
  runFor: Workflow<{ run: boolean; ran: boolean; ctx: Ctx }>;
}

export interface PipelineOptions<Ctx, Meta extends Metadata> extends SharedOptions<Ops<Ctx>, Meta> {
  /** The workflows of this pipeline. */
  readonly workflows?: Workflow<Ctx>[];
}

/**
 * A pipeline is a collection of workflows that are executed in order. The
 * context is passed to each workflow in the pipeline. The context is also
 * passed to the tail function when the pipeline is done. The tail function is
 * optional.
 * @template Ctx The context type.
 */
export default class Pipeline<Ctx, Meta extends Metadata = Metadata> extends SharedComponent<Ops<Ctx>, Meta> {
  /** The workflows of this pipeline. */
  #workflows: Workflow<Ctx>[];

  constructor(options: PipelineOptions<Ctx, Meta>) {
    super(options);
    this.#workflows = options.workflows ? [...options.workflows] : [];
  }

  /**
   * Gets the workflows of this pipeline.
   */
  get workflows(): ReadonlyArray<Workflow<Ctx>> {
    return this.#workflows;
  }

  /**
   * Pushes a workflow to the end of the pipeline.
   * @param workflows The workflows to push.
   * @returns A promise that resolves when the workflows are pushed.
   * @throws If no workflows are provided.
   * @throws If any of the workflows pushes fail.
   */
  async push(...workflows: Workflow<Ctx>[]): Promise<void> {
    if (!workflows.length) {
      throw new Error("No workflows provided");
    }

    const results = await Promise.allSettled(workflows.map((workflow) => {
      const ctx = { push: true, pushed: false, workflow };

      return this.op("push", ctx, () => {
        if (ctx.push) {
          this.#workflows.push(workflow);
          ctx.pushed = true;
        }
        return Promise.resolve();
      });
    }));

    const rejected = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];

    if (rejected.length) {
      const aggegrateError = new AggregateError(
        rejected.map((result) => result.reason),
        rejected.length === results.length ? "All pushes failed" : "Some pushes failed",
      );
      throw aggegrateError;
    }
  }

  /**
   * Runs the pipeline for the given context.
   * @param ctx The context.
   * @param tail The tail function.
   * @returns A promise that resolves when the pipeline is done.
   * @throws If the pipeline fails.
   * @throws If the tail fails.
   */
  async runFor(ctx: Ctx, tail?: Tail<Ctx>): Promise<void> {
    const opCtx = {
      run: true,
      ran: false,
      workflows: [...this.#workflows],
      ctx,
    };

    try {
      await this.op("runFor", opCtx, async () => {
        const workflows = [...opCtx.workflows];
        const next: Next = async () => {
          const workflow = workflows.shift();
          if (workflow) {
            await runWorkflow(workflow, ctx, next);
          } else if (tail) {
            await tail(ctx);
          }
        };

        if (opCtx.run) {
          await next();
          opCtx.ran = true;
        }
      });
    } catch (err) {
      const aggegrateError = new AggregateError([err], "Pipeline failed");
      this.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }
  }

  /**
   * Creates a duplicate of this pipeline. The duplicate will have the same
   * name, version, tags, metadata, and workflows.
   * @param options The options to override.
   */
  duplicate(options?: Partial<PipelineOptions<Ctx, Meta> & { deep?: boolean }>): Pipeline<Ctx, Meta> {
    return new Pipeline({
      name: options?.name ?? this.name,
      version: options?.version ?? this.version,
      tags: options?.tags ?? this.tags,
      metadata: options?.metadata ?? this.metadata,
      workflows: options?.deep
        ? this.#workflows.map((workflow) => duplicateWorkflow(workflow, options?.deep))
        : this.#workflows,
      ...options ?? {},
      ops: {
        ...options?.deep
          ? Object.entries(this.ops).reduce((ops, [key, op]) => {
            ops[key] = duplicateWorkflow(op, options.deep);
            return ops;
          }, {} as Ops<Ctx>)
          : this.ops,
        ...options?.ops ?? {},
      },
    });
  }

  [Symbol.iterator](): Iterator<Workflow<Ctx>> {
    return this.#workflows.values();
  }
}
