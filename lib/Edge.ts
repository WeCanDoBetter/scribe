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
import type Node from "./Node.ts";
import SharedComponent from "./SharedComponent.ts";

/**
 * The operations that can be performed on an edge.
 */
interface Ops<Ctx> extends Record<string, Workflow<any>> {
  write: Workflow<Ctx>;
}

/**
 * An edge between two nodes.
 * @template Ctx The context type.
 * @template Meta The metadata type.
 */
export default class Edge<Ctx, Meta extends Metadata> extends SharedComponent<Ops<Ctx>, Meta> {
  readonly source: Node<Ctx, Metadata>;
  readonly target: Node<Ctx, Metadata>;

  constructor(
    source: Node<Ctx, Metadata>,
    target: Node<Ctx, Metadata>,
    options: SharedOptions<Ops<Ctx>, Meta>,
  ) {
    super(options);
    this.source = source;
    this.target = target;
  }

  /**
   * Writes to the target node.
   * @param ctx The context.
   * @returns A promise that resolves when the write is done.
   * @throws {AggregateError} If the write fails.
   */
  async write(ctx: Ctx): Promise<void> {
    try {
      await this.op(
        "write",
        ctx,
        () => this.target.write(this, ctx),
      );
    } catch (error) {
      const aggegrateError = new AggregateError(
        [error],
        "Failed to write to edge",
      );
      throw aggegrateError;
    }
  }
}
