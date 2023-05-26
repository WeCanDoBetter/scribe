import type { Metadata } from "../types.ts";
import type Node from "./Node.ts";
import type Edge from "./Edge.ts";
import { SharedErrorEvent } from "./SharedComponent.ts";

/**
 * Queues edges for the context to be sent to.
 * @template Ctx The context type.
 */
export default class Output<Ctx> {
  /** The node that this output belongs to. */
  readonly node: Node<Ctx, Metadata>;
  /** Whether this output should automatically flush. */
  autoFlush = true;

  /** Whether this output has been flushed. */
  #flushed = false;
  /** The edges that are connected to this output. */
  #edges = new Set<Edge<Ctx, Metadata>>();

  constructor(node: Node<Ctx, Metadata>) {
    this.node = node;
  }

  /**
   * Whether this output has been flushed.
   */
  get flushed(): boolean {
    return this.#flushed;
  }

  /**
   * The edges that are connected to this output.
   */
  get edges(): ReadonlySet<Edge<Ctx, Metadata>> {
    return this.#edges;
  }

  /**
   * The number of edges that are connected to this output.
   */
  get size(): number {
    return this.#edges.size;
  }

  /**
   * Queue an edge.
   * @param edge The edge to queue.
   * @throws If the queue has already been flushed.
   */
  queue(edge: Edge<Ctx, Metadata>): void {
    if (this.#flushed) {
      throw new Error("Queue has already been flushed.");
    } else if (this.#edges.has(edge)) {
      throw new Error("Edge has already been queued.");
    } else if (edge.source !== this.node) {
      throw new Error("Edge does not belong to this node.");
    }

    this.#edges.add(edge);
  }

  /**
   * Remove an edge from the queue.
   * @param edge The edge to remove.
   * @throws If the queue has already been flushed.
   * @returns Whether the edge was removed.
   */
  remove(edge: Edge<Ctx, Metadata>): boolean {
    if (this.#flushed) {
      throw new Error("Queue has already been flushed.");
    }

    return this.#edges.delete(edge);
  }

  /**
   * Flush the queue. This will write the given context to all edges in the queue.
   * @param ctx The context to write.
   * @throws If the queue has already been flushed.
   * @throws If one or more edges failed to process.
   */
  async flush(ctx: Ctx): Promise<void> {
    if (this.#flushed) {
      throw new Error("Queue has already been flushed.");
    }

    const results = await Promise.allSettled([...this.#edges].map((edge) => edge.source.process(edge, ctx)));

    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

    if (rejected.length) {
      const aggegrateError = new AggregateError(
        rejected.map((result) => result.reason),
        "One or more edges failed to process.",
      );
      this.node.dispatchEvent(new SharedErrorEvent(aggegrateError));
      throw aggegrateError;
    }

    this.#flushed = true;
  }
}
