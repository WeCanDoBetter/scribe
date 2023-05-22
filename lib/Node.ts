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
import type { SharedOptions } from "./SharedComponent.ts";
import SharedComponent, { SharedErrorEvent, SharedEvent } from "./SharedComponent.ts";
import Graph from "./Graph.ts";
import Edge from "./Edge.ts";

interface Ops<Ctx, Meta extends Metadata> extends Record<string, Workflow<any>> {
  addEdge: Workflow<{ edge: Edge<Ctx, Metadata>; add: boolean; added: boolean }>;
  removeEdge: Workflow<{ edge: Edge<Ctx, Metadata>; remove: boolean; removed: boolean }>;
  incoming: Workflow<{
    ctx: Ctx;
    edge: Edge<Ctx, Metadata> | null;
    api: NodeAPI<Ctx, Meta>;
    queue: boolean;
    queued: boolean;
  }>;
  outgoing: Workflow<{
    ctx: Ctx;
    edge: Edge<Ctx, Metadata>;
    api: NodeAPI<Ctx, Meta>;
    pass: boolean;
    passed: boolean;
  }>;
  write: Workflow<{
    edge: Edge<Ctx, Metadata> | null;
    ctx: Ctx;
    edges: Edge<Ctx, Metadata>[];
    write: boolean;
    written: boolean;
  }>;
  runFor: Workflow<{ ctx: Ctx; run: boolean; ran: boolean }>;
  init: Workflow<{ api: NodeAPI<Ctx, Meta>; initialize: boolean; initialized: boolean }>;
  run: Workflow<{ api: NodeAPI<Ctx, Meta>; ctx: Ctx }>;
  destroy: Workflow<{ api: NodeAPI<Ctx, Meta>; destroy: boolean; destroyed: boolean }>;
}

export interface NodeOptions<Ctx, Meta extends Metadata> extends SharedOptions<Ops<Ctx, Meta>, Meta> {
  /** The edges that are connected to this node. */
  readonly edges?: Edge<Ctx, Metadata>[];
  /** The maximum number of contexts that can be active for this node. */
  readonly concurrency?: number;
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
  #edges: Set<Edge<Ctx, Metadata>>;
  /** The contexts that are currently active for this node. */
  #activeContexts = new Map<Ctx, number>();
  /** The contexts that are queued for this node. */
  #queue: Ctx[] = [];

