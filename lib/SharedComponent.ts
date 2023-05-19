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

import type { AnyRecord, Metadata, Tail, Workflow } from "../types.ts";
import { runWorkflow } from "../util.ts";

export class SharedEvent<Name extends string = string> {
  readonly name: Name;
  readonly message: string;

  constructor(name: Name, message: string) {
    this.name = name;
    this.message = message;
  }
}

export class SharedErrorEvent extends SharedEvent<"error"> {
  readonly error: AggregateError;

  constructor(error: AggregateError) {
    super("error", error.message);
    this.error = error;
  }
}

export type SharedEventListener<Event extends SharedEvent = SharedEvent> = (
  event: Event,
) => Promise<void>;

export type SharedEventListenerMap = Record<string, SharedEventListener>;

/**
 * The options for a shared component. This class is used internally by the library.
 * @template Ops The operations of this component.
 * @template Meta The metadata of this component.
 */
export interface SharedOptions<
  Ops extends Record<string, Workflow<any>>,
  Meta extends Metadata,
> {
  /** The name of this component. */
  readonly name?: string;
  /** The version of this component. */
  readonly version?: string;
  /** The tags of this component. */
  readonly tags?: string[];
  /** The metadata of this component. */
  readonly metadata?: Meta;
  /** The operations of this component. */
  readonly ops: Ops;
}

/**
 * A shared component. This class is used internally by the library.
 * @template Ops The operations of this component.
 * @template Meta The metadata of this component.
 */
export default class SharedComponent<
  Ops extends Record<string, Workflow<any>>,
  Meta extends AnyRecord = AnyRecord,
  EventMap extends SharedEventListenerMap = SharedEventListenerMap,
> {
  /** A unique identifier for this component. */
  readonly id = crypto.randomUUID();
  /** The name of this component. */
  readonly name: string;
  /** The version of this component. */
  readonly version?: string;
  /** The tags of this component. */
  readonly tags: string[];
  /** The metadata of this component. */
  readonly metadata: Meta;
  /** The operations of this component. */
  readonly ops: Ops;

  /** The listeners of this component. */
  #listeners = new Map<string, SharedEventListener[]>();

  constructor(options: SharedOptions<Ops, Meta>) {
    this.name = options.name ?? crypto.randomUUID();
    this.version = options.version;
    this.tags = options.tags ? [...options.tags] : [];
    this.metadata = options.metadata ? { ...options.metadata } : {} as Meta;
    this.ops = { ...options.ops };
  }

  /**
   * Add an event listener to this component.
   * @param name The name of the event.
   * @param listener The listener.
   * @returns This component.
   * @template Name The name of the event.
   */
  addEventListener<Name extends keyof EventMap>(
    name: Name,
    listener: EventMap[Name],
  ): void {
    const listeners = this.#listeners.get(name as string);
    if (listeners) {
      listeners.push(listener);
    } else {
      this.#listeners.set(name as string, [listener]);
    }
  }

  /**
   * Remove an event listener from this component.
   * @param name The name of the event.
   * @param listener The listener.
   * @returns This component.
   * @template Name The name of the event.
   */
  removeEventListener<Name extends keyof EventMap>(
    name: Name,
    listener: EventMap[Name],
  ): void {
    const listeners = this.#listeners.get(name as string);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (!listeners.length) {
        this.#listeners.delete(name as string);
      }
    }
  }

  /**
   * Dispatch an event to this component.
   * @param event The event.
   * @returns A promise that resolves when the event is done.
   * @throws If one or more listeners fail.
   */
  dispatchEvent(event: SharedEvent): void {
    const listeners = this.#listeners.get(event.name);
    if (listeners) {
      Promise.allSettled(
        listeners.map((listener) => listener(event)),
      ).then((results) =>
        results.filter((result): result is PromiseRejectedResult =>
          result.status === "rejected"
        )
      ).then((rejected) => {
        if (rejected.length) {
          this.dispatchEvent(
            new SharedErrorEvent(
              new AggregateError(
                rejected.map((result) => result.reason),
                "One or more listeners failed",
              ),
            ),
          );
        }
      });
    }
  }

  /**
   * Runs an operation. This method is used internally by the component.
   * @param name The name of the operation.
   * @param ctx The context.
   * @param tail The tail function.
   * @returns A promise that resolves when the operation is done.
   * @throws If the operation is not found.
   * @throws If the operation fails.
   * @throws If the tail fails.
   */
  protected op<Key extends keyof Ops>(
    name: Key,
    ctx: Ops[Key] extends Workflow<infer Ctx> ? Ctx : never,
    tail?: Tail<Ops[Key] extends Workflow<infer Ctx> ? Ctx : never>,
  ): Promise<void> {
    const op = this.ops[name];
    if (!op) {
      throw new Error(`Op ${op as string} not found`);
    }

    return runWorkflow(op, ctx, tail);
  }
}
