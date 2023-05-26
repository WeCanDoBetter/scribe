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
import NodeAPI from "./NodeAPI.ts";
import Output from "./Output.ts";

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
  runFor: Workflow<{ ctx: Ctx; run: boolean; ran: boolean }>;
  init: Workflow<{ api: NodeAPI<Ctx, Meta>; initialize: boolean; initialized: boolean }>;
  run: Workflow<{ api: NodeAPI<Ctx, Meta>; ctx: Ctx; output: Output<Ctx> }>;
  destroy: Workflow<{ api: NodeAPI<Ctx, Meta>; destroy: boolean; destroyed: boolean }>;
}

export interface NodeOptions<Ctx, Meta extends Metadata> extends SharedOptions<Ops<Ctx, Meta>, Meta> {
  /** The edges that are connected to this node. */
  readonly edges?: Edge<Ctx, Metadata>[];
  /** The maximum number of contexts that can be active for this node. */
  readonly concurrency?: number;
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
          const output = new Output<Ctx>(this);
          const runCtx: { api: NodeAPI<Ctx, Meta>; ctx: Ctx; output: Output<Ctx> } = {
            api: this.api,
            ctx,
            output,
          };

          await this.op("run", runCtx);
          opCtx.ran = true;

          // Auto-flush the output if enabled and has not been flushed yet.
          if (!output.flushed && output.autoFlush && output.size) {
            try {
              await output.flush(ctx);
            } catch (err) {
              const aggegrateError = new AggregateError(
                [err],
                "Failed to flush output",
              );
              this.dispatchEvent(new SharedErrorEvent(aggegrateError));
              throw aggegrateError;
            }
          }
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
   * Read a context from an edge. This will queue the context for processing. If
   * the node is not currently looping, then it will start the loop.
   * @param edge The edge to read the context from.
   * @param ctx The context to read.
   * @returns A promise that resolves when the context has been read.
   * @throws An `AggregateError` if the context could not be read.
   * @throws An `Error` if the node is corrupted.
   * @throws An `Error` if the node is not initialized.
   */
  read(edge: Edge<Ctx, Metadata> | null, ctx: Ctx): Promise<void> {
    if (this.#corrupted) {
      throw new Error("Cannot read from corrupted node");
    } else if (!this.#initialized) {
      throw new Error("Cannot read from uninitialized node");
    }

    const opCtx = {
      edge,
      ctx,
      api: this.api,
      queue: true,
      queued: false,
    };

    return this.op("incoming", opCtx, () => {
      if (!opCtx.queue) {
        return Promise.resolve();
      } else if (opCtx.queue && opCtx.queued) {
        throw new Error(
          "Node has already been queued. If this is intentional, then set `queue` to `false` in the operation context.",
        );
      }

      this.#queue.push(ctx);
      opCtx.queued = true;

      // If the node is not looping, then start the loop
      if (!this.#looping) {
        this.#loop().catch((err) => {
          this.dispatchEvent(new SharedErrorEvent(err));
        });
      }

      return Promise.resolve();
    });
  }

  /**
   * Write a context to an edge.
   * @param edge The edge to write the context to.
   * @param ctx The context to write.
   * @returns A promise that resolves when the context has been written.
   * @throws An `AggregateError` if the context could not be written.
   * @throws An `Error` if the node is corrupted.
   * @throws An `Error` if the node is not initialized.
   */
  write(edge: Edge<Ctx, Metadata>, ctx: Ctx): Promise<void> {
    if (this.#corrupted) {
      throw new Error("Cannot write to corrupted node");
    } else if (!this.#initialized) {
      throw new Error("Cannot write to uninitialized node");
    }

    const opCtx = {
      edge,
      ctx,
      api: this.api,
      pass: true,
      passed: false,
    };

    return this.op("outgoing", opCtx, async () => {
      if (!opCtx.pass) {
        return;
      } else if (opCtx.pass && opCtx.passed) {
        throw new Error(
          "Node has already been passed. If this is intentional, then set `pass` to `false` in the operation context.",
        );
      }

      await edge.write(ctx);
      opCtx.passed = true;
    });
  }

  /**
   * Process an edge for this node. This method will call the `read` or `write` operation on the node.
   * @param edge The edge to process.
   * @param ctx The context to process the edge with.
   * @returns A promise that resolves when the edge has been processed.
   * @throws An `AggregateError` if the edge could not be processed.
   * @throws An `Error` if the edge does not belong to this node.
   * @throws An `Error` if the node is corrupted.
   * @throws An `Error` if the node is not initialized.
   */
  process(edge: Edge<Ctx, Metadata> | null, ctx: Ctx): Promise<void> {
    if (edge === null || edge.target === this) {
      return this.read(edge, ctx);
    } else if (edge.source === this) {
      return this.write(edge, ctx);
    } else {
      return Promise.reject(new Error("Edge does not belong to this node"));
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

      const opCtx = {
        api: this.api,
        initialize: true,
        initialized: false,
      };

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
      console.log(`Corrupted bool: ${this.#corrupted}`);
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
        const contexts = this.#queue.splice(0, this.concurrency ?? this.#queue.length);

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
