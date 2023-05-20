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

import { Graph } from "../mod.ts";
import type { Metadata, Workflow } from "../types.ts";
import { noopAsync } from "../util.ts";
import Edge from "./Edge.ts";
import SharedComponent, { SharedErrorEvent, SharedEvent, SharedOptions } from "./SharedComponent.ts";

interface Ops<Ctx, Meta extends Metadata> extends Record<string, Workflow<any>> {
  addEdge: Workflow<{
    source: Node<Ctx, Metadata>;
    target: Node<Ctx, Metadata>;
  }>;
  removeEdge: Workflow<{ edge: Edge<Ctx, Metadata> }>;
  write: Workflow<{
    type: EdgeType;
    ctx: Ctx;
    edges: Edge<Ctx, Metadata>[];
    write: boolean;
    written: boolean;
  }>;
  runFor: Workflow<{ ctx: Ctx }>;
  init: Workflow<{ api: NodeAPI<Ctx, Meta> }>;
  run: Workflow<{ api: NodeAPI<Ctx, Meta>; ctx: Ctx }>;
  destroy: Workflow<{ api: NodeAPI<Ctx, Meta> }>;
}

export interface NodeOptions<Ctx, Meta extends Metadata> extends SharedOptions<Ops<Ctx, Meta>, Meta> {
  /** The edges that are connected to this node. */
  readonly edges?: Edge<Ctx, Metadata>[];
  /** The maximum number of contexts that can be active for this node. */
  readonly concurrency?: number;
}

export enum EdgeType {
  Incoming,
  Outgoing,
}

export class NodeAPI<Ctx, Meta extends Metadata> {
  #node: Node<Ctx, Meta>;

  constructor(node: Node<Ctx, Meta>) {
    this.#node = node;
  }

  /**
   * The node this API is for.
   */
  get node(): Node<Ctx, Meta> {
    return this.#node;
  }
}

export class NodeInitializedEvent<Ctx, Meta extends Metadata = Metadata> extends SharedEvent {
  readonly node: Node<Ctx, Meta>;

  constructor(node: Node<Ctx, Meta>) {
    super("nodeInitialized", "The node has been initialized.");
    this.node = node;
  }
}

export class NodeInitializationErrorEvent<Ctx, Meta extends Metadata = Metadata> extends SharedEvent {
  readonly node: Node<Ctx, Meta>;
  readonly error: AggregateError;

  constructor(node: Node<Ctx, Meta>, error: AggregateError) {
    super("nodeInitializationError", "The node failed to initialize.");
    this.node = node;
    this.error = error;
  }
}

export default class Node<Ctx, Meta extends Metadata> extends SharedComponent<Ops<Ctx, Meta>, Meta> {
  /** The API for this node. */
  readonly api: NodeAPI<Ctx, Meta> = new NodeAPI(this);

  /** The graph this node belongs to, if any. */
  graph?: Graph<Ctx, Metadata>;

  /** The maximum number of contexts that can be active for this node. */
  concurrency?: number;

  /** Whether this node has been initialized. */
  #initialized = false;
  /** Whether this node has been corrupted (i.e. unusable). */
  #corrupted = false;
  /** Whether this node is looping. */
  #looping = false;
  /** The edges that are connected to this node. */
  #edges: Edge<Ctx, Metadata>[];
  /** The contexts that are currently active for this node. */
  #activeContexts = new Map<Ctx, number>();
  /** The contexts that are queued for this node. */
  #queue: Ctx[] = [];

  constructor(options: NodeOptions<Ctx, Meta>) {
    super(options);
    this.concurrency = options.concurrency;
    this.#edges = options.edges ? [...options.edges] : [];

    this.#init()
      .then(() => this.dispatchEvent(new NodeInitializedEvent(this)))
      .catch((err) =>
        // NOTE: Will also be called if the dispatch above throws an error.
        // Should we do something about that?
        this.dispatchEvent(new NodeInitializationErrorEvent(this, err))
      );
  }

  /**
   * Whether this node has been initialized.
   */
  get initialized(): boolean {
    return this.#initialized;
  }

  /**
   * Whether this node has been corrupted (i.e. unusable).
   */
  get corrupted(): boolean {
    return this.#corrupted;
  }

