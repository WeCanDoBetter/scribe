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

export interface Procedure<Value> {
  name: string;
  value: Value;
}

/**
 * The API which is available to the node core user operations.
 * @template Ctx The context type.
 * @template Meta The metadata type.
 */
export default class NodeAPI<Ctx, Meta extends Metadata> {
  /** The node that this API belongs to. */
  readonly node: Node<Ctx, Meta>;

  /** The procedures that are registered. */
  #procedures = new Map<string, Procedure<any>>();

  constructor(node: Node<Ctx, Meta>) {
    this.node = node;
  }

  /**
   * Registers a procedure. A procedure is a function or value that can be called by the node core user operations.
   * @param name The name of the procedure.
   * @param value The procedure.
   */
  register<Value>(name: string, value: Value): this;
  /**
   * Registers a procedure. A procedure is a function or value that can be called by the node core user operations.
   * @param procedures The procedures to register.
   */
  register(...procedures: Procedure<any>[]): this;
  /**
   * Registers a procedure. A procedure is a function or value that can be called by the node core user operations.
   * @param nameOrProcedures The name of the procedure or the procedures to register.
   */
  register(...nameOrProcedures: (string | Procedure<any>)[]): this {
    if (!nameOrProcedures.length) {
      throw new Error("No procedures to register.");
    } else if (typeof nameOrProcedures[0] === "string" && nameOrProcedures.length === 2) {
      const [name, value] = nameOrProcedures as [string, any];
      this.#procedures.set(name, { name, value });
    } else {
      for (const procedure of nameOrProcedures as Procedure<any>[]) {
        this.#procedures.set(procedure.name, procedure);
      }
    }

    return this;
  }

  get<Value>(name: string): Value {
    const procedure = this.#procedures.get(name);
    if (!procedure) {
      throw new Error(`Procedure "${name}" is not registered.`);
    }

    return procedure.value;
  }
}
