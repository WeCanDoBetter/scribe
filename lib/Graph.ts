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
import { noopAsync } from "../util.ts";
import Edge from "./Edge.ts";
import Node from "./Node.ts";
import { EdgeType } from "../util.ts";
import SharedComponent, { SharedOptions } from "./SharedComponent.ts";

interface Ops<Ctx> extends Record<string, Workflow<any>> {
  addNode: Workflow<{ node: Node<Ctx, Metadata>; add: boolean; added: boolean }>;
  addEdge: Workflow<{ source: Node<Ctx, Metadata>; target: Node<Ctx, Metadata>; add: boolean; added: boolean }>;
  removeNode: Workflow<{ node: Node<Ctx, Metadata>; remove: boolean; removed: boolean }>;
  removeEdge: Workflow<{ edge: Edge<Ctx, Metadata>; remove: boolean; removed: boolean }>;
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
   * Adds a node to the graph.
   * @param node The node to add.
   */
  addNode(node: Node<Ctx, Metadata>): Promise<void> {
    const opsCtx = { node, add: true, added: false };

    return this.op("addNode", opsCtx, () => {
      if (opsCtx.add) {
        node.graph = this;
        this.#nodes.add(node);
        opsCtx.added = true;
      }
      return Promise.resolve();
    });
  }

  /**
   * Adds an edge to the graph.
   * @param source The source node of the edge.
   * @param target The target node of the edge.
   */
  addEdge(source: Node<Ctx, Metadata>, target: Node<Ctx, Metadata>): Promise<void> {
    const opsCtx = { source, target, add: true, added: false };

    return this.op("addEdge", opsCtx, async () => {
      if (opsCtx.add) {
        const edge = new Edge(source, target, {
          ops: {
            write: noopAsync,
          },
        });
        await source.addEdge(edge);
        await target.addEdge(edge);
        this.#edges.add(edge);
        opsCtx.added = true;
      }
    });
  }

  /**
   * Removes a node from the graph.
   * @param node The node to remove.
   */
  removeNode(node: Node<Ctx, Metadata>): Promise<void> {
    const opsCtx = { node, remove: true, removed: false };

    return this.op("removeNode", opsCtx, async () => {
      if (opsCtx.remove) {
        for (const edge of opsCtx.node.edges) {
          await this.removeEdge(edge);
        }
        node.graph = undefined;
        this.#nodes.delete(node);
        opsCtx.removed = true;
      }
    });
  }

  /**
   * Removes an edge from the graph.
   * @param edge The edge to remove.
   */
  removeEdge(edge: Edge<Ctx, Metadata>): Promise<void> {
    const opsCtx = { edge, remove: true, removed: false };

    return this.op("removeEdge", opsCtx, async () => {
      if (opsCtx.remove) {
        await opsCtx.edge.source.removeEdge(edge);
        await opsCtx.edge.target.removeEdge(edge);
        this.#edges.delete(edge);
        opsCtx.removed = true;
      }
    });
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