  /**
   * The edges that are connected to this node.
   */
  get edges(): ReadonlyArray<Edge<Ctx, Metadata>> {
    return this.#edges;
  }

  /**
   * The contexts that are currently active for this node.
   */
  get activeContexts(): ReadonlyMap<Ctx, number> {
    return this.#activeContexts;
  }

  /**
   * Get all edges that are connected to this node. If `type` is specified, then
   * only edges of that type will be returned. If `type` is not specified, then
   * all edges will be returned.
   * @param filter A filter function that determines which edges to return.
   * @returns The edges that are connected to this node and match the filter.
   */
  getEdges(
    filter: (edge: Edge<Ctx, Metadata>) => boolean,
  ): Edge<Ctx, Metadata>[] {
    return this.#edges.filter(filter);
  }

  /**
   * Add an edge to this node.
   * @param source The source node of the edge.
   * @param target The target node of the edge.
   * @returns A promise that resolves when the edge has been added.
   * @throws An `AggregateError` if the edge could not be added.
   */
  async addEdge(
    source: Node<Ctx, Metadata>,
    target: Node<Ctx, Metadata>,
  ): Promise<void> {
    try {
      if (!this.#initialized) {
        throw new Error("Cannot add edge to uninitialized node");
      } else if (this.#corrupted) {
        throw new Error("Cannot add edge to corrupted node");
      }

      await this.op("addEdge", { source, target }, () => {
        const edge = new Edge(source, target, {
          ops: {
            write: noopAsync,
          },
        });
        this.#edges.push(edge);
        return Promise.resolve();
      });
    } catch (error) {
      const aggegrateError = new AggregateError(
        [error],
        "Failed to add edge to node",
      );
      this.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }
  }

  /**
   * Remove an edge from this node.
   * @param edge The edge to remove.
   * @returns A promise that resolves when the edge has been removed.
   * @throws An `AggregateError` if the edge could not be removed.
   */
  async removeEdge(edge: Edge<Ctx, Metadata>): Promise<void> {
    try {
      if (!this.#initialized) {
        throw new Error("Cannot remove edge from uninitialized node");
      } else if (this.#corrupted) {
        throw new Error("Cannot remove edge from corrupted node");
      }

      await this.op("removeEdge", { edge }, () => {
        const index = this.#edges.indexOf(edge);
        if (index !== -1) {
          this.#edges.splice(index, 1);
        }
        return Promise.resolve();
      });
    } catch (error) {
      const aggegrateError = new AggregateError(
        [error],
        "Failed to remove edge from node",
      );
      this.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }
  }

  /**
   * Run this node for the given context.
   * @param ctx The context to run the node for.`
   * @returns A promise that resolves when the node has been run.
   * @throws An `AggregateError` if the node could not be run.
   */
  async runFor(ctx: Ctx): Promise<void> {
    try {
      if (!this.#initialized) {
        throw new Error("Cannot run uninitialized node");
      } else if (this.#corrupted) {
        throw new Error("Cannot run corrupted node");
      }

      await this.op(
        "runFor",
        { ctx },
        () => this.op("run", { api: this.api, ctx }),
      );
    } catch (err) {
      const aggegrateError = new AggregateError(
        [err],
        "Failed to run node for context",
      );
      this.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }
  }

