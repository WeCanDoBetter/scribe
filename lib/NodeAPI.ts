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

import type { Metadata } from "../types.ts";
import type Node from "./Node.ts";

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
}
