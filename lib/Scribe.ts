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

import SharedComponent, { SharedOptions } from "./SharedComponent.ts";
import { AnyRecord, Metadata, PartialBy, Workflow, WorkflowCtx } from "../types.ts";
import {
  createDefaultEdgeOps,
  createDefaultGraphOps,
  createDefaultNodeOps,
  createDefaultPipelineOps,
  createDefaultScribeOps,
} from "../util.ts";
import Graph, { GraphOptions } from "./Graph.ts";
import Node, { NodeOptions } from "./Node.ts";
import Pipeline, { PipelineOptions } from "./Pipeline.ts";
import { PartialOps } from "../mod.ts";

export interface Ops<Ctx> extends Record<string, Workflow<any>> {
  createPipeline: Workflow<
    { options: PartialBy<PipelineOptions<Ctx, AnyRecord>, "ops">; pipeline?: Pipeline<Ctx, Metadata> }
  >;
  createGraph: Workflow<{ options: PartialBy<GraphOptions<Ctx, AnyRecord>, "ops">; graph?: Graph<Ctx, Metadata> }>;
  createNode: Workflow<{ options: PartialBy<NodeOptions<Ctx, AnyRecord>, "ops">; node?: Node<Ctx, Metadata> }>;
}

/**
 * The Scribe class. This is the main class of the Scribe library. It is used
 * to create pipelines and graphs, and to run workflows. It is also used to
 * manage the workflows and nodes that are used by the pipelines and graphs.
 * @template Ctx The context type.
 */
export default class Scribe<Ctx> extends SharedComponent<Ops<Ctx>, Metadata, any> {
  /**
   * The default operations for each component type. These can be overridden
   * or extended by adding or replacing the operations.
   */
  static readonly defaultOps = {
    /** The default operations for a Scribe instance. */
    scribe: createDefaultScribeOps(),
    /** The default operations for a pipeline. */
    pipeline: createDefaultPipelineOps(),
    /** The default operations for a graph. */
    graph: createDefaultGraphOps(),
    /** The default operations for a node. */
    node: createDefaultNodeOps(),
    /** The default operations for an edge. */
    edge: createDefaultEdgeOps(),
  };

  /** The workflows that are used by this Scribe. */
  #workflows = new Set<Workflow<Ctx>>();
  /** The nodes that are used by this Scribe. */
  #nodes = new Set<Node<Ctx, Metadata>>();

  constructor(options?: PartialBy<SharedOptions<Ops<Ctx>, Metadata>, "ops">) {
    super({
      ...options ?? {},
      ops: {
        ...Scribe.defaultOps.scribe,
        ...options?.ops ?? {},
      },
    });
  }

  /**
   * Filter the workflows and return the first one that matches the filter.
   * @param filter The filter to use.
   */
  findOne(filter?: (workflow: Workflow<Ctx>) => boolean): Workflow<Ctx> | null {
    return filter ? [...this.#workflows].find(filter) ?? null : null;
  }

  /**
   * Filter the workflows and return the ones that match the filter.
   * @param filter The filter to use.
   */
  find(filter?: (workflow: Workflow<Ctx>) => boolean): Workflow<Ctx>[] {
    return filter ? [...this.#workflows].filter(filter) : [...this.#workflows];
  }

  /**
   * Check if the instance has any workflows that match the filter.
   * @param filter The filter to use.
   * @returns True if the instance has any workflows that match the filter.
   */
  has(filter?: (workflow: Workflow<Ctx>) => boolean): boolean {
    return filter ? [...this.#workflows].some(filter) : this.#workflows.size > 0;
  }

  /**
   * Remove the workflows that match the filter.
   * @param filter The filter to use.
   */
  remove(filter?: (workflow: Workflow<Ctx>) => boolean): number {
    const workflows = filter ? [...this.#workflows].filter(filter) : [...this.#workflows];
    for (const workflow of workflows) {
      this.#workflows.delete(workflow);
    }
    return workflows.length;
  }

  /**
   * Create a pipeline. This is the preferred way to create a pipeline.
   * @param options The options to use.
   * @returns The created pipeline.
   */
  async createPipeline(options?: PartialOps<PipelineOptions<Ctx, Metadata>>): Promise<Pipeline<Ctx, Metadata>> {
    const ctx: WorkflowCtx<Ops<Ctx>["createPipeline"]> = {
      options: options ?? {},
    };

    await this.op("createPipeline", ctx, () => {
      if (!ctx.pipeline) {
        ctx.pipeline = new Pipeline({
          ...options,
          ops: {
            ...Scribe.defaultOps.pipeline,
            ...options?.ops ?? {},
          },
        });
      }

      this.use(ctx.pipeline);
      return Promise.resolve();
    });

    return ctx.pipeline!;
  }

  /**
   * Create a graph. This is the preferred way to create a graph.
   * @param options The options to use.
   * @returns The created graph.
   */
  async createGraph(options?: PartialOps<GraphOptions<Ctx, Metadata>>): Promise<Graph<Ctx, Metadata>> {
    const ctx: WorkflowCtx<Ops<Ctx>["createGraph"]> = {
      options: options ?? {},
    };

    await this.op("createGraph", ctx, () => {
      if (!ctx.graph) {
        ctx.graph = new Graph({
          ...options ?? {},
          ops: {
            ...Scribe.defaultOps.graph,
            ...options?.ops ?? {},
          },
        });
      }

      this.use(ctx.graph);
      return Promise.resolve();
    });

    return ctx.graph!;
  }

  /**
   * Create a node. This is the preferred way to create a node.
   * @param options The options to use.
   * @returns The created node.
   */
  async createNode(options?: PartialOps<NodeOptions<Ctx, Metadata>>): Promise<Node<Ctx, Metadata>> {
    const ctx: WorkflowCtx<Ops<Ctx>["createNode"]> = {
      options: options ?? {},
    };

    await this.op("createNode", ctx, () => {
      if (!ctx.node) {
        ctx.node = new Node({
          ...options ?? {},
          ops: {
            ...Scribe.defaultOps.node,
            ...options?.ops ?? {},
          },
        });
      }

      this.use(ctx.node);
      return Promise.resolve();
    });

    return ctx.node!;
  }

  /**
   * Use one or more workflows or nodes. This will add the workflows or nodes
   * to the instance. It is preferred to use the `createPipeline`, `createGraph`,
   * and `createNode` methods instead of this method.
   * @param workflowsOrNodes The workflows or nodes to use.
   */
  use(...workflowsOrNodes: Workflow<Ctx>[] | Node<Ctx, Metadata>[]): Scribe<Ctx> {
    for (const workflowOrNode of workflowsOrNodes) {
      if (workflowOrNode instanceof Node) {
        this.#nodes.add(workflowOrNode);
      } else {
        this.#workflows.add(workflowOrNode);
      }
    }
    return this;
  }

  /**
   * Iterate over the workflows that are used by this instance.
   */
  [Symbol.iterator](): Iterator<Workflow<Ctx>> {
    return this.#workflows.values();
  }
}