  constructor(options: NodeOptions<Ctx, Meta>) {
    super(options);
    this.concurrency = options.concurrency;
    this.#edges = new Set(options.edges ? [...options.edges] : []);

    this.#init()
      .then(() => this.dispatchEvent(new NodeInitializedEvent(this)))
      .catch((err) => {
        // NOTE: Will also be called if the dispatch above throws an error.
        // Should we do something about that?
        this.dispatchEvent(new NodeInitializationErrorEvent(this, err));
      });
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
  get edges(): ReadonlySet<Edge<Ctx, Metadata>> {
    return this.#edges;
  }

  /**
   * The contexts that are currently active for this node.
   */
  get activeContexts(): ReadonlyMap<Ctx, number> {
    return this.#activeContexts;
  }

  /**
   * Get all edges that are connected to this node.
   * @param filter A filter function that determines which edges to return.
   * @returns The edges that are connected to this node and match the filter.
   */
  getEdges(
    filter?: (edge: Edge<Ctx, Metadata>) => boolean,
  ): Edge<Ctx, Metadata>[] {
    return filter ? [...this.#edges].filter(filter) : [...this.#edges];
  }

  /**
   * Add an edge to this node.
   * @param edge The edge to add.
   * @returns A promise that resolves when the edge has been added.
   * @throws An `AggregateError` if the edge could not be added.
   */
  async addEdge(
    edge: Edge<Ctx, Metadata>,
  ): Promise<void> {
    try {
      if (this.#corrupted) {
        throw new Error("Cannot add edge to corrupted node");
      } else if (!this.#initialized) {
        throw new Error("Cannot add edge to uninitialized node");
      }

      const opCtx = { edge, add: true, added: false };

      await this.op("addEdge", opCtx, () => {
        if (opCtx.added && opCtx.add) {
          throw new Error(
            "Edge has already been added. If this is intentional, then set `add` to `false` in the operation context.",
          );
        } else if (opCtx.add) {
          this.#edges.add(edge);
          opCtx.added = true;
        }
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
      if (this.#corrupted) {
        throw new Error("Cannot remove edge from corrupted node");
      } else if (!this.#initialized) {
        throw new Error("Cannot remove edge from uninitialized node");
      }

      const opCtx = { edge, remove: true, removed: false };

      await this.op("removeEdge", opCtx, () => {
        if (opCtx.removed && opCtx.remove) {
          throw new Error(
            "Edge has already been removed. If this is intentional, then set `remove` to `false` in the operation context.",
          );
        } else if (opCtx.remove) {
          opCtx.removed = this.#edges.delete(edge);
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
      if (this.#corrupted) {
        throw new Error("Cannot run corrupted node");
      } else if (!this.#initialized) {
        throw new Error("Cannot run uninitialized node");
      }

      const opCtx = { ctx, run: true, ran: false };

      await this.op("runFor", opCtx, async () => {
        if (opCtx.ran && opCtx.run) {
          throw new Error(
            "Node has already been run. If this is intentional, then set `run` to `false` in the `runFor` operation context.",
          );
        } else if (opCtx.run) {
          await this.op("run", { api: this.api, ctx });
          opCtx.ran = true;
        }
      });
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
  async write(edge: Edge<Ctx, Metadata> | null, ctx: Ctx): Promise<void> {
    try {
      if (this.#corrupted) {
        throw new Error("Cannot write from or to corrupted node");
      } else if (!this.#initialized) {
        throw new Error("Cannot write from or to uninitialized node");
      }

      const opCtx = {
        edge,
        ctx,
        edges: this.getEdges((e) => e.target === this ? e.source === this : e.target === this),
        write: true,
        written: false,
      };

      await this.op("write", opCtx, async () => {
        if (!opCtx.write) {
          return;
        } else if (opCtx.written && opCtx.write) {
          throw new Error(
            "Context has already been written. If this is intentional, then set `write` to `false` in the `write` operation.",
          );
        } else if (!opCtx.edges.length) {
          throw new Error("No edges to write to");
        }

        const read = async () => {
          const count = (this.#activeContexts.get(ctx) ?? 0) + 1;
          this.#activeContexts.set(ctx, count);

          const incomingCtx = { ctx, edge, api: this.api, queue: true, queued: false };
          await this.op("incoming", incomingCtx, () => {
            if (!incomingCtx.queue) {
              return Promise.resolve();
            } else if (incomingCtx.queued && incomingCtx.queue) {
              throw new Error(
                "Context has already been queued. If this is intentional, then set `queue` to `false` in the `incoming` operation.",
              );
            }
            this.#queue.push(ctx);
            incomingCtx.queued = true;
            return Promise.resolve();
          });

          if (!this.#looping && this.#queue.length) {
            this.#loop().catch((err) => {
              this.dispatchEvent(new SharedErrorEvent(err));
            });
          }
        };

        // Write to the edges in parallel.
        const results = await Promise.allSettled(
          opCtx.edges.map((e) => e.source === this ? e.write(ctx) : read()),
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

        opCtx.written = true;
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
      if (this.#corrupted) {
        throw new Error("Node is corrupted");
      } else if (this.#initialized) {
        throw new Error("Node is already initialized");
      }

      const opCtx = { api: this.api, initialize: true, initialized: false };
      await this.op("init", opCtx, () => {
        if (!opCtx.initialize) {
          return Promise.resolve();
        } else if (this.#initialized) {
          throw new Error(
            "Node has already been initialized. If this is intentional, then set `initialize` to `false` in the `init` operation.",
          );
        }
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
      if (this.#corrupted) {
        throw new Error("Node is corrupted");
      } else if (!this.#initialized) {
        throw new Error("Node is not initialized");
      }

      const opCtx = { api: this.api, destroy: true, destroyed: false };

      await this.op("destroy", opCtx, () => {
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
    if (this.#corrupted) {
      throw new Error("Node is corrupted");
    } else if (!this.#initialized) {
      throw new Error("Node is not initialized");
    } else if (this.#looping) {
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
