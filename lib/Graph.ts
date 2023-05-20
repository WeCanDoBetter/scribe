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

import type { Metadata, Workflow } from "../types.ts";
import Edge from "./Edge.ts";
import Node, { EdgeType } from "./Node.ts";
import SharedComponent, { SharedOptions } from "./SharedComponent.ts";

interface Ops<Ctx> extends Record<string, Workflow<any>> {
  // push: Workflow<{ workflow: Workflow<Ctx> }>;
  runFor: Workflow<{ ctx: Ctx }>;
}

export interface GraphOptions<Ctx, Meta extends Metadata> extends SharedOptions<Ops<Ctx>, Meta> {
  readonly nodes?: Node<Ctx, Metadata>[];
  readonly edges?: Edge<Ctx, Metadata>[];
}

/**
 * A directed acrylic graph. It is a collection of nodes and edges. Nodes are the operations that can be run,
 * and edges are the dependencies between those operations.
 * @template Ctx The context type.
 * @template Meta The metadata type.
 */
export default class Graph<Ctx, Meta extends Metadata = Metadata> extends SharedComponent<Ops<Ctx>, Meta> {
  /** The nodes that are in this graph. */
  #nodes: Set<Node<Ctx, Metadata>>;
  /** The edges that are in this graph. */
  #edges: Set<Edge<Ctx, Metadata>>;

  constructor(options: GraphOptions<Ctx, Meta>) {
    super(options);
    this.#nodes = new Set(options.nodes);
    this.#edges = new Set(options.edges);
  }

  /**
   * The nodes that are in this graph.
   */
  get nodes(): ReadonlySet<Node<Ctx, Metadata>> {
    return this.#nodes;
  }

  /**
   * The edges that are in this graph.
   */
  get edges(): ReadonlySet<Edge<Ctx, Metadata>> {
    return this.#edges;
  }

  /**
   * Run the graph for the given context. This will run all nodes that are not
   * targets of any edges, because those are the nodes that can be run first.
   * @pqaram ctx The context to run the graph for.
   * @returns A promise that resolves when the graph has been run.
   * @throws An `AggregateError` if any of the nodes fail to run.
   */
  runFor(ctx: Ctx): Promise<void> {
    const edges = [...this.#edges];
    const opsCtx = {
      ctx,
      // Get all nodes that are not targets of any edges, because those are the
      // nodes that can be run first. This is because the nodes that are targets
      // of edges will be run when the edges are run.
      targets: [...this.#nodes].filter((node) => {
        return edges.every((edge) => edge.target !== node);
      }),
    };

    return this.op("runFor", opsCtx, async () => {
      try {
        if (!opsCtx.targets.length) {
          throw new Error("Graph has no input nodes");
        }

        const results = await Promise.allSettled(
          opsCtx.targets.map((node) => node.write(EdgeType.Incoming, ctx)),
        );

        const rejected = results.filter((
          result,
        ): result is PromiseRejectedResult => result.status === "rejected");

        if (rejected.length) {
          const aggegrateError = new AggregateError(
            rejected.map((result) => result.reason),
            "Failed to run graph",
          );
          throw aggegrateError;
        }
      } catch (err) {
        const aggegrateError = err instanceof AggregateError ? err : new AggregateError(
          [err],
          "Failed to run graph",
        );
        throw aggegrateError;
      }
    });
  }
}