  /**
   * Write to this node. If `type` is `EdgeType.Incoming`, then the context will
   * be added to the active contexts and the node will be run. If `type` is
   * `EdgeType.Outgoing`, then the context will be removed from the active
   * contexts and the context will be written to the edges.
   * @param type The type of edge to write to.
   * @param ctx The context to write.
   * @returns A promise that resolves when the context has been written.
   * @throws An `AggregateError` if the context could not be written.
   */
  async write(type: EdgeType, ctx: Ctx): Promise<void> {
    try {
      if (!this.#initialized) {
        throw new Error("Cannot write from or to uninitialized node");
      } else if (this.#corrupted) {
        throw new Error("Cannot write from or to corrupted node");
      }

      const opsCtx = {
        type,
        ctx,
        edges: this.getEdges((edge) => type === EdgeType.Incoming ? edge.target === this : edge.source === this),
        write: true,
        written: false,
        runStrategy: "full", // full means wait for edges to send the same context
      };

      await this.op("write", opsCtx, async () => {
        if (!opsCtx.write) {
          return;
        } else if (opsCtx.written) {
          throw new Error(
            "Context has already been written. If this is intentional, then set `write` to `false` in the `write` operation.",
          );
        } else if (!opsCtx.edges.length) {
          throw new Error("No edges to write to");
        }

        const read = () => {
          const count = (this.#activeContexts.get(ctx) ?? 0) + 1;
          this.#activeContexts.set(ctx, count);

          if (
            opsCtx.runStrategy === "full" &&
            count === this.getEdges((edge) => edge.target === this).length
          ) {
            this.#queue.push(ctx);
          } else if (opsCtx.runStrategy === "atomic") {
            this.#queue.push(ctx);
          }

          if (!this.#looping && this.#queue.length) {
            this.#loop().catch((err) => {
              this.dispatchEvent(new SharedErrorEvent(err));
            });
          }
        };

        // Write to the edges in parallel.
        const results = await Promise.allSettled(
          opsCtx.edges.map((edge) => edge.source === this ? edge.write(ctx) : read()),
        );

        const rejected = results.filter(
          (result): result is PromiseRejectedResult => result.status === "rejected",
        );

        if (rejected.length) {
          throw new AggregateError(
            rejected.map((result) => result.reason),
            "Failed to write to edges",
          );
        }

        opsCtx.written = true;
      });
    } catch (err) {
      const aggegrateError = new AggregateError(
        [err],
        "Failed to write to node",
      );
      this.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }
  }

  /**
   * Initialize this node. This method will call the `init` operation on the node.
   * @returns A promise that resolves when the node has been initialized.
   * @throws An `AggregateError` if the node could not be initialized.
   */
  async #init(): Promise<void> {
    try {
      if (this.#initialized) {
        throw new Error("Node is already initialized");
      } else if (this.#corrupted) {
        throw new Error("Node is corrupted");
      }

      await this.op("init", { api: this.api }, () => {
        this.#initialized = true;
        return Promise.resolve();
      });
    } catch (err) {
      this.#initialized = false;
      this.#corrupted = true;
      const aggegrateError = new AggregateError(
        [err],
        "Failed to initialize node",
      );
      throw aggegrateError;
    }
  }

  /**
   * Destroy this node. This method will call the `destroy` operation on the node.
   * @returns A promise that resolves when the node has been destroyed.
   * @throws An `AggregateError` if the node could not be destroyed.
   */
  async destroy(): Promise<void> {
    try {
      if (!this.#initialized) {
        throw new Error("Node is not initialized");
      } else if (this.#corrupted) {
        throw new Error("Node is corrupted");
      }

      await this.op("destroy", { api: this.api }, () => {
        this.#initialized = false;
        return Promise.resolve();
      });
    } catch (err) {
      this.#initialized = false;
      this.#corrupted = true;
      const aggegrateError = new AggregateError(
        [err],
        "Failed to destroy node",
      );
      throw aggegrateError;
    }
  }

  /**
   * Run this node for all contexts in the queue. This method will run the node
   * for `concurrency` contexts at a time. If `concurrency` is not specified,
   * then the node will be run for all contexts in the queue.
   * @throws If the node is already looping.
   */
  async #loop(): Promise<void> {
    if (this.#looping) {
      throw new Error("Node is already looping");
    }

    this.#looping = true;
    while (this.#queue.length) {
      try {
        const contexts = this.#queue.splice(0, this.concurrency);

        const results = await Promise.allSettled(
          contexts.map((ctx) => this.runFor(ctx)),
        );

        const rejected = results.filter(
          (result): result is PromiseRejectedResult => result.status === "rejected",
        );

        if (rejected.length) {
          throw new AggregateError(
            rejected.map((result) => result.reason),
            "Failed to run node for context(s)",
          );
        }
      } catch (err) {
        this.dispatchEvent(
          new SharedErrorEvent(
            err instanceof AggregateError ? err : new AggregateError([err], "Failed to run node for context(s)"),
          ),
        );
      }
    }
    this.#looping = false;
  }
}
