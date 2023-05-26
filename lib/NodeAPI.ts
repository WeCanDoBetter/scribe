import type { Metadata } from "../types.ts";
import type Node from "./Node.ts";
import Output from "./Output.ts";

/**
 * The API which is available to the node core user operations.
 * @template Ctx The context type.
 * @template Meta The metadata type.
 */
export default class NodeAPI<Ctx, Meta extends Metadata> {
  /** The node that this API belongs to. */
  readonly node: Node<Ctx, Meta>;

  constructor(node: Node<Ctx, Meta>) {
    this.node = node;
  }

  /**
   * Create a new output. Edges can be queued to this output, and then flushed to send the context to the edges.
   * @returns The new output.
   */
  output(): Output<Ctx> {
    return new Output(this.node);
  }
}
